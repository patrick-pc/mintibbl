const Footer = () => {
  return (
    <footer className='flex flex-col items-center justify-center text-gray-500 font-medium gap-2 p-12 mt-16 sticky top-[100vh]'>
      <div className='flex gap-4'>
        <a
          href='https://twitter.com/mintibbl'
          target='_blank'
          className='opacity-75 hover:opacity-100'
        >
          🐦 twitter
        </a>
        <a
          href='https://discord.gg/w93daBSH'
          target='_blank'
          className='opacity-75 hover:opacity-100'
        >
          👾 discord
        </a>
      </div>
      {/* <a
        href='https://www.flaticon.com/collections/MjYxODIyNjc='
        target='_blank'
        className='text-xs font-light opacity-75 hover:opacity-100'
      >
        Icons by Flaticon
      </a> */}
    </footer>
  )
}

export default Footer
