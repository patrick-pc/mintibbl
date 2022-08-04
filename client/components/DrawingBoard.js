import { useEffect } from 'react'

let current = {
  x: 0,
  y: 0,
  color: '#000000',
  editOption: 'draw',
}
let drawing = false

const DrawingBoard = ({ socket, color, canvasRef, editOption }) => {
  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    // Drawing
    const drawLine = (x0, y0, x1, y1, color, emit) => {
      context.beginPath()
      context.moveTo(x0, y0)
      context.lineTo(x1, y1)
      context.lineCap = 'round'
      context.lineJoin = 'round'
      context.lineWidth = 10
      context.strokeStyle = color
      context.stroke()
      context.closePath()

      if (!emit) return

      const w = canvas.width
      const h = canvas.height

      socket.emit('drawing', {
        x0: x0 / w,
        y0: y0 / h,
        x1: x1 / w,
        y1: y1 / h,
        color,
      })
    }

    // Mouse movement
    const onMouseDown = (e) => {
      const bcr = e.target.getBoundingClientRect()
      drawing = true
      current.x = e.clientX - bcr.x || e.touches[0].clientX - bcr.x
      current.y = e.clientY - bcr.y || e.touches[0].clientY - bcr.y
    }

    const onMouseMove = (e) => {
      if (!drawing) return

      const bcr = e.target.getBoundingClientRect()
      drawLine(
        current.x,
        current.y,
        e.clientX - bcr.x || e.touches[0].clientX - bcr.x,
        e.clientY - bcr.y || e.touches[0].clientY - bcr.y,
        current.color,
        true
      )
      current.x = e.clientX - bcr.x || e.touches[0].clientX - bcr.x
      current.y = e.clientY - bcr.y || e.touches[0].clientY - bcr.y
    }

    const onMouseUp = (e) => {
      if (!drawing) return
      drawing = false

      const bcr = e.target.getBoundingClientRect()
      drawLine(
        current.x,
        current.y,
        e.clientX - bcr.x || e.touches[0].clientX - bcr.x,
        e.clientY - bcr.y || e.touches[0].clientY - bcr.y,
        current.color,
        true
      )
    }

    // Limit the number of events per second
    const throttle = (callback, delay) => {
      let previousCall = new Date().getTime()
      return function () {
        const time = new Date().getTime()

        if (time - previousCall >= delay) {
          previousCall = time
          callback.apply(null, arguments)
        }
      }
    }

    // Canvas event listeners
    canvas.addEventListener('mousedown', onMouseDown, false)
    canvas.addEventListener('mouseup', onMouseUp, false)
    canvas.addEventListener('mouseout', onMouseUp, false)
    canvas.addEventListener('mousemove', throttle(onMouseMove, 10), false)

    // Touch support for mobile devices
    canvas.addEventListener('touchstart', onMouseDown, false)
    canvas.addEventListener('touchend', onMouseUp, false)
    canvas.addEventListener('touchcancel', onMouseUp, false)
    canvas.addEventListener('touchmove', throttle(onMouseMove, 10), false)

    // Make the canvas fill its parent component
    const onResize = () => {
      // let parentWidth = canvasParentRef.current.clientWidth
      // let parentHeight = canvasParentRef.current.clientHeight
      // let smaller = parentWidth < parentHeight ? parentWidth : parentHeight
      // canvas.width = smaller
      // canvas.height = smaller

      // Make it visually fill the positioned parent
      canvas.style.width = '100%'
      canvas.style.height = '100%'

      // Set the internal size to match
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      canvas.style.touchAction = 'none'
    }

    window.addEventListener('resize', onResize, false)
    onResize()

    const onDrawingEvent = (data) => {
      const w = canvas.width
      const h = canvas.height
      drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color)
    }

    const clearCanvas = () => {
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.fillStyle = '#FFFFFF'
      context.fillRect(0, 0, canvas.width, canvas.height)
    }

    // Socket.io events
    socket.on('drawing', onDrawingEvent)

    socket.on('clear', () => {
      clearCanvas()
    })
  }, [])

  //  Color and edit option
  useEffect(() => {
    current.editOption =
      editOption === 'draw'
        ? (current.color = color)
        : (current.color = '#FFFFFF')
  }, [color, editOption])

  return (
    <canvas ref={canvasRef} className='cursor-pointer rounded-md select-none' />
  )
}

export default DrawingBoard
