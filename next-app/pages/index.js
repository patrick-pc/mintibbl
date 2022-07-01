import { useRef, useState, useEffect } from 'react'
import Head from 'next/head'
import CanvasDraw from 'react-canvas-draw'
import { CirclePicker } from 'react-color'
import io from 'socket.io-client'

export default function Home() {
  const socket = io.connect('http://localhost:8080')
  const canvas = useRef(null)
  const [color, setColor] = useState('#666666')

  useEffect(() => {
    if (!canvas) return

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

  const getDataURL = () => {
    console.log(canvas.current.getDataURL())
    alert('Data URL written to console')
  }

  return (
    <div>
      <Head>
        <title>Mintibble</title>
        <meta
          name='description'
          content='Immortalized those hilarious drawings!'
        />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <div className='flex items-center justify-center h-screen w-full gap-8'>
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
        </div>
      </div>
    </div>
  )
}
