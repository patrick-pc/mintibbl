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
import axios from 'axios'
import generateName from 'sillyname'
import toast from 'react-hot-toast'
import FadeIn from 'react-fade-in'
import { Orbit } from '@uiball/loaders'
import { shortenAddress } from '../utils/shortenAddress'
import { copyToClipboard } from '../utils/copyToClipboard'
import { CONTRACT_ADDRESS, ABI } from '../constants'
import Join from '../components/Join'
import Lobby from '../components/Lobby'
import Avatar from '../components/Avatar'
import DrawingBoard from '../components/DrawingBoard'
import Options from '../components/Options'
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3'

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

  const { executeRecaptcha } = useGoogleReCaptcha()

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
  const [winner, setWinner] = useState('')

  const [users, setUsers] = useState([])
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])

  const canvasRef = useRef(null)
  const [canvasStatus, setCanvasStatus] = useState('')
  const [color, setColor] = useState('#000000')
  const [prevColor, setPrevColor] = useState('#000000')
  const [editOption, setEditOption] = useState('draw')
  const [isMining, setIsMining] = useState(false)
  const [isFreeMint, setIsFreeMint] = useState(true)
  const [isContractMint, setIsContractMint] = useState(true)

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
          setCanvasStatus('drawing')
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

    socket.on('disconnect', function () {
      console.log('disconnected')
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
      socket.emit('clear')
      playAudio('wordSelected.mp3')
    })

    socket.on('timer', (timer) => {
      setDrawTime(timer)

      if (timer <= 10) playAudio('tick.ogg')
    })

    socket.on('guessed_correctly', () => {
      playAudio('guessed.mp3')
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
      setPreviousDrawing(
        canvasRef.current ? canvasRef.current.toDataURL('image/svg') : ''
      )
      setGuessedUsers(room.guessedUsers)

      if (room.isGameOver) return

      setCanvasStatus('end_turn')
      setUsers(room.users)

      setTimeout(() => {
        if (room.drawer.id === socket.id) socket.emit('start_turn') // Prevent emit duplicate
      }, 3000)
    })

    socket.on('game_over', (room) => {
      const users = [...room.users]
      const winner = users.sort((a, b) => b.points - a.points)[0]

      setWinner(winner.name)
      setUsers(room.users)
      setCanvasStatus('game_over')
      playAudio('winner.mp3')

      const timeOut = 10000
      if (room.users.length === 1) timeOut = 1000

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
        setWinner('')
      }, timeOut)
    })
  }, [])

  // Mint drawing
  const pinToIPFS = async (isFreeMint) => {
    try {
      const utcStr = new Date().toUTCString()
      let artist = 'anonymous'
      let title = 'Mintibbl Drawing'
      let attributes = []

      // Get artist
      if (previousDrawer.ensName) {
        artist = previousDrawer.ensName
      } else if (previousDrawer.address) {
        artist = previousDrawer.address
      }

      // Set metadata depending on free mint or contract mint
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
      } else {
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
        description: `A mintibbl drawing by ${artist} on ${utcStr}`,
        external_url: '',
        image: canvasRef.current.toDataURL('image/svg'),
        name: title,
        attributes: attributes,
      })
      const img = dataURLtoFile(
        canvasRef.current.toDataURL('image/svg'),
        'image.png'
      )
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
        origin: 'https://mintibbl.fun/',
        referer: 'https://mintnft.today/',
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

      const tokenUri = await pinToIPFS(true)
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
        origin: 'https://mintibbl.fun/',
        referer: 'https://mintnft.today/',
      }
      const res = await axios(config)

      const openSeaUrl = `https://opensea.io/assets/matic/0x03e055692e77e56abf7f5570d9c64c194ba15616/${res.data.data.tokenId}`
      const polygonScanUrl = `https://polygonscan.com/tx/${res.data.data.transactionHash}`

      toastMintSuccess(polygonScanUrl, openSeaUrl)
      setGuessedUsers([])
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

      // Using algoz to prevent bot from spamming the smart contract
      if (!executeRecaptcha) return
      const validationProof = await executeRecaptcha()
      console.log(validationProof)

      const config = {
        method: 'POST',
        url: 'https://api.algoz.xyz/validate/',
        headers: {
          'content-type': 'application/json',
        },
        data: JSON.stringify({
          application_id: process.env.NEXT_PUBLIC_ALGOZ_APP_ID,
          validation_proof: validationProof,
        }),
      }
      const algoz = await axios(config)
      console.log(algoz.data)
      console.log(algoz.data.expiry_token)
      console.log(algoz.data.auth_token)
      console.log(algoz.data.signature_token)

      const tokenUri = await pinToIPFS(false)
      const txResponse = await mintibblContract.mintDrawing(
        tokenUri,
        algoz.data.expiry_token,
        algoz.data.auth_token,
        algoz.data.signature_token
      )
      const res = await txResponse.wait()
      const tokenId = res.events[0].args[1].toString()

      const openSeaUrl = `https://testnets.opensea.io/assets/mumbai/0x3807Be837a65ebCf97647F6490b4337D03D76579/${tokenId}`
      const polygonScanUrl = `https://mumbai.polygonscan.com/tx/${res.transactionHash}`

      toastMintSuccess(polygonScanUrl, openSeaUrl)
      setGuessedUsers([])
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

  const toastMintSuccess = (polygonScanUrl, openSeaUrl, duration = 10000) => {
    toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } flex max-w-md w-full bg-white m-border shadow-lg pointer-events-auto`}
        >
          <div className='flex-1 w-0 p-4'>
            <div className='flex items-center'>
              <div className='flex flex-col flex-1 gap-2'>
                <p className='text-sm lg:text-base text-center font-medium'>
                  ✨ Successfully minted drawing! ✨
                </p>
                <div className='flex w-full gap-2'>
                  <a
                    href={polygonScanUrl}
                    target='_blank'
                    className='text-center btn-block bg-violet-300 border-2 border-black rounded-md text-sm font-medium py-1 px-2'
                  >
                    PolygonScan
                  </a>
                  <a
                    href={openSeaUrl}
                    target='_blank'
                    className='text-center btn-block bg-lime-300 border-2 border-black rounded-md text-sm font-medium py-1 px-2'
                  >
                    OpenSea
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className='flex border-l-2 border-black'>
            <button
              onClick={() => toast.dismiss(t.id)}
              className='w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-red-500 text-sm font-medium'
            >
              Close
            </button>
          </div>
        </div>
      ),
      { duration: duration }
    )
  }

  const handleColorChange = (value) => {
    setColor(
      `rgba(${value.rgb.r},${value.rgb.g},${value.rgb.b},${value.rgb.a})`
    )
    setPrevColor(
      `rgba(${value.rgb.r},${value.rgb.g},${value.rgb.b},${value.rgb.a})`
    )
    setEditOption('draw')
  }
  const handleDrawOption = () => {
    if (color === 'rgba(255,255,255,255)') setColor(prevColor)
    setEditOption('draw')
  }
  const handleEraseOption = () => {
    setColor('rgba(255,255,255,255)')
    setEditOption('erase')
  }
  const handleClear = () => {
    handleDrawOption()
    socket.emit('clear')
  }
  const options = [
    {
      name: 'draw',
      handler: handleDrawOption,
    },
    {
      name: 'erase',
      handler: handleEraseOption,
    },
    {
      name: 'clear',
      handler: handleClear,
    },
  ]

  const renderOptions = () => {
    return (
      <Options
        options={options}
        editOption={editOption}
        color={color}
        handleColorChange={handleColorChange}
      />
    )
  }

  const renderNewRound = () => {
    return (
      <div className='text-xl text-center font-medium animate-drop'>
        Round {round}
      </div>
    )
  }

  const renderWordSelection = () => {
    if (drawer.id === socket.id) {
      return (
        <div className='flex flex-col gap-4'>
          <div className='text-lg text-center font-medium animate-drop'>
            Choose a word
          </div>
          <div className='flex gap-4 text-black animate-drop'>
            <button
              className='m-btn m-btn-primary m-btn-sm'
              onClick={() => {
                socket.emit('word_is', words[0])
                setWords([])
              }}
            >
              {words[0]}
            </button>
            <button
              className='m-btn m-btn-secondary m-btn-sm'
              onClick={() => {
                socket.emit('word_is', words[1])
                setWords([])
              }}
            >
              {words[1]}
            </button>
            <button
              className='m-btn m-btn-accent m-btn-sm'
              onClick={() => {
                socket.emit('word_is', words[2])
                setWords([])
              }}
            >
              {words[2]}
            </button>
          </div>
        </div>
      )
    } else {
      return (
        <div className='text-lg text-center font-medium'>
          <span className='text-violet-500 font-bold animate-drop'>
            {drawer.name}
          </span>{' '}
          is choosing a word!
        </div>
      )
    }
  }

  const renderScoreboard = () => {
    return (
      <div className='flex flex-col gap-4 animate-drop'>
        <div className='text-lg text-center font-medium'>
          The word was{' '}
          <span className='text-lime-500 font-bold'>"{selectedWord}"</span>
        </div>

        <div className='flex flex-col gap-2'>
          {guessedUsers.map((user) => {
            return (
              <div className='font-medium' key={user.id}>
                {user.name}:{' '}
                <span className='text-lime-500'>{user.points}</span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderResult = () => {
    return (
      <div className='text-lg text-center font-medium animate-drop'>
        Winner:
        <br />
        <span className='text-xl text-lime-500 font-bold'>✨ {winner} ✨</span>
      </div>
    )
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

  //  Sound FX
  const playAudio = (fileName) => {
    const audio = new Audio('/sounds/' + fileName)
    audio.play()
  }

  // if (!isConnected) {
  //   return (
  //     <div className='flex items-center justify-center h-96 w-full'>
  //       <Orbit size={40} />
  //     </div>
  //   )
  // }
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
        <div className='container mx-auto'>
          <div className='flex flex-col gap-4'>
            <div className='flex items-center justify-between m-border p-2 mx-4'>
              <div className='text-sm lg:text-lg font-medium'>
                Round {round} of {totalRounds}
              </div>

              <div>
                {selectedWord && (
                  <div className='text-center lg:text-3xl'>
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
                <span className='text-sm lg:text-lg font-medium'>
                  {drawTime}
                </span>
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

            <div className='flex gap-4 mx-4 overflow-x-auto'>
              <div className='flex flex-col w-full min-w-[300px] h-[600px] m-border gap-4 p-2'>
                {users &&
                  users.map((user) => {
                    return (
                      <div
                        className='flex flex-row items-center border-b p-2 gap-4'
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
                            <span
                              className={`bg-violet-200 rounded text-gray-500 text-2xs font-mono px-1 py-0.5 ${
                                user.address && 'cursor-pointer'
                              }`}
                              onClick={() => {
                                user.address &&
                                  copyToClipboard(
                                    user.address,
                                    'Copied wallet address to clipboard!'
                                  )
                              }}
                            >
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
                className={`relative min-w-[350px] h-[350px] md:min-w-[600px] md:h-[600px] m-border select-none ${
                  drawer.id !== socket.id && 'pointer-events-none'
                }`}
              >
                <div
                  className={`absolute h-full w-full top-0 left-0 bg-black opacity-80 z-10 ${
                    canvasStatus !== 'drawing' ? 'block' : 'hidden'
                  }`}
                ></div>
                <div
                  className={`absolute flex items-center justify-center h-full w-full text-white gap-4 z-20 ${
                    canvasStatus !== 'drawing' ? 'block' : 'hidden'
                  }`}
                >
                  {renderCanvasStatus()}
                </div>

                <DrawingBoard
                  socket={socket}
                  color={color}
                  canvasRef={canvasRef}
                  editOption={editOption}
                />
              </div>

              <div className='flex flex-col w-full min-w-[300px] h-[600px] m-border gap-4 p-2'>
                {guessedUsers[0]?.id === socket.id && (
                  <div className='flex flex-col h-[200px] gap-2'>
                    <div className='flex flex-row items-center gap-2'>
                      <img
                        className='m-border h-32 w-32'
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
                          className='m-btn m-btn-primary m-btn-sm btn-block disabled:m-btn-disabled disabled:cursor-not-allowed'
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
                          className='m-btn m-btn-secondary m-btn-sm btn-block disabled:m-btn-disabled disabled:cursor-not-allowed'
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
                  <div className='flex flex-col-reverse overflow-y-auto'>
                    <div>
                      {messages &&
                        messages.map((message, i) => {
                          return (
                            <div
                              className='flex gap-2 p-2 even:bg-gray-50 odd:bg-gray-100'
                              key={i}
                            >
                              {message.color === 'black' ? (
                                <p className='text-sm break-all'>
                                  <span className='font-medium'>
                                    {message.sender && message.sender}:
                                  </span>{' '}
                                  {message.content}
                                </p>
                              ) : (
                                <p
                                  className='text-sm break-all font-medium'
                                  style={{ color: message.color }}
                                >
                                  {message.sender && message.sender}{' '}
                                  {message.content}
                                </p>
                              )}
                            </div>
                          )
                        })}
                    </div>
                  </div>
                  <div>
                    <input
                      className='input m-border w-full focus:outline-none'
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

            {selectedWord && drawer.id === socket.id && renderOptions()}
          </div>
        </div>
      )}
    </FadeIn>
  )
}

export default Home
