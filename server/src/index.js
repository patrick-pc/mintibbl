const http = require('http')
const express = require('express')
const cors = require('cors')
const app = express()
const server = http.createServer(app)
const { instrument } = require('@socket.io/admin-ui')
const io = require('socket.io')(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
instrument(io, {
  auth: false,
})
app.use(cors())

const {
  createRoom,
  joinRoom,
  getRoom,
  getRoomFromSocketId,
  getUsers,
  getUserFromSocketId,
  leaveRoom,
  deleteRoom,
  getRandomWords,
} = require('./game')
const publicRooms = [1]

io.on('connection', (socket) => {
  socket.on('create_room', (address, name) => {
    const randomRoomId = Math.random().toString(36).slice(-6)
    const user = {
      id: socket.id,
      address: address,
      name: name,
      points: 0,
    }

    createRoom(randomRoomId, user)
    socket.join(randomRoomId)
    io.to(randomRoomId).emit('room_data', getRoom(randomRoomId))
  })

  socket.on('join_room', (roomId, address, name) => {
    const user = {
      id: socket.id,
      address: address,
      name: name,
      points: 0,
    }

    // If room is not defined, create public room
    if (!roomId) roomId = publicRooms[publicRooms.length - 1]
    console.log(`Room ID: ${roomId}`)

    // Check if room exists
    if (getRoom(roomId)) {
      // If room is full or game already started, create new public room
      if (getUsers(roomId).length >= 3 || getRoom(roomId).isGameStarted) {
        // change this
        roomId += 1
        publicRooms.push(roomId)
        createRoom(roomId, user)
      } else {
        joinRoom(roomId, user)
      }
    } else {
      createRoom(roomId, user)
    }

    socket.join(roomId)
    io.to(roomId).emit('room_data', getRoom(roomId))
  })

  socket.on('start_game', (totalRounds, drawTime) => {
    const room = getRoomFromSocketId(socket.id)

    room.isGameStarted = true
    room.round = 1
    room.totalRounds = totalRounds
    room.drawTime = drawTime
    room.drawerAddress = getUsers(room.id)[room.drawerIndex].address

    // change to select_words
    io.to(room.id).emit('select_word', {
      round: room.round,
      totalRounds: room.totalRounds,
      drawer: room.drawerAddress,
      words: getRandomWords(),
    })
  })

  socket.on('word_is', (word) => {
    const room = getRoomFromSocketId(socket.id)
    room.selectedWord = word

    io.to(room.id).emit('word_selected', room.selectedWord)

    room.drawnUsers.push(room.drawerAddress)

    // Run timer
    room.timer = room.drawTime
    room.interval = setInterval(() => {
      io.to(room.id).emit('timer', room.timer)

      if (room.timer === 0) {
        clearInterval(room.interval)

        // choose drawer
        room.drawerIndex =
          room.drawerIndex >= getUsers(room.id).length - 1
            ? 0
            : room.drawerIndex + 1
        // room.drawerIndex++
        console.log(`Drawer index: ${room.drawerIndex}`)
        room.drawerAddress = getUsers(room.id)[room.drawerIndex].address

        // check round
        if (room.drawnUsers.length === getUsers(room.id).length) {
          console.log('next_round')
          // Check if the game is over
          if (room.round == room.totalRounds) {
            console.log('Game over!')
            io.to(room.id).emit('game_over', getRoom(room.id))
            // callback()
          }

          room.round++
          room.drawerIndex = 0
          room.drawerAddress = getUsers(room.id)[room.drawerIndex].address
          room.drawnUsers = []
          room.guessedUsers = []
        }

        io.to(room.id).emit('end_turn', room.users)

        // room.timer = room.drawTime
      }

      room.timer -= 1
    }, 1000)
  })

  socket.on('send_message', (message, callback) => {
    console.log(`Message: ${message}`)

    const user = getUserFromSocketId(socket.id)
    const room = getRoomFromSocketId(socket.id)

    // Correct guess
    if (message === room.selectedWord) {
      // If not drawer and haven't guessed yet, emit message
      if (user.address !== room.drawerAddress) {
        clearInterval(room.interval)

        console.log(`${user.address} guessed the word!`)
        user.points += 100

        room.guessedUsers.push({
          id: user.id,
          address: user.address,
          name: user.name,
          points: 100,
        })

        io.to(room.id).emit('guessed_correctly', room.guessedUsers)
        io.to(room.id).emit('message', {
          sender: user.address,
          content: 'guessed the word!',
          color: 'green',
        })

        // If all users have drawn, start next round
        if (room.drawnUsers.length === getUsers(room.id).length) {
          console.log('next_round')
          // Check if the game is over
          if (room.round == room.totalRounds) {
            console.log('Game over!')
            io.to(room.id).emit('game_over', getRoom(room.id))

            callback()
          }

          // round increment
          // reset
          // end turn
          room.round++
          room.drawerIndex = 0
          room.drawerAddress = getUsers(room.id)[room.drawerIndex].address
          room.drawnUsers = []
          room.guessedUsers = []

          io.to(room.id).emit('end_turn', room.users)
        }

        // If all users have guessed, choose next drawer
        if (
          room.guessedUsers.length === getUsers(room.id).length - 1 ||
          room.timer === 0
        ) {
          // chooseDrawer()
          // reset
          // end turn
          room.drawerIndex =
            room.drawerIndex >= getUsers(room.id).length - 1
              ? 0
              : room.drawerIndex + 1
          // room.drawerIndex++
          console.log(`Drawer index: ${room.drawerIndex}`)
          room.drawerAddress = getUsers(room.id)[room.drawerIndex].address

          io.to(room.id).emit('end_turn', room.users)

          // Reset guessed users
          room.guessedUsers = []
        }
      }
    } else {
      io.to(room.id).emit('message', {
        sender: user.address,
        content: message,
        color: 'black',
      })
    }

    callback()
  })

  socket.on('start_turn', () => {
    const room = getRoomFromSocketId(socket.id)
    room.timer = room.drawTime

    console.log('start_turn')
    console.log(`Drawer index: ${room.drawerIndex}`)

    io.to(room.id).emit('select_word', {
      round: room.round,
      totalRounds: room.totalRounds,
      drawer: room.drawerAddress,
      words: getRandomWords(),
    })
    // clearInterval(room.interval)
  })

  socket.on('draw', (data) => {
    const room = getRoomFromSocketId(socket.id)
    io.to(room.id).emit('draw', data)
  })

  socket.on('disconnect', () => {
    console.log(`${socket.id} disconnected.`)
    const { roomId, user } = leaveRoom(socket.id)

    if (roomId && user) {
      clearInterval(getRoom(roomId).interval) // fix this
      io.to(roomId).emit('message', {
        sender: user.address,
        content: 'left.',
        color: 'red',
      })
      io.to(roomId).emit('room_data', getRoom(roomId))

      // TODO: Delete public room if empty
      // Delete room if empty
      if (getUsers(roomId).length === 0) deleteRoom(roomId)
    }
  })
})

server.listen(process.env.PORT || 3001, () =>
  console.log(`Server is running on port ${process.env.PORT || 3001}`)
)
