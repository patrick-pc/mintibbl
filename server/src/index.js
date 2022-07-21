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
  publicRooms,
  createRoom,
  joinRoom,
  getRoom,
  getRoomFromSocketId,
  getUsers,
  getUserFromSocketId,
  leaveRoom,
  deleteRoom,
  getRandomWords,
  chooseDrawer,
  resetDrawingState,
  resetUserPoints,
} = require('./game')
let interval

io.on('connection', (socket) => {
  socket.on('create_room', (address, name) => {
    // Generate random id
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

  socket.on('join_room', (roomId, address, name, callback) => {
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
      // If room is full, create new public room
      if (getUsers(roomId).length >= 3) {
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
    callback(getRoom(roomId))
  })

  socket.on('start_game', (totalRounds, drawTime) => {
    const room = getRoomFromSocketId(socket.id)

    room.isGameStarted = true
    room.isGameOver = false
    room.newRound = true
    room.round = 1
    room.totalRounds = totalRounds
    room.drawTime = drawTime
    room.words = getRandomWords()
    resetDrawingState(room)
    resetUserPoints(room)

    // io.to(room.id).emit('select_word', {
    //   newRound: room.newRound,
    //   round: room.round,
    //   totalRounds: room.totalRounds,
    //   drawer: room.drawer,
    //   words: getRandomWords(),
    // })
    io.to(room.id).emit('select_word', room)
  })

  socket.on('word_is', (word) => {
    console.log('word_is')
    const room = getRoomFromSocketId(socket.id)
    room.selectedWord = word
    room.drawnUsers.push(room.drawer)

    io.to(room.id).emit('word_selected', room.selectedWord)

    // Run timer
    room.timer = room.drawTime - 1
    interval = setInterval(() => {
      io.to(room.id).emit('timer', room.timer)
      if (room.timer === 0) {
        clearInterval(interval)
        chooseDrawer(room)
        // If all users have drawn, start next round
        if (room.drawnUsers.length === getUsers(room.id).length) {
          // Check if the game is over
          if (room.round == room.totalRounds) {
            console.log('Game over!')
            room.isGameOver = true
            io.to(room.id).emit('game_over', getRoom(room.id))
          }
          room.round++
          room.newRound = true
          resetDrawingState(room)
        } else {
          room.newRound = false
        }
        io.to(room.id).emit('end_turn', room)
        room.guessedUsers = []
      }
      room.timer -= 1
    }, 1000)
  })

  socket.on('send_message', (message, callback) => {
    console.log(`Message: ${message}`)

    const user = getUserFromSocketId(socket.id)
    const room = getRoomFromSocketId(socket.id)

    // Correct guess
    if (message.toLowerCase() === room.selectedWord.toLowerCase()) {
      // If not drawer and haven't guessed yet, emit message
      if (user.id !== room.drawer.id) {
        room.guessedUsers.push({
          id: user.id,
          address: user.address,
          name: user.name,
          points: 100, // Points for this turn
        })
        user.points += 100 // Total points

        // Notify the client
        io.to(room.id).emit('guessed_correctly', room.guessedUsers)
        io.to(room.id).emit('message', {
          sender: user.name,
          content: 'guessed the word!',
          color: 'green',
        })
        console.log(`${user.name} guessed the word!`)

        // If all users have drawn, start next round
        if (room.drawnUsers.length === getUsers(room.id).length) {
          clearInterval(interval)

          // Check if the game is over
          if (room.round == room.totalRounds) {
            console.log('Game over!')
            room.isGameOver = true
            io.to(room.id).emit('game_over', getRoom(room.id))

            callback()
          }

          room.round++
          room.newRound = true
          resetDrawingState(room)

          io.to(room.id).emit('end_turn', room)
        }

        // If all users have guessed, choose next drawer
        if (room.guessedUsers.length === getUsers(room.id).length - 1) {
          clearInterval(interval)
          chooseDrawer(room)
          room.newRound = false
          io.to(room.id).emit('end_turn', room)
          room.guessedUsers = []
        }
      }
    } else {
      io.to(room.id).emit('message', {
        sender: user.name,
        content: message,
        color: 'black',
      })
    }

    callback()
  })

  socket.on('start_turn', () => {
    const room = getRoomFromSocketId(socket.id)
    room.words = getRandomWords()
    room.timer = room.drawTime

    // io.to(room.id).emit('select_word', {
    //   newRound: room.newRound,
    //   round: room.round,
    //   totalRounds: room.totalRounds,
    //   drawer: room.drawer,
    //   words: getRandomWords(),
    // })
    io.to(room.id).emit('select_word', room)
  })

  socket.on('draw', (data) => {
    const room = getRoomFromSocketId(socket.id)
    room.drawing = data
    io.to(room.id).emit('draw', data)
  })

  socket.on('disconnect', () => {
    console.log(`${socket.id} disconnected.`)
    const { roomId, user } = leaveRoom(socket.id)

    if (roomId && user) {
      // TODO: clearInterval
      io.to(roomId).emit('message', {
        sender: user.name,
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
