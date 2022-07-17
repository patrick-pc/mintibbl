const { nftWords, commonWords, difficultWords } = require('./words')
const rooms = []

const createRoom = (roomId, user) => {
  const room = {
    id: roomId,
    users: [user],
    isGameStarted: false,
    round: 1,
    totalRounds: 3,
    drawTime: 80,
    drawerIndex: 0,
    drawerAddress: '',
    selectedWord: '',
    drawnUsers: [],
    guessedUsers: [],
  }
  rooms.push(room)
}

const joinRoom = (roomId, user) => {
  getRoom(roomId).users.push(user)
}

const getRoom = (roomId) => rooms.find((room) => room.id === roomId)

const getRoomFromSocketId = (socketId) =>
  rooms.find((room) => room.users.find((user) => user.id === socketId))

// const getUsers = (roomId) => rooms.find((room) => room.id === roomId)?.users
const getUsers = (roomId) => {
  const room = getRoom(roomId)
  if (room) return room.users
}

// const getUserFromSocketId = (socketId) =>
//   getRoomFromSocketId(socketId)?.users.find((user) => user.id === socketId)
const getUserFromSocketId = (socketId) => {
  const room = getRoomFromSocketId(socketId)
  if (room) return room.users.find((user) => user.id === socketId)
}

const leaveRoom = (socketId) => {
  const roomId = getRoomFromSocketId(socketId)?.id
  const users = getRoomFromSocketId(socketId)?.users
  const index = users?.findIndex((user) => user.id === socketId)

  if (index !== -1) return { roomId: roomId, user: users?.splice(index, 1)[0] }
}

const deleteRoom = (roomId) => {
  const index = rooms.findIndex((room) => room.id === roomId)
  if (index !== -1) rooms.splice(index, 1)[0]
}

const getRandomWords = () => {
  const randomWords = [
    nftWords[Math.floor(Math.random() * nftWords.length)].toLowerCase(),
    commonWords[Math.floor(Math.random() * commonWords.length)].toLowerCase(),
    difficultWords[
      Math.floor(Math.random() * difficultWords.length)
    ].toLowerCase(),
  ]

  return randomWords
}

// const chooseDrawer = (roomId) => {
//   const room = getRoom(roomId)
//   const users = getUsers(roomId)
//   room.drawerIndex = room.drawerIndex >= users.length - 1 ? 0 : room.drawerIndex + 1
//   room.drawerAddress = users[drawerIndex].address
// }

module.exports = {
  createRoom,
  joinRoom,
  getRoom,
  getRoomFromSocketId,
  getUsers,
  getUserFromSocketId,
  leaveRoom,
  deleteRoom,
  getRandomWords,
}
