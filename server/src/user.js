const users = []

const addUser = ({ id, address, room }) => {
  // address = address.trim().toLowerCase()
  room = room.trim().toLowerCase()

  const existingUser = users.find((user) => {
    user.room === room && user.address === address
  })

  if (existingUser) return { error: 'Address is already connected!' }
  const user = { id, address, room }

  users.push(user)
  return { user }
}

const removeUser = (id) => {
  const index = users.map((user) => user.id).indexOf(id)

  if (index !== -1) return users.splice(index, 1)[0]
}

const getUser = (id) => users.find((user) => user.id === id)

const getUsersInRoom = (room) => users.filter((user) => user.room === room)

module.exports = { addUser, removeUser, getUser, getUsersInRoom }
