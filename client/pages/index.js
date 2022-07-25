import { useRouter } from 'next/router'
import { useState, useRef, useEffect, lazy } from 'react'
import {
  useAccount,
  useEnsName,
  useProvider,
  useSigner,
  useContract,
} from 'wagmi'
import io from 'socket.io-client'
import axios from 'axios'
import generateName from 'sillyname'
import toast from 'react-hot-toast'
import FadeIn from 'react-fade-in'
import { Orbit } from '@uiball/loaders'
import { CirclePicker } from 'react-color'
import { shortenAddress } from '../utils/shortenAddress'
import { CONTRACT_ADDRESS, ABI } from '../constants'
import Join from '../components/Join'
import Lobby from '../components/Lobby'
import Avatar from '../components/Avatar'
import DrawingBoard from '../components/DrawingBoard'

const connectionConfig = {
  forceNew: true,
  reconnectionAttempts: 'Infinity',
  timeout: 10000,
  transports: ['websocket'],
}
const socket = io.connect(process.env.NEXT_PUBLIC_SERVER_URL, connectionConfig)

const Home = () => {
  const router = useRouter()
  const { pid } = router.query

  const { address } = useAccount()
  const { data: ensName } = useEnsName({
    address: address,
    chainId: 1,
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
  const [isConnected, setIsConnected] = useState(false)

  const [inLobby, setInLobby] = useState(false)
  const [round, setRound] = useState(1)
  const [totalRounds, setTotalRounds] = useState(3)
  const [drawTime, setDrawTime] = useState(80)
  const [drawer, setDrawer] = useState('')
  const [words, setWords] = useState([])
  const [selectedWord, setSelectedWord] = useState('')
  const [guessedUsers, setGuessedUsers] = useState([])
  const [previousDrawing, setPreviousDrawing] = useState('')
  const [previousDrawer, setPreviousDrawer] = useState('')
  const [previousWord, setPreviousWord] = useState('')

  const [users, setUsers] = useState([])
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])

  const canvas = useRef(null)
  const [canvasStatus, setCanvasStatus] = useState('')
  const [color, setColor] = useState('#000000')
  const [isMining, setIsMining] = useState(false)
  const [isFreeMint, setIsFreeMint] = useState(true)
  const [isContractMint, setIsContractMint] = useState(true)

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
      ensName ? ensName : '',
      name ? name : generateName().split(' ')[0]
    )
    setInLobby(true)
  }

  const joinRoom = () => {
    socket.emit(
      'join_room',
      roomId,
      address ? address : '',
      ensName ? ensName : '',
      name ? name : generateName().split(' ')[0],
      (room) => {
        if (room.isGameStarted) {
          setIsGameStarted(true)
          setInLobby(false)
          setRound(room.round)
          setTotalRounds(room.totalRounds)
          setDrawTime(room.drawTime)
          setSelectedWord(room.selectedWord)
          setDrawer(room.drawer)
          setGuessedUsers(room.guessedUsers)
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
    socket.emit(
      'wallet_connected',
      roomId,
      address ? address : '',
      ensName ? ensName : '',
      name ? name : generateName().split(' ')[0]
    )
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
    socket.on('connect', function () {
      setIsConnected(true)
    })

    socket.on('select_word', (room) => {
      setIsGameStarted(true)

      if (room.newRound) {
        setCanvasStatus('new_round')

        setTimeout(() => {
          setCanvasStatus('select_word')
        }, 3000)
      } else {
        setCanvasStatus('select_word')
      }

      // Game options
      setUsers(room.users)
      setRound(room.round)
      setTotalRounds(room.totalRounds)
      setDrawer(room.drawer)
      setWords(room.words)
      setSelectedWord('')

      // setTimeout(() => {
      //   console.log('word_is')
      //   socket.emit('word_is', room.words[2])
      // }, 5000)
    })

    socket.on('word_selected', (word) => {
      setCanvasStatus('drawing')

      setSelectedWord(word)
      canvas.current.clear()
    })

    socket.on('timer', (timer) => {
      setDrawTime(timer)
    })

    socket.on('end_turn', (room) => {
      setPreviousDrawer(
        room.drawnUsers[
          room.drawerIndex === 0
            ? room.drawnUsers.length - 1
            : room.drawerIndex - 1
        ]
      )
      setPreviousWord(room.selectedWord)
      setPreviousDrawing(canvas.current.getDataURL())
      setGuessedUsers(room.guessedUsers)

      if (room.isGameOver) return

      setCanvasStatus('end_turn')
      setUsers(room.users)

      setTimeout(() => {
        socket.emit('start_turn')
      }, 3000)
    })

    socket.on('game_over', (room) => {
      const timeOut = 10000
      if (room.users.length === 1) timeOut = 1000

      setCanvasStatus('game_over')

      setTimeout(() => {
        setIsGameStarted(false)
        setInLobby(true)

        setRound(room.round)
        setTotalRounds(room.totalRounds)
        setDrawTime(room.drawTime)
        setSelectedWord('')
        setDrawer('')
        setGuessedUsers([])
        setMessages([])
        setMessage('')
      }, timeOut)
    })
  }, [])

  // Mint drawing
  const pinToIPFS = async () => {
    try {
      let artist = 'anonymous'
      let title = 'Mintibbl Drawing'
      let attributes = []

      // Get artist
      if (previousDrawer.ensName) {
        artist = previousDrawer.ensName
      } else if (previousDrawer.address) {
        artist = previousDrawer.address
      }

      if (isFreeMint) {
        title = `Mintibbl Drawing (Test) - ${previousWord}`
        attributes = [
          {
            trait_type: 'Collection',
            value: 'Mintibbl - Test',
          },
          {
            trait_type: 'Word',
            value: previousWord,
          },
          {
            trait_type: 'Artist',
            value: artist,
          },
        ]
      } else if (isContractMint) {
        title = previousWord
        attributes = [
          {
            trait_type: 'Word',
            value: previousWord,
          },
          {
            trait_type: 'Artist',
            value: artist,
          },
        ]
      }

      const metadata = JSON.stringify({
        description: `A mintibbl drawing by ${artist}`,
        external_url: '',
        image: canvas.current.getDataURL(),
        name: title,
        attributes: attributes,
      })
      const img = dataURLtoFile(canvas.current.getDataURL(), 'image.png')
      const data = {
        metadata: metadata,
        image: img,
        asset: img,
      }
      const config = {
        method: 'POST',
        url: 'https://api.mintnft.today/v1/upload/single',
        headers: {
          'content-type': 'multipart/form-data',
          'x-api-key': process.env.NEXT_PUBLIC_MINT_NFT_API_KEY,
        },
        data: data,
      }
      const res = await axios(config)

      return res.data.data.url
    } catch (error) {
      console.log(error)
    }
  }
  const freeMintDrawing = async () => {
    try {
      if (!address) {
        toast('Connect wallet to continue.', {
          icon: '🦊',
        })

        return
      }
      setIsContractMint(false)
      setIsMining(true)

      const tokenUri = await pinToIPFS()
      const data = JSON.stringify({
        wallet: address,
        type: 'ERC721',
        network: 'mainnet',
        amount: 1,
        tokenUri: tokenUri,
      })
      const config = {
        method: 'POST',
        url: 'https://api.mintnft.today/v1/mint/single',
        headers: {
          'content-type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_MINT_NFT_API_KEY,
        },
        data: data,
      }
      const res = await axios(config)
      console.log(res)

      setGuessedUsers([])
      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
          >
            <div className='flex-1 w-0 p-4'>
              <div className='flex items-center'>
                <div className='text-2xl'>🎉</div>
                <div className='flex flex-col flex-1  ml-3 gap-2'>
                  <p className='text-sm font-medium'>
                    Successfully minted drawing!
                  </p>

                  <div className='flex gap-2'>
                    <div className='w-full'>
                      <a
                        href={`https://opensea.io/assets/matic/0x03e055692e77e56abf7f5570d9c64c194ba15616/${res.data.data.tokenId}`}
                        target='_blank'
                        className='btn btn-sm btn-block btn-outline border-gray-300 text-gray-500 hover:bg-violet-500 hover:border-violet-500'
                      >
                        OpenSea
                      </a>
                    </div>
                    <div className='w-full'>
                      <a
                        href={`https://polygonscan.com/tx/${res.data.data.transactionHash}`}
                        target='_blank'
                        className='btn btn-sm btn-block btn-outline border-gray-300 text-gray-500 hover:bg-violet-500 hover:border-violet-500'
                      >
                        PolygonScan
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className='flex border-l border-gray-200'>
              <button
                onClick={() => toast.dismiss(t.id)}
                className='w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-violet-600'
              >
                Close
              </button>
            </div>
          </div>
        ),
        { duration: 15000 }
      )
    } catch (error) {
      console.error(error)

      if (error.code == 4001) {
        toast.error(error.message)
      } else {
        toast.error('Something went wrong.')
      }
    }

    setIsContractMint(true)
    setIsMining(false)
  }

  const mintDrawing = async () => {
    try {
      if (!address) {
        toast('Connect wallet to continue.', {
          icon: '🦊',
        })

        return
      }
      setIsFreeMint(false)
      setIsMining(true)

      const tokenUri = await pinToIPFS()
      const txResponse = await mintibblContract.mintDrawing(tokenUri)
      const res = await txResponse.wait()
      console.log(res)

      setGuessedUsers([])
      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
          >
            <div className='flex-1 w-0 p-4'>
              <div className='flex items-center'>
                <div className='text-2xl'>🎉</div>
                <div className='flex flex-col flex-1  ml-3 gap-2'>
                  <p className='text-sm font-medium'>
                    Successfully minted drawing!
                  </p>

                  <div className='flex gap-2'>
                    <div className='w-full'>
                      <a
                        href={`https://testnets.opensea.io/assets/mumbai/0x0d05f5186422e07aa1981f52bcb3d5043dbc4e45/${res.transactionIndex}`}
                        target='_blank'
                        className='btn btn-sm btn-block btn-outline border-gray-300 text-gray-500 hover:bg-violet-500 hover:border-violet-500'
                      >
                        OpenSea
                      </a>
                    </div>
                    <div className='w-full'>
                      <a
                        href={`https://mumbai.polygonscan.com/tx/${res.transactionHash}`}
                        target='_blank'
                        className='btn btn-sm btn-block btn-outline border-gray-300 text-gray-500 hover:bg-violet-500 hover:border-violet-500'
                      >
                        PolygonScan
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className='flex border-l border-gray-200'>
              <button
                onClick={() => toast.dismiss(t.id)}
                className='w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-violet-600'
              >
                Close
              </button>
            </div>
          </div>
        ),
        { duration: 15000 }
      )
    } catch (error) {
      console.error(error)

      if (error.code == 4001) {
        toast.error(error.message)
      } else {
        toast.error('Something went wrong.')
      }
    }

    setIsFreeMint(true)
    setIsMining(false)
  }

  const dataURLtoFile = (dataURL, fileName) => {
    let arr = dataURL.split(','),
      mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]),
      n = bstr.length,
      u8arr = new Uint8Array(n)
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    return new File([u8arr], fileName, { type: mime })
  }

  // Overlay
  const renderNewRound = () => {
    return <div>Round {round}</div>
  }

  const renderWordSelection = () => {
    if (drawer.id === socket.id) {
      return words.map((word, index) => {
        return (
          <button
            key={index}
            className='btn btn-outline btn-sm text-white hover:bg-transparent hover:border-violet-500 hover:text-violet-500'
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
      return <div>{drawer.name} is choosing a word!</div>
    }
  }

  const renderScoreboard = () => {
    return (
      <div className='flex flex-col gap-2'>
        <div>
          The word was: <span className='font-bold'>{selectedWord}</span>.
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
    return <div>Game over!</div>
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

  if (!isConnected) {
    return (
      <div className='flex items-center justify-center h-96 w-full'>
        <Orbit size={40} />
      </div>
    )
  }
  return (
    <FadeIn>
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
            name={name}
            setName={setName}
            createRoom={createRoom}
            joinRoom={joinRoom}
          />
        )
      ) : (
        <div className='flex flex-col container overflow-hidden gap-4 mx-auto'>
          <div className='flex items-center justify-between border border-black rounded-lg p-2'>
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
            <div className='flex flex-col w-full h-[600px] border border-black rounded-lg gap-4 p-2'>
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

                      <div className='flex flex-col text-sm'>
                        <div className='font-medium break-all'>
                          {user.name} {user.id === socket.id && '(You)'}
                        </div>
                        <div>
                          <span className='bg-violet-200 rounded text-gray-500 text-2xs font-mono px-1 py-0.5'>
                            {user.address
                              ? shortenAddress(user.address)
                              : 'Not Connected'}
                          </span>
                        </div>
                        <div className='text-xs'>Points: {user.points}</div>
                      </div>
                    </div>
                  )
                })}
            </div>

            <div
              className={`relative text-white rounded-lg ${
                drawer.id !== socket.id && 'pointer-events-none'
              }`}
            >
              <div
                className={`absolute h-full w-full top-0 left-0 bg-black rounded-lg opacity-80 z-10 ${
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

            <div className='flex flex-col w-full h-[600px] border border-black rounded-lg gap-4 p-2'>
              {guessedUsers[0]?.id === socket.id && (
                <div className='flex flex-col h-[200px] gap-2'>
                  <div className='flex flex-row items-center gap-2'>
                    <img
                      className='border-2 border-black h-32 w-32'
                      src={previousDrawing}
                      alt={previousWord}
                    />

                    <div className='flex flex-col text-xs gap-2'>
                      <div>
                        Word:{' '}
                        <span className='font-medium'>{previousWord}</span>
                      </div>
                      <div>
                        Artist:{' '}
                        <span className='font-medium'>
                          {previousDrawer.address
                            ? shortenAddress(previousDrawer.address)
                            : 'Not Connected'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className='flex flex-row gap-2'>
                    <div
                      className={`w-full ${isFreeMint ? 'block' : 'hidden'}`}
                    >
                      <button
                        className='btn btn-block bg-violet-500 border border-violet-500 hover:bg-violet-500  hover:border-violet-500'
                        onClick={freeMintDrawing}
                        disabled={isMining}
                      >
                        {isMining ? <Orbit /> : 'Gas-Free Mint'}
                      </button>
                    </div>
                    <div
                      className={`w-full ${
                        isContractMint ? 'block' : 'hidden'
                      }`}
                    >
                      <button
                        className='btn btn-block bg-gray-500 border border-gray-500 hover:bg-gray-500  hover:border-gray-500'
                        onClick={mintDrawing}
                        disabled={isMining}
                      >
                        {isMining ? <Orbit /> : 'Mint'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div
                className={`flex flex-col justify-between ${
                  guessedUsers[0]?.id === socket.id ? 'h-[380px]' : 'h-full'
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
                              {message.sender && message.sender}
                            </span>
                            <span className='break-all'>{message.content}</span>
                          </div>
                        </div>
                      )
                    })}
                </div>
                <div>
                  <input
                    className='input input-bordered border-black w-full focus:outline-none'
                    type='text'
                    placeholder='Type your guess here...'
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(event) => {
                      event.key === 'Enter' && sendMessage()
                    }}
                    maxLength={30}
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
    </FadeIn>
  )
}

export default Home
