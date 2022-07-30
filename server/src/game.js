const {
  nft_words,
  letter_a_to_letter_m_words,
  letter_n_to_letter_z_words,
} = require('./words')
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
    nft_words[Math.floor(Math.random() * nft_words.length)].toLowerCase(),
    letter_a_to_letter_m_words[
      Math.floor(Math.random() * letter_a_to_letter_m_words.length)
    ].toLowerCase(),
    letter_n_to_letter_z_words[
      Math.floor(Math.random() * letter_n_to_letter_z_words.length)
    ].toLowerCase(),
  ]

  return randomWords
}

const chooseDrawer = (room, socketId = '') => {
  if (socketId) {
    const drawnUserIndex = room.drawnUsers.findIndex(
      (user) => user.id === socketId
    )
    const guessedUserIndex = room.guessedUsers.findIndex(
      (user) => user.id === socketId
    )
    if (drawnUserIndex !== -1) room.drawnUsers.splice(drawnUserIndex, 1)[0]
    if (guessedUserIndex !== -1)
      room.guessedUsers.splice(guessedUserIndex, 1)[0]
  } else {
    room.drawerIndex =
      room.drawerIndex >= getUsers(room.id).length - 1
        ? 0
        : room.drawerIndex + 1
  }
  room.drawer = getUsers(room.id)[room.drawerIndex]
  room.drawnUsers.push(room.drawer)
}

const resetDrawingState = (room) => {
  room.drawerIndex = 0
  room.drawer = getUsers(room.id)[room.drawerIndex]
}

const resetUserPoints = (room) => {
  getUsers(room.id).forEach((user) => {
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
