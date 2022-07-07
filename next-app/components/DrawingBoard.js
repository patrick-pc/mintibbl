import { useRef, useState, useEffect } from 'react'
import CanvasDraw from 'react-canvas-draw'
import { CirclePicker } from 'react-color'
import { io } from 'socket.io-client'
import axios from 'axios'
import { useProvider, useSigner, useContract, useAccount } from 'wagmi'
import { CONTRACT_ADDRESS, ABI } from '../constants'
import toast from 'react-hot-toast'

// const socket = io.connect('http://localhost:3001')

const DrawingBoard = ({ socket }) => {
  const canvas = useRef(null)
  const [color, setColor] = useState('#666666')
  const [isMining, setIsMining] = useState(false)

  const provider = useProvider()
  const signer = useSigner()

  const mintibbleContract = useContract({
    addressOrName: CONTRACT_ADDRESS,
    contractInterface: ABI,
    signerOrProvider: signer.data || provider,
  })

  useEffect(() => {
    if (!canvas) return
    console.log(canvas)

    socket.on('draw', (data) => {
      // console.log(data)
      canvas.current.loadSaveData(data, true)
    })
  }, [canvas])

  const saveCanvas = () => {
    console.log(canvas)
    socket.emit('draw', canvas.current.getSaveData())
  }

  const updateColor = (value) => {
    // console.log(
    //   `rgba(${value.rgb.r},${value.rgb.g},${value.rgb.b},${value.rgb.a})`
    // )
    setColor(
      `rgba(${value.rgb.r},${value.rgb.g},${value.rgb.b},${value.rgb.a})`
    )
  }

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
    <div className='flex flex-col gap-8'>
      <div
        className='cursor-pointer border'
        onMouseUp={saveCanvas}
        onTouchEnd={saveCanvas}
      >
        <CanvasDraw
          ref={canvas}
          hideGrid={true}
          lazyRadius={1}
          brushColor={color}
          canvasWidth={600}
          canvasHeight={600}
        />
      </div>

      <div className='flex flex-col items-center justify-center gap-8'>
        <CirclePicker color={color} onChangeComplete={updateColor} />
        <button
          className='py-2 px-4 rounded-md bg-black text-white'
          onClick={mintDrawing}
          disabled={isMining}
        >
          Mint
        </button>
      </div>
    </div>
  )
}

export default DrawingBoard
