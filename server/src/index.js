const http = require('http')
const express = require('express')
const cors = require('cors')
const app = express()
const server = http.createServer(app)
const { instrument } = require('@socket.io/admin-ui')
const io = require('socket.io')(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'https://mintibbl.herokuapp.com/',
      'https://admin.socket.io',
    ],
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
  socket.on('create_room', (address) => {
    const randomRoomId = Math.random().toString(36).slice(-6)
    const user = {
      id: socket.id,
      address: address,
      points: 0,
    }

    createRoom(randomRoomId, user)
    socket.join(randomRoomId)
    io.to(randomRoomId).emit('room_data', getRoom(randomRoomId))
  })

  socket.on('join_room', (roomId, address) => {
    const user = {
      id: socket.id,
      address: address,
      points: 0,
    }

    // If room is not defined, create public room
    if (!roomId) roomId = publicRooms[publicRooms.length - 1]
    console.log(roomId)

    // Check if room exists
    if (getRoom(roomId)) {
      // If full or game already started, create new public room
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

    io.to(room.id).emit('game_started', {
      round: room.round,
      totalRounds: room.totalRounds,
      drawer: room.drawerAddress,
      words: getRandomWords(),
    })
  })

  socket.on('word_selected', (word) => {
    const room = getRoomFromSocketId(socket.id)
    room.selectedWord = word

    io.to(room.id).emit('word', room.selectedWord)

    // Run timer
    // const interval = setInterval(() => {
    //   room.drawTime -= 1
    //   io.to(room.id).emit('draw_time', room.drawTime)

    //   if (room.drawTime === 0) {
    //     // If all users have drawn, start next round
    //     if (room.drawnUsers.length === getUsers(room.id).length) {
    //       room.round++
    //       room.drawerIndex = 0
    //       room.drawerAddress = getUsers(room.id)[room.drawerIndex].address
    //       room.drawnUsers = []
    //       room.guessedUsers = []
    //       // room.words = []
    //       // room.selectedWord =''

    //       io.to(room.id).emit('select_word', {
    //         round: room.round,
    //         drawer: room.drawerAddress,
    //         words: getRandomWords(),
    //       })
    //     }

    //     // Check if game is over
    //     if (room.round === room.totalRounds) {
    //       console.log('Game over!')
    //       io.to(room.id).emit('game_over', getRoom(room.id))
    //     }

    //     room.drawerIndex++
    //     room.drawerAddress = getUsers(room.id)[room.drawerIndex].address

    //     io.to(room.id).emit('select_word', {
    //       round: room.round,
    //       drawer: room.drawerAddress,
    //       words: getRandomWords(),
    //     })

    //     // Reset guessed users
    //     room.guessedUsers = []
    //     room.drawTime = 80 // TODO: make this dynamic

    //     clearInterval(interval)
    //   }
    // }, 1000)
  })

  socket.on('send_message', (message, callback) => {
    console.log(message)

    const user = getUserFromSocketId(socket.id)
    const room = getRoomFromSocketId(socket.id)

    // Correct guess
    if (message === room.selectedWord) {
      // If not drawer and haven't guessed yet, emit message
      if (user.address !== room.drawerAddress) {
        console.log(`${user.address} guessed the word!`)
        user.points += 100

        room.drawnUsers.push(room.drawerAddress) // Prev drawer
        room.guessedUsers.push(user.address)

        io.to(room.id).emit('guessed_correctly', room.guessedUsers)
        io.to(room.id).emit('message', {
          sender: user.address,
          content: 'guessed the word!',
          color: 'green',
        })

        // If all users have drawn, start next round
        if (room.drawnUsers.length === getUsers(room.id).length) {
          // Check if the game is over
          if (room.round == room.totalRounds) {
            console.log('Game over!')
            io.to(room.id).emit('game_over', getRoom(room.id))

            callback()
          }

          room.round++
          room.drawerIndex = 0
          room.drawerAddress = getUsers(room.id)[room.drawerIndex].address
          room.drawnUsers = []
          room.guessedUsers = []
          // room.words = []
          // room.selectedWord =''

          io.to(room.id).emit('select_word', {
            round: room.round,
            totalRounds: room.totalRounds,
            drawer: room.drawerAddress,
            words: getRandomWords(),
          })
        }
      }

      // If all users have guessed or time is up, choose next drawer
      if (
        room.guessedUsers.length === getUsers(room.id).length - 1 ||
        room.drawTime === 0
      ) {
        room.drawerIndex++
        room.drawerAddress = getUsers(room.id)[room.drawerIndex].address

        io.to(room.id).emit('select_word', {
          round: room.round,
          totalRounds: room.totalRounds,
          drawer: room.drawerAddress,
          words: getRandomWords(),
        })

        // Reset guessed users
        room.guessedUsers = []
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

  socket.on('draw', (data) => {
    const room = getRoomFromSocketId(socket.id)
    io.to(room.id).emit('draw', data)
  })

  socket.on('disconnect', () => {
    console.log(`${socket.id} disconnected.`)
    const { roomId, user } = leaveRoom(socket.id)

    if (roomId && user) {
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

io.listen(process.env.PORT || 3001)
// server.listen(process.env.PORT || 3001, () =>
//   console.log(`Server is running on port ${process.env.PORT || 3001}`)
// )
