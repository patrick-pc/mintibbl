import { CompactPicker } from 'react-color'
import { TbPencil, TbEraser, TbTrash } from 'react-icons/tb'

const Options = ({ options, editOption, color, handleColorChange }) => {
  const renderIcon = (e, index) => {
    let icon = null
    if (e.name === 'draw') {
      icon = <TbPencil />
    } else if (e.name === 'erase') {
      icon = <TbEraser />
    } else {
      icon = <TbTrash />
    }

    return (
      <button
        key={index}
        className={`border-2 border-black rounded-full p-4 ${
          e.name === editOption && 'ring ring-black'
        }`}
        onClick={e.handler}
      >
        <div className='text-xl'>{icon}</div>
      </button>
    )
  }

  return (
    <div className='options flex flex-col md:flex-row items-center justify-center gap-4 mx-4 mb-16'>
      <CompactPicker color={color} onChangeComplete={handleColorChange} />
      <div className='flex gap-2'>
        {options.map((e, index) => renderIcon(e, index))}
      </div>
    </div>
  )
}

export default Options
