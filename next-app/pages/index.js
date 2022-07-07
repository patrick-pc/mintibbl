import { useState, useRef, useEffect } from 'react'
import { useAccount, useEnsName } from 'wagmi'
import io from 'socket.io-client'
import Avatar from '../components/Avatar'
import DrawingBoard from '../components/DrawingBoard'
import { shortenAddress } from '../utils/shortenAddress'

import Join from '../components/Join'

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
      socket.emit('sendMessage', message, () => {
        setMessage('')
      })
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
    <div>
      {!connected ? (
        <Join address={address} setRoom={setRoom} joinRoom={joinRoom} />
      ) : (
        <div>
          <div className='flex flex-col md:flex-row justify-center gap-4 mb-16'>
            <div className='flex flex-col w-80 h-[600px] border gap-4 p-2'>
              {users &&
                users.map((user) => {
                  return (
                    <div
                      className='flex flex-row items-center border-b p-4 gap-4'
                      key={user.id}
                    >
                      <Avatar address={user.address} size={50} />
                      <div>{shortenAddress(user.address)}</div>
                    </div>
                  )
                })}
            </div>

            <DrawingBoard socket={socket} />
            <div className='flex flex-col justify-between w-96 h-[600px] border gap-4 p-2'>
              <div className='flex flex-col'>
                {messages &&
                  messages.map((message, i) => {
                    return (
                      <div
                        className='flex gap-2 p-2 even:bg-gray-50 odd:bg-gray-100'
                        key={i}
                      >
                        <div className='text-sm'>
                          <span className='font-medium mr-2'>
                            {message.sender && shortenAddress(message.sender)}
                          </span>
                          <span>{message.content}</span>
                        </div>
                      </div>
                    )
                  })}
              </div>
              <div>
                <input
                  className='input input-bordered w-full'
                  type='text'
                  placeholder='Say something...'
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(event) => {
                    event.key === 'Enter' && sendMessage()
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Home
