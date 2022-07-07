import { useState, useRef, useEffect } from 'react'
import { useAccount, useEnsName } from 'wagmi'
import Avatar from '../components/Avatar'
import toast from 'react-hot-toast'
import io from 'socket.io-client'
import immer from 'immer'
import DrawingBoard from '../components/DrawingBoard'

const socket = io.connect('http://localhost:3001')

const Home = () => {
  const { address } = useAccount()
  const { data: ensName } = useEnsName({
    address: address,
  })

  const [room, setRoom] = useState('')
  const [users, setUsers] = useState([])
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])
  const [connected, setConnected] = useState(false)

  const joinRoom = () => {
    if (address !== '' && room !== '') {
      socket.emit('join_room', room, address)
      setConnected(true)
    }
  }

  const sendMessage = () => {
    if (message) {
      socket.emit('sendMessage', message, () => setMessage(''))
    }
  }

  useEffect(() => {
    socket.on('roomData', ({ users }) => {
      setUsers(users)
    })

    socket.on('message', (message) => {
      setMessages([...messages, message])
    })
  }, [users, messages])

  return (
    <div className='flex flex-col items-center justify-center gap-8'>
      {!connected ? (
        <div>
          <Avatar address={address} size={100} />

          <div>{address ? address : ''}</div>

          <input
            type='text'
            placeholder='Room id'
            onChange={(e) => setRoom(e.target.value)}
          />

          <button onClick={joinRoom}>Join</button>
        </div>
      ) : (
        <div>
          <div>
            {users &&
              users.map((user) => {
                return (
                  <div key={user.id}>
                    <div>{user.address}</div>
                  </div>
                )
              })}
          </div>

          <div>
            {messages &&
              messages.map((message, i) => {
                return (
                  <div key={i}>
                    <div>{message.sender}</div>
                    <div>{message.content}</div>
                  </div>
                )
              })}
          </div>

          <input
            type='text'
            placeholder='Say something...'
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(event) => {
              event.key === 'Enter' && sendMessage()
            }}
          />

          <DrawingBoard socket={socket} />
        </div>
      )}
    </div>
  )
}

export default Home
