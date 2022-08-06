const http = require('http')
const express = require('express')
const cors = require('cors')
const app = express()
const server = http.createServer(app)
const { instrument } = require('@socket.io/admin-ui')
const io = require('socket.io')(server, {
  cors: [
    {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  ],
  transports: ['websocket'],
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
const { MIN_PLAYERS_PER_ROOM, MAX_PLAYERS_PER_ROOM } = require('./config')
let interval

io.on('connection', (socket) => {
  socket.on('create_room', (address, ensName, name) => {
    // Generate random id
    const randomRoomId = `P${Math.random()
      .toString(36)
      .slice(-6)
      .toUpperCase()}`
    const user = {
      id: socket.id,
      address: address,
      ensName: ensName,
      name: name,
      points: 0,
    }

    createRoom(randomRoomId, user)
    socket.join(randomRoomId)
    io.to(randomRoomId).emit('room_data', getRoom(randomRoomId))
    io.to(randomRoomId).emit('message', {
      sender: user.name,
      content: 'joined.',
      color: '#84CC16',
    })
  })

  socket.on('join_room', (roomId, address, ensName, name, callback) => {
    const user = {
      id: socket.id,
      address: address,
      ensName: ensName,
      name: name,
      points: 0,
    }

    // If room is not defined, create public room
    if (!roomId) roomId = publicRooms[publicRooms.length - 1]
    console.log(`Room ID: ${roomId}`)

    // Check if room exists
    if (getRoom(roomId)) {
      // If room is full, create new public room
      if (getUsers(roomId).length >= MAX_PLAYERS_PER_ROOM) {
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
    io.to(roomId).emit('message', {
      sender: user.name,
      content: 'joined.',
      color: '#84CC16',
    })
    callback(getRoom(roomId))
  })

  socket.on('wallet_connected', (roomId, address, ensName, name) => {
    const room = getRoom(roomId)

    if (room) {
      room.users.find((user) => {
        if (user.id === socket.id) {
          user.address = address
          user.ensName = ensName
          ensName ? (user.name = ensName) : (user.name = name)
        }
      })

      io.to(roomId).emit('room_data', getRoom(roomId))
    }
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
    room.drawnUsers = []
    room.guessedUsers = []
    room.selectedWord = ''
    room.isDrawing = true
    resetDrawingState(room)
    resetUserPoints(room)

    io.to(room.id).emit('select_word', room)
  })

  socket.on('word_is', (word) => {
    const room = getRoomFromSocketId(socket.id)
    room.selectedWord = word

    io.to(room.id).emit('word_selected', room.selectedWord)
    io.to(room.id).emit('message', {
      sender: room.drawer.name,
      content: 'is drawing now!',
      color: '#8B5CF6',
    })

    // Run timer
    room.timer = room.drawTime - 1
    interval = setInterval(() => {
      io.to(room.id).emit('timer', room.timer)
      if (room.timer === 0) {
        console.log('timer is 0')

        io.to(room.id).emit('message', {
          sender: 'The word was ',
          content: `"${room.selectedWord}"`,
          color: '#84CC16',
        })

        clearInterval(interval)
        chooseDrawer(room)

        // If all users have drawn, start next round
        if (room.drawnUsers.length === getUsers(room.id).length) {
          console.log('timer: end_round')

          // Check if the game is over
          if (room.round == room.totalRounds) {
            console.log('Game over!')
            room.isGameStarted = false
            room.isGameOver = true
            io.to(room.id).emit('game_over', getRoom(room.id))
          }
          room.round++
          room.newRound = true
          resetDrawingState(room)

          io.to(room.id).emit('end_turn', room)
          room.drawnUsers = []
          room.selectedWord = ''
        } else {
          console.log('timer: end_turn')

          room.newRound = false
          io.to(room.id).emit('end_turn', room)
        }
        room.timer = room.drawTime
        room.guessedUsers = []
        room.isDrawing = false
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
      if (
        room.isDrawing &&
        user.id !== room.drawer.id &&
        !room.guessedUsers.find((guessedUser) => guessedUser.id === user.id)
      ) {
        // TODO: Make point system more dynamic
        let points = 0
        if (room.guessedUsers.length === 0) {
          points = 400
        } else if (room.guessedUsers.length === 1) {
          points = 350
        } else if (room.guessedUsers.length === 2) {
          points = 300
        } else if (room.guessedUsers.length === 3) {
          points = 250
        } else if (room.guessedUsers.length === 4) {
          points = 200
        } else if (room.guessedUsers.length === 5) {
          points = 150
        }

        room.guessedUsers.push({
          id: user.id,
          address: user.address,
          name: user.name,
          points: points, // Points for this turn
        })
        user.points += points // Total points

        // Notify the client
        io.to(room.id).emit('message', {
          sender: user.name,
          content: 'guessed the word!',
          color: '#84CC16',
        })
        io.to(room.id).emit('guessed_correctly') // For sound fx
        console.log(`${user.name} guessed the word!`)

        // If all users have guessed, choose next drawer
        if (room.guessedUsers.length === getUsers(room.id).length - 1) {
          console.log('all users have guessed')

          io.to(room.id).emit('message', {
            sender: 'The word was ',
            content: `"${room.selectedWord}"`,
            color: '#84CC16',
          })

          clearInterval(interval)
          chooseDrawer(room)

          // If all users have drawn, start next round
          if (room.drawnUsers.length === getUsers(room.id).length) {
            console.log('end_round')

            // Check if the game is over
            if (room.round == room.totalRounds) {
              console.log('Game over!')
              room.isGameStarted = false
              room.isGameOver = true
              io.to(room.id).emit('game_over', getRoom(room.id))

              callback()
            }

            room.round++
            room.newRound = true
            resetDrawingState(room)

            io.to(room.id).emit('end_turn', room)
            room.drawnUsers = []
            room.selectedWord = ''
          } else {
            console.log('end_turn')

            room.newRound = false
            io.to(room.id).emit('end_turn', room)
          }
          room.timer = room.drawTime
          room.guessedUsers = []
          room.isDrawing = false
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
    console.log('start_turn')

    const room = getRoomFromSocketId(socket.id)
    room.words = getRandomWords()
    room.isDrawing = true

    io.to(room.id).emit('select_word', room)
  })

  socket.on('drawing', (data) => {
    const room = getRoomFromSocketId(socket.id)
    io.to(room.id).emit('drawing', data)
  })

  socket.on('clear', () => {
    const room = getRoomFromSocketId(socket.id)
    io.to(room.id).emit('clear')
  })

  socket.on('start_lobby_timer', (timer) => {
    const room = getRoomFromSocketId(socket.id)
    io.to(room.id).emit('lobby_timer', timer)
  })

  socket.on('kick', (drawer, callback) => {
    if (drawer.id !== socket.id) {
      io.sockets.sockets.get(drawer.id).disconnect(true)
    } else {
      callback('You cannot kick yourself!')
    }
  })

  socket.on('disconnect', () => {
    console.log(`${socket.id} disconnected.`)
    const { roomId, user } = leaveRoom(socket.id)
    const room = getRoom(roomId)

    if (!room || room.users.length === 0) return
    // if (room && user) {
    // End game if one user left
    if (getUsers(roomId).length === 1) {
      clearInterval(interval)
      room.isGameStarted = false
      room.isGameOver = true
      io.to(roomId).emit('game_over', room)
    }

    // End turn if drawer leaves
    if (user.id === room.drawer.id) {
      clearInterval(interval)
      chooseDrawer(room, socket.id)

      // If all users have drawn, start next round
      if (room.drawnUsers.length === getUsers(room.id).length) {
        console.log('end_round')

        // Check if the game is over
        if (room.round == room.totalRounds) {
          console.log('Game over!')
          room.isGameStarted = false
          room.isGameOver = true
          io.to(room.id).emit('game_over', getRoom(room.id))
        }

        room.round++
        room.newRound = true
        resetDrawingState(room)

        io.to(room.id).emit('end_turn', room)
        room.drawnUsers = []
        room.selectedWord = ''
      } else {
        console.log('end_turn')

        room.newRound = false
        io.to(room.id).emit('end_turn', room)
      }
      room.timer = room.drawTime
      room.guessedUsers = []
      room.isDrawing = false
    }

    io.to(roomId).emit('message', {
      sender: user.name,
      content: 'left.',
      color: '#EF4444',
    })
    io.to(roomId).emit('room_data', room)

    // Delete room if empty
    if (getUsers(roomId).length === 0) deleteRoom(roomId)
    // }
  })
})

server.listen(process.env.PORT || 3001, () =>
  console.log(`Server is running on port ${process.env.PORT || 3001}`)
)
