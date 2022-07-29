import { useEffect } from 'react'

let current = {
  x: 0,
  y: 0,
  color: '#000000',
  editOption: 'draw',
}
let drawing = false

const DrawingBoard = ({ socket, color, canvasRef, editOption }) => {
  // const color = colorRef.current
  // console.log(colorRef.current)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    // --------------- getContext() method returns a drawing context on the canvas-----
    // const test = colorsRef.current

    // ----------------------- Colors --------------------------------------------------

    // const colors = document.getElementsByClassName('color')
    // console.log(colors, 'the colors')
    // console.log(test)
    // set the current color
    // console.log(current.color)

    // // helper that will update the current color
    // const onColorUpdate = (e) => {
    //   color = e.target.className.split(' ')[1]
    // }

    // // loop through the color elements and add the click event listeners
    // for (let i = 0; i < colors.length; i++) {
    //   colors[i].addEventListener('click', onColorUpdate, false)
    // }

    // ------------------------------- create the drawing ----------------------------

    const drawLine = (x0, y0, x1, y1, color, emit) => {
      context.beginPath()
      context.moveTo(x0, y0)
      context.lineTo(x1, y1)
      context.lineCap = 'round'
      context.lineJoin = 'round'
      context.lineWidth = 15
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

    // ---------------- mouse movement --------------------------------------

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
      const bcr = e.target.getBoundingClientRect()
      if (!drawing) return

      drawing = false
      // drawLine(
      //   current.x,
      //   current.y,
      //   e.clientX - bcr.x || e.touches[0].clientX - bcr.x,
      //   e.clientY - bcr.y || e.touches[0].clientY - bcr.y,
      //   current.color,
      //   true
      // )
    }

    // ----------- limit the number of events per second -----------------------

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

    // -----------------add event listeners to our canvas ----------------------

    canvas.addEventListener('mousedown', onMouseDown, false)
    canvas.addEventListener('mouseup', onMouseUp, false)
    canvas.addEventListener('mouseout', onMouseUp, false)
    canvas.addEventListener('mousemove', throttle(onMouseMove, 10), false)

    // Touch support for mobile devices
    canvas.addEventListener('touchstart', onMouseDown, false)
    canvas.addEventListener('touchend', onMouseUp, false)
    canvas.addEventListener('touchcancel', onMouseUp, false)
    canvas.addEventListener('touchmove', throttle(onMouseMove, 10), false)

    // -------------- make the canvas fill its parent component -----------------

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

    // ----------------------- socket.io connection ----------------------------

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

    socket.on('drawing', onDrawingEvent)

    // socket.on('erase', ({ mousedown, mousemove }) => {
    //   eraseCanvas(context, canvas, 'white', mousedown, mousemove)
    // })

    socket.on('clear', () => {
      clearCanvas()
      // clearCanvas(context, canvas)
      // context.clearRect(0, 0, canvas.width, canvas.height)
      // context.fillStyle='white'
      // context.fillRect(0, 0, canvas.width, canvas.height)
    })
  }, [])

  //  Color / Edit Option change useEffect
  useEffect(() => {
    // current.color = color
    current.editOption =
      editOption === 'draw'
        ? (current.color = color)
        : (current.color = '#FFFFFF')
    // editOptionRef.current = editOption
  }, [color, editOption])

  return <canvas ref={canvasRef} className='cursor-pointer rounded-lg' />
}

export default DrawingBoard
