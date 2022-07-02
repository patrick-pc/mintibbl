import { useRef, useState, useEffect } from 'react'
import { CirclePicker } from 'react-color'
import CanvasDraw from 'react-canvas-draw'
import io from 'socket.io-client'
import axios from 'axios'

const DrawingBoard = () => {
  const socket = io.connect('http://localhost:3001')
  const canvas = useRef(null)
  const [color, setColor] = useState('#666666')

  useEffect(() => {
    if (!canvas) return

    socket.on('draw', (data) => {
      // console.log(data)
      canvas.current.loadSaveData(data, true)
    })

    socket.on('join', (data) => {
      console.log(data)
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

  const getDataURL = () => {
    console.log(canvas.current.getDataURL())
    alert('Data URL written to console')
    // pinToIPFS(canvas.current.getDataURL())
  }

  const join = (data) => {
    socket.emit('join', 'walletAddress')
  }

  const pinToIPFS = async (dataURL) => {
    try {
      const data = JSON.stringify({
        pinataOptions: {
          cidVersion: 1,
        },
        pinataMetadata: {
          name: 'Mintibble',
        },
        pinataContent: {
          name: 'Mintibble Drawing',
          description: 'Test',
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

      const metadataURI = `https://ipfs.io/ipfs/${res.data.IpfsHash}`
      console.log(metadataURI)
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <div className='flex flex-row gap-8'>
      <div
        className='cursor-pointer border shadow'
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
          onClick={getDataURL}
        >
          Get Data URL
        </button>
        <button
          className='py-2 px-4 rounded-md bg-black text-white'
          onClick={join}
        >
          Join
        </button>
      </div>
    </div>
  )
}

export default DrawingBoard
