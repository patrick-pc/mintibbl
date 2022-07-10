const http = require('http')
const express = require('express')
const cors = require('cors')
const app = express()
const server = http.createServer(app)
const io = require('socket.io')(server, {
  cors: {
    origin: '*',
  },
})
app.use(cors())
const { addUser, removeUser, getUser, getUsersInRoom } = require('./user')

let drawer = ''
let selectedWord = ''
io.on('connection', (socket) => {
  socket.on('join_room', (room, address) => {
    socket.join(room)

    const { user } = addUser({
      id: socket.id,
      address: address,
      room: room,
    })

    io.to(user.room).emit('new_user', getUsersInRoom(user.room))

    io.to(user.room).emit('message', {
      sender: user.address,
      content: 'joined.',
      color: 'green',
    })

    // Start game if users are >= 2
    if (getUsersInRoom(user.room).length >= 2) {
      drawer = getUsersInRoom(user.room)[1]

      setTimeout(() => {
        console.log('game started')
        io.to(user.room).emit('game_started', {
          drawer: drawer.address,
          words: ['cryptopunks', 'bored ape yacht club', 'fidenza'],
        })
      }, 1000)
    }
  })

  socket.on('word_selected', (word) => {
    const user = getUser(socket.id)
    console.log(word)
    selectedWord = word

    io.to(user.room).emit('word', selectedWord)
  })

  socket.on('send_message', (message, callback) => {
    console.log(message)

    const user = getUser(socket.id)

    console.log(user)
    console.log(drawer)

    // Correct guess
    if (message === selectedWord) {
      // Guess if not drawer
      if (user.id !== drawer.id) {
        console.log('guessed correctly')

        // emit
        io.to(user.room).emit('guessed_correctly', user.address)
        io.to(user.room).emit('message', {
          sender: user.address,
          content: 'guessed the word!',
          color: 'green',
        })
      }
    } else {
      io.to(user.room).emit('message', {
        sender: user.address,
        content: message,
        color: 'black',
      })
    }

    callback()
  })

  socket.on('draw', (data) => {
    const user = getUser(socket.id)
    io.to(user.room).emit('draw', data)
  })

  socket.on('disconnect', () => {
    const user = removeUser(socket.id)

    if (user) {
      io.to(user.room).emit('message', {
        sender: user.address,
        content: 'left.',
        color: 'red',
      })

      io.to(user.room).emit('new_user', getUsersInRoom(user.room))
    }
  })
})

server.listen(process.env.PORT || 3001, () =>
  console.log(`Server has started.`)
)
