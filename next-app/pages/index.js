import { useRouter } from 'next/router'
import { useState, useRef, useEffect } from 'react'
import {
  useAccount,
  useEnsName,
  useProvider,
  useSigner,
  useContract,
} from 'wagmi'
import io from 'socket.io-client'
import Avatar from '../components/Avatar'
import DrawingBoard from '../components/DrawingBoard'
import { CirclePicker } from 'react-color'
import { shortenAddress } from '../utils/shortenAddress'
import axios from 'axios'
import { CONTRACT_ADDRESS, ABI } from '../constants'
import toast from 'react-hot-toast'

import Join from '../components/Join'
import Lobby from '../components/Lobby'

const socket = io.connect('http://localhost:3001')

// if room is not set, public play
// else private play join private room
const Home = () => {
  const router = useRouter()
  const { pid } = router.query

  const [room, setRoom] = useState('')
  useEffect(() => {
    if (!pid) return

    setRoom(pid)
  }, [pid])

  const { address } = useAccount()
  const { data: ensName } = useEnsName({
    address: address,
  })

  const [isGameHost, setIsGameHost] = useState(false)
  const [isGameOn, setIsGameOn] = useState(false)

  const [users, setUsers] = useState([])
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])

  const [drawer, setDrawer] = useState('')
  const [words, setWords] = useState([])
  const [selectedWord, setSelectedWord] = useState('')
  const [guessedUsers, setGuessedUsers] = useState('')

  const canvas = useRef(null)
  const [color, setColor] = useState('#000000')
  const [isMining, setIsMining] = useState(false)

  const provider = useProvider()
  const signer = useSigner()

  const mintibbleContract = useContract({
    addressOrName: CONTRACT_ADDRESS,
    contractInterface: ABI,
    signerOrProvider: signer.data || provider,
  })

  const updateColor = (value) => {
    console.log(
      `rgba(${value.rgb.r},${value.rgb.g},${value.rgb.b},${value.rgb.a})`
    )
    setColor(
      `rgba(${value.rgb.r},${value.rgb.g},${value.rgb.b},${value.rgb.a})`
    )
  }

  const [inLobby, setInLobby] = useState(false)

  const createRoom = () => {
    if (address !== '') {
      console.log('create room')
      if (room !== '') {
        router.replace('/', undefined, { shallow: true })
      }

      socket.emit('create_room', address)
      setInLobby(true)
    }
  }

  const joinRoom = () => {
    if (address !== '') {
      socket.emit('join_room', room, address)
      // console.log(room)
      // setIsGameOn(true)
      setInLobby(true)
    }
  }

  const startGame = () => {
    console.log(room)
    socket.emit('start_game', room)
  }

  const sendMessage = () => {
    if (message) {
      socket.emit('send_message', message, () => {
        setMessage('')
      })
    }
  }

  useEffect(() => {
    socket.on('new_user', (users) => {
      console.log(users)
      setUsers(users)
      setIsGameHost(address === users[0].address)
    })

    socket.on('message', (message) => {
      setMessages([...messages, message])
    })
  }, [users, messages])

  useEffect(() => {
    socket.on('game_started', (game) => {
      console.log(game)
      setDrawer(game.drawer)
      setWords(game.words)
      setIsGameOn(true)
    })

    socket.on('word', (word) => {
      setSelectedWord(word)
    })

    socket.on('guessed_correctly', (address) => {
      console.log(address)
      setGuessedUsers(address)
      console.log(guessedUsers)
    })
  }, [socket])

  const pinToIPFS = async (name, description, dataURL) => {
    try {
      const data = JSON.stringify({
        pinataOptions: {
          cidVersion: 1,
        },
        pinataMetadata: {
          name: 'Mintibble',
        },
        pinataContent: {
          name: name,
          description: description,
          image: dataURL,
        },
      })
      const config = {
        method: 'post',
        url: 'https://api.pinata.cloud/pinning/pinJSONToIPFS',
        headers: {
          'Content-Type': 'application/json',
          pinata_api_key: `${process.env.NEXT_PUBLIC_PINATA_API_KEY}`,
          pinata_secret_api_key: `${process.env.NEXT_PUBLIC_PINATA_API_SECRET}`,
        },
        data: data,
      }
      const res = await axios(config)

      return `https://ipfs.io/ipfs/${res.data.IpfsHash}`
    } catch (error) {
      console.log(error)
    }
  }

  const mintDrawing = async () => {
    try {
      const metadataURI = await pinToIPFS(
        'Mintibble Drawing',
        'Test',
        canvas.current.getDataURL()
      )

      const txResponse = await mintibbleContract.mintDrawing(metadataURI)
      setIsMining(true)
      await txResponse.wait()

      toast('Minted drawing!', {
        icon: '🎉',
      })
    } catch (error) {
      console.error(error)

      if (error.code == 4001) {
        toast.error(error.message)
      } else {
        toast.error('Something went wrong.')
      }
    }

    setIsMining(false)
  }

  return (
    <div>
      {!isGameOn ? (
        inLobby && users ? (
          <Lobby users={users} startGame={startGame} isGameHost={isGameHost} />
        ) : (
          <Join address={address} createRoom={createRoom} joinRoom={joinRoom} />
        )
      ) : (
        <div className='flex flex-col container overflow-hidden gap-4 mx-auto'>
          <div className='flex items-center justify-between border p-2'>
            <div className='text-lg font-medium'>Round 1 of 3</div>

            <div>
              {selectedWord && (
                <div className='text-center text-3xl'>
                  {drawer === address ? (
                    <span className='tracking-wide font-medium'>
                      {selectedWord}
                    </span>
                  ) : (
                    <span className='tracking-[.25em] font-light'>
                      {selectedWord.replace(/\S/gi, '_')}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='h-6 w-6'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
                strokeWidth={2}
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
            </div>
          </div>

          <div className='flex flex-col md:flex-row justify-center w-full gap-4 mb-4 mx-auto'>
            <div className='flex flex-col w-full h-[600px] border gap-4 p-2'>
              {users &&
                users.map((user) => {
                  return (
                    <div
                      className='flex flex-row items-center border-b p-4 gap-4'
                      key={user.id}
                    >
                      <Avatar
                        address={user.address}
                        size={40}
                        isDrawer={user.address === drawer}
                      />
                      <div
                        className={user.address === address && 'text-blue-500'}
                      >
                        {shortenAddress(user.address)}
                      </div>
                    </div>
                  )
                })}
            </div>

            <div
              className={`relative ${
                drawer !== address ||
                (guessedUsers === address && 'pointer-events-none')
              }`}
            >
              <div
                className={`absolute h-full w-full top-0 left-0 bg-black opacity-10 z-10 ${
                  !selectedWord ? 'block' : 'hidden'
                }`}
              ></div>
              <div
                className={`absolute flex items-center justify-center h-full w-full gap-4 z-20 ${
                  !selectedWord ? 'block' : 'hidden'
                }`}
              >
                {drawer === address &&
                  words.map((word) => {
                    return (
                      <button
                        className='btn btn-outline btn-xs'
                        onClick={() => {
                          socket.emit('word_selected', word)
                          setWords([])
                        }}
                      >
                        {word}
                      </button>
                    )
                  })}
              </div>

              <div
                className={`absolute h-full w-full top-0 left-0 bg-black opacity-10 z-10 ${
                  guessedUsers === address ? 'block' : 'hidden'
                }`}
              ></div>
              <div
                className={`absolute flex items-center justify-center h-full w-full gap-4 z-20 ${
                  guessedUsers === address ? 'block' : 'hidden'
                }`}
              >
                <button
                  className='btn bg-amber-500 border border-amber-500 px-16'
                  onClick={mintDrawing}
                  disabled={isMining}
                >
                  {isMining ? 'Minting...' : 'Mint'}
                </button>
              </div>

              <DrawingBoard socket={socket} canvas={canvas} color={color} />
            </div>

            <div className='flex flex-col justify-between w-full h-[600px] border gap-4 p-2'>
              <div className='flex flex-col overflow-y-auto'>
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
                  placeholder='Type your guess here...'
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(event) => {
                    event.key === 'Enter' && sendMessage()
                  }}
                />
              </div>
            </div>
          </div>

          <div className='flex items-center justify-center mb-16'>
            <CirclePicker color={color} onChangeComplete={updateColor} />
          </div>
        </div>
      )}
    </div>
  )
}

export default Home
