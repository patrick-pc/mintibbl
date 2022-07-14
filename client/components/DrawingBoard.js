import { useEffect } from 'react'
import CanvasDraw from 'react-canvas-draw'

const DrawingBoard = ({ socket, canvas, color }) => {
  useEffect(() => {
    if (!canvas) return

    socket.on('draw', (data) => {
      canvas.current.loadSaveData(data, true)
    })
  }, [canvas])

  const saveCanvas = () => {
    socket.emit('draw', canvas.current.getSaveData())
  }

  return (
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
  )
}

export default DrawingBoard
