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
import generateName from 'sillyname'
import toast from 'react-hot-toast'
import axios from 'axios'
import { CirclePicker } from 'react-color'
import { shortenAddress } from '../utils/shortenAddress'
import { CONTRACT_ADDRESS, ABI } from '../constants'
import Join from '../components/Join'
import Lobby from '../components/Lobby'
import Avatar from '../components/Avatar'
import DrawingBoard from '../components/DrawingBoard'

const socket = io.connect(process.env.NEXT_PUBLIC_SERVER_URL)

const Home = () => {
  const router = useRouter()
  const { pid } = router.query

  const { address } = useAccount()
  const { data: ensName } = useEnsName({
    address: address,
  })

  const provider = useProvider()
  const signer = useSigner()

  const mintibblContract = useContract({
    addressOrName: CONTRACT_ADDRESS,
    contractInterface: ABI,
    signerOrProvider: signer.data || provider,
  })

  const [roomId, setRoomId] = useState('')
  const [name, setName] = useState('')
  const [isGameHost, setIsGameHost] = useState(false)
  const [isGameStarted, setIsGameStarted] = useState(false)

  const [inLobby, setInLobby] = useState(false)
  const [round, setRound] = useState(1)
  const [totalRounds, setTotalRounds] = useState(3)
  const [drawTime, setDrawTime] = useState(5)
  const [drawer, setDrawer] = useState('')
  const [words, setWords] = useState([])
  const [selectedWord, setSelectedWord] = useState('')
  const [guessedUsers, setGuessedUsers] = useState([])
  const [previousDrawing, setPreviousDrawing] = useState('')

  const [users, setUsers] = useState([])
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])

  const canvas = useRef(null)
  const [canvasStatus, setCanvasStatus] = useState('')
  const [color, setColor] = useState('#000000')
  const [isMining, setIsMining] = useState(false)

  const updateColor = (value) => {
    setColor(
      `rgba(${value.rgb.r},${value.rgb.g},${value.rgb.b},${value.rgb.a})`
    )
  }

  const createRoom = () => {
    if (roomId !== '') router.replace('/', undefined, { shallow: true })

    socket.emit(
      'create_room',
      address ? address : '',
      name ? name : generateName()
    )
    setInLobby(true)
  }

  const joinRoom = () => {
    socket.emit(
      'join_room',
      roomId,
      address ? address : '',
      name ? name : generateName(),
      (room) => {
        if (room.isGameStarted) {
          setIsGameStarted(true)
          setInLobby(false)
          setRound(room.round)
          setTotalRounds(room.totalRounds)
          setDrawTime(room.drawTime)
          setSelectedWord(room.selectedWord)
          setDrawer(room.drawer)
        } else {
          setInLobby(true)
        }
      }
    )
  }

  const startGame = () => {
    socket.emit('start_game', totalRounds, drawTime)
  }

  const sendMessage = () => {
    if (message) {
      socket.emit('send_message', message, () => {
        setMessage('')
      })
    }
  }

  // Get room id from url
  useEffect(() => {
    if (!pid) return

    setRoomId(pid)
  }, [pid])

  // Check wallet address
  useEffect(() => {
    ensName ? setName(ensName) : setName('')
  }, [address])

  // Users and messages handler
  useEffect(() => {
    socket.on('room_data', (room) => {
      setRoomId(room.id)
      setUsers(room.users)
      setIsGameHost(socket.id === room.users[0].id)
    })

    socket.on('message', (message) => {
      setMessages([...messages, message])
    })
  }, [users, messages])

  // Game handler
  useEffect(() => {
    socket.on('select_word', (room) => {
      setIsGameStarted(true)

      console.log(room.newRound)
      if (room.newRound) {
        setCanvasStatus('new_round')

        setTimeout(() => {
          setCanvasStatus('select_word')
        }, 3000)
      } else {
        setCanvasStatus('select_word')
      }

      // Game options
      setRound(room.round)
      setTotalRounds(room.totalRounds)
      setDrawer(room.drawer)
      setWords(room.words)
      setSelectedWord('')
    })

    socket.on('word_selected', (word) => {
      setCanvasStatus('drawing')

      // Reset
      setGuessedUsers([])
      setSelectedWord(word)
      canvas.current.clear()
    })

    socket.on('guessed_correctly', (guessedUsers) => {
      setGuessedUsers(guessedUsers)
      console.log(guessedUsers)
    })

    socket.on('timer', (timer) => {
      setDrawTime(timer)
    })

    socket.on('end_turn', (room) => {
      if (room.isGameOver) return

      setCanvasStatus('end_turn')
      setPreviousDrawing(canvas.current.getDataURL())
      setUsers(room.users)

      setTimeout(() => {
        socket.emit('start_turn')
      }, 3000)
    })

    socket.on('game_over', (room) => {
      setCanvasStatus('game_over')

      // Reset stats
      // setRound(room.round)
      // setTotalRounds(room.totalRounds)
      // console.log(totalRounds)

      setTimeout(() => {
        setIsGameStarted(false)
        setInLobby(true)

        // TODO: Reset game state also drawing canvas and previous drawing
      }, 5000)
    })
  }, [])

  // Mint drawing
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
        'Mintibbl Drawing',
        'Test',
        canvas.current.getDataURL()
      )

      const txResponse = await mintibblContract.mintDrawing(metadataURI)
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

  const renderNewRound = () => {
    console.log('render new round')
    return <div>Round {round}</div>
  }

  const renderWordSelection = () => {
    if (drawer.id === socket.id) {
      return words.map((word, index) => {
        return (
          <button
            key={index}
            className='btn btn-outline btn-xs'
            onClick={() => {
              socket.emit('word_is', word)
              setWords([])
            }}
          >
            {word}
          </button>
        )
      })
    } else {
      return <div>{drawer.name} is choosing a word.</div>
    }
  }

  const renderScoreboard = () => {
    return (
      <div className='flex flex-col gap-2'>
        <div>
          The word was <span className='font-bold'>"{selectedWord}"</span>.
        </div>
        {guessedUsers.map((user) => {
          return (
            <div key={user.id}>
              {user.name}: {user.points}
            </div>
          )
        })}
      </div>
    )
  }

  const renderResult = () => {
    return <div>Game over! Starting a new game...</div>
  }

  const renderCanvasStatus = () => {
    switch (canvasStatus) {
      case 'new_round':
        return renderNewRound()
      case 'select_word':
        return renderWordSelection()
      case 'end_turn':
        return renderScoreboard()
      case 'game_over':
        return renderResult()
      default:
        break
    }
  }

  return (
    <div>
      {!isGameStarted ? (
        inLobby && users ? (
          <Lobby
            roomId={roomId}
            users={users}
            startGame={startGame}
            setTotalRounds={setTotalRounds}
            setDrawTime={setDrawTime}
            isGameHost={isGameHost}
          />
        ) : (
          <Join
            address={address}
            name={ensName ? ensName : name}
            setName={setName}
            createRoom={createRoom}
            joinRoom={joinRoom}
          />
        )
      ) : (
        <div className='flex flex-col container overflow-hidden gap-4 mx-auto'>
          <div className='flex items-center justify-between border p-2'>
            <div className='text-lg font-medium'>
              Round {round} of {totalRounds}
            </div>

            <div>
              {selectedWord && (
                <div className='text-center text-3xl'>
                  {drawer.id === socket.id ? (
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

            <div className='flex items-center justify-center gap-2'>
              <span className='text-lg font-medium'>{drawTime}</span>
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
                        name={user.name}
                        address={user.address}
                        size={40}
                      />

                      <div className='flex flex-col'>
                        <div
                          className={
                            user.id === socket.id ? 'text-blue-500' : ''
                          }
                        >
                          {user.name} {user.id === socket.id && '(You)'}
                        </div>
                        <div className='p-1 bg-rose-50 rounded text-gray-500 text-2xs font-mono'>
                          {shortenAddress(user.address)}
                        </div>
                        <div className='text-sm'>Points: {user.points}</div>
                      </div>
                    </div>
                  )
                })}
            </div>

            <div
              className={`relative ${
                drawer.id !== socket.id && 'pointer-events-none'
              }`}
            >
              <div
                className={`absolute h-full w-full top-0 left-0 bg-black opacity-10 z-10 ${
                  canvasStatus !== 'drawing' ? 'block' : 'hidden'
                }`}
              ></div>
              <div
                className={`absolute flex items-center justify-center h-full w-full gap-4 z-20 ${
                  canvasStatus !== 'drawing' ? 'block' : 'hidden'
                }`}
              >
                {renderCanvasStatus()}
              </div>

              <DrawingBoard socket={socket} canvas={canvas} color={color} />
            </div>

            <div className='flex flex-col w-full h-[600px] border gap-4 p-2'>
              {guessedUsers.find((user) => user.id === socket.id) && (
                <div className='flex flex-col items-center h-[200px] gap-2'>
                  <img
                    className='border-2 border-black h-32 w-32'
                    src={previousDrawing}
                    alt='Drawing'
                  />

                  <button
                    className='btn btn-block bg-amber-500 border border-amber-500 px-16'
                    onClick={mintDrawing}
                    disabled={isMining}
                  >
                    {isMining ? 'Minting...' : 'Mint'}
                  </button>
                </div>
              )}

              <div
                className={`flex flex-col justify-between ${
                  guessedUsers.find((user) => user.id === socket.id)
                    ? 'h-[380px]'
                    : 'h-full'
                }`}
              >
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
