const { nftWords, commonWords, difficultWords } = require('./words')
const rooms = []
const publicRooms = [1]

const createRoom = (roomId, user) => {
  const room = {
    id: roomId,
    users: [user],
    round: 1,
    totalRounds: 3,
    drawTime: 80,
    drawerIndex: 0,
    drawer: '',
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

const getUsers = (roomId) => {
  const room = getRoom(roomId)
  return room.users
}

const getUserFromSocketId = (socketId) => {
  const room = getRoomFromSocketId(socketId)
  return room.users.find((user) => user.id === socketId)
}

const leaveRoom = (socketId) => {
  const roomId = getRoomFromSocketId(socketId)?.id
  const users = getRoomFromSocketId(socketId)?.users
  const index = users?.findIndex((user) => user.id === socketId)

  if (index !== -1) return { roomId: roomId, user: users?.splice(index, 1)[0] }
}

const deleteRoom = (roomId) => {
  const index = rooms.findIndex((room) => room.id == roomId)
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

const chooseDrawer = (room) => {
  room.drawerIndex =
    room.drawerIndex >= getUsers(room.id).length - 1 ? 0 : room.drawerIndex + 1
  room.drawer = getUsers(room.id)[room.drawerIndex]
}

const resetDrawingState = (room) => {
  room.drawerIndex = 0
  room.drawer = getUsers(room.id)[room.drawerIndex]
}

const resetUserPoints = (room) => {
  getUsers(room.id).forEach((user) => {
    console.log(user)
    user.points = 0
  })
}

module.exports = {
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
}
