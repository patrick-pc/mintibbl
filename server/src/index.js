const express = require('express')

const app = express()
const PORT = process.env.PORT || 8080
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

const io = require('socket.io')(server, {
  cors: {
    origin: '*',
  },
})
console.log('socket.io server running')

io.sockets.on('connection', (socket) => {
  console.log('new connection')

  socket.on('draw', (data) => {
    console.log('draw')
    socket.broadcast.emit('draw', data)
  })
})
