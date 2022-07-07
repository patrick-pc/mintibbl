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

io.on('connection', (socket) => {
  socket.on('join_room', (room, address) => {
    socket.join(room)

    const { user } = addUser({
      id: socket.id,
      address: address,
      room: room,
    })

    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room),
    })
    // callback()
  })

  socket.on('sendMessage', (message) => {
    const user = getUser(socket.id)
    io.to(user.room).emit('message', { sender: user.address, content: message })

    // // If the user disconnects resend the room data to client
    // io.to(user.room).emit('roomData', {
    //   room: user.room,
    //   users: getUsersInRoom(user.room),
    // })
    // callback()
  })

  socket.on('draw', (data) => {
    const user = getUser(socket.id)
    io.to(user.room).emit('draw', data)
  })

  socket.on('disconnect', () => {
    const user = removeUser(socket.id)

    if (user) {
      io.to(user.room).emit('message', {
        sender: '',
        content: `${user.address} had left the game`,
      })

      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room),
      })
    }
  })
})

server.listen(process.env.PORT || 3001, () =>
  console.log(`Server has started.`)
)
