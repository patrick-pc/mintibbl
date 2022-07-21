import Avatar from '../components/Avatar'

const Join = ({ address, name, setName, joinRoom, createRoom }) => {
  return (
    <div className='flex flex-col md:flex-row items-center justify-center h-full w-full gap-4'>
      <div className='w-full lg:w-[400px]'>
        <div className='flex flex-col items-center justify-center'>
          <div className='card bg-base-100 border border-black w-96'>
            <div className='card-body items-center text-center gap-8'>
              <Avatar name={name} address={address} size={75} />
              <input
                className='input input-bordered border-black w-full focus:outline-none'
                type='text'
                placeholder='Enter your name'
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <div className='card-action w-full'>
                <button
                  className='btn btn-lg btn-block bg-black text-white hover:bg-black mb-4'
                  onClick={joinRoom}
                >
                  Play
                </button>

                <button
                  className='btn btn-block bg-black text-white hover:bg-black'
                  onClick={createRoom}
                >
                  Create Private Room
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className='w-full lg:w-[700px]'>
        <div className='flex flex-col items-center justify-center gap-4 m-4'>
          <h1 className='bg-clip-text bg-gradient-to-b from-gray-900 via-purple-900 to-violet-600 text-transparent text-6xl font-bold'>
            Draw some cool sh*t, laugh while guessing, and make them NFTs!
          </h1>
          <div className='text-gray-500 text-sm'>Mint is free!</div>
        </div>
      </div>
    </div>
  )
}

export default Join
