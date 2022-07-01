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
      console.log(data)
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

      <h1 className='flex items-center justify-center text-3xl font-bold h-screen w-full gap-8'>
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
        <CirclePicker color={color} onChangeComplete={updateColor} />
      </h1>
    </div>
  )
}
