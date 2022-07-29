import { CompactPicker } from 'react-color'

const Options = ({ options, editOption, color, handleColorChange }) => {
  const renderIcon = (e, index) => {
    return (
      <button
        key={index}
        className={`p-4 border border-black  rounded-full ${
          e.name === editOption && 'ring ring-black'
        }`}
        onClick={e.handler}
      >
        <span className='text-xl'>{e.icon}</span>
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
