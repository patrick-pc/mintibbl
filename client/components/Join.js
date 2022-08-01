import Avatar from '../components/Avatar'

const Join = ({ address, name, setName, joinRoom, createRoom }) => {
  return (
    <div className='container mx-auto'>
      <div className='flex flex-col lg:flex-row items-center justify-center gap-8 mx-4'>
        {/* User */}
        <div className='w-full lg:w-[400px]'>
          <div className='flex items-center justify-center'>
            <div className='flex flex-col items-center justify-center bg-white m-border w-96 gap-8 p-8'>
              <Avatar name={name} address={address} size={75} />

              <input
                className='input m-border w-full focus:outline-none'
                type='text'
                placeholder='Enter your name'
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={20}
              />

              <div className='flex flex-col w-full'>
                <button className='m-btn m-btn-primary mb-4' onClick={joinRoom}>
                  Play
                </button>

                <button className='m-btn m-btn-secondary' onClick={createRoom}>
                  Create Private Room
                </button>
              </div>

              <div className='flex items-center justify-center opacity-50'>
                <span className='text-xs mr-2'>powered by</span>
                <img
                  className='h-4 w-auto'
                  src='/img/polygon.svg'
                  alt='Polygon'
                />
              </div>
            </div>
          </div>
        </div>

        {/* Hero */}
        <div className='w-full lg:w-[700px]'>
          <div className='flex flex-col items-center justify-center text-center gap-4'>
            <h1 className='text-black text-7xl font-bold leading-[1.2]'>
              Draw. Guess. Mint.
            </h1>
            <h2 className='text-black text-xl font-medium leading-[1.2]'>
              Draw some cool sh*t, laugh while guessing, and make them NFT!
            </h2>
            <p className='text-sm opacity-50'>It's free, even gas!</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Join
