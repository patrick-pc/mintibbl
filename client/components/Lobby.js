import Avatar from './Avatar'

const Lobby = ({
  roomId,
  users,
  startGame,
  setTotalRounds,
  setDrawTime,
  isGameHost,
}) => {
  return (
    <div className='flex justify-center container overflow-hidden gap-8 mx-auto'>
      <div className='flex flex-col justify-center border border-black rounded-2xl w-96 gap-8 p-8'>
        <div>
          <label className='label'>
            <span className='label-text'>Rounds</span>
          </label>
          <select
            className='select select-bordered border-black w-full mb-4'
            defaultValue={'3'}
            onChange={(e) => setTotalRounds(e.target.value)}
            disabled={!isGameHost}
          >
            <option value='2'>2</option>
            <option value='3'>3</option>
            <option value='4'>4</option>
            <option value='5'>5</option>
            <option value='6'>6</option>
          </select>

          <label className='label'>
            <span className='label-text'>Draw time in seconds</span>
          </label>
          <select
            className='select select-bordered border-black w-full'
            defaultValue={'80'}
            onChange={(e) => setDrawTime(e.target.value)}
            disabled={!isGameHost}
          >
            <option value='60'>60</option>
            <option value='70'>70</option>
            <option value='80'>80</option>
            <option value='90'>90</option>
            <option value='100'>100</option>
            <option value='120'>120</option>
          </select>
        </div>

        <button
          className='btn btn-lg btn-block bg-black text-white hover:bg-black'
          onClick={startGame}
          disabled={users.length < 2 || !isGameHost}
        >
          Start Game
        </button>
      </div>

      <div className='flex flex-col gap-8'>
        {/* <div className='flex items-center justify-between border p-2'>
          <button className=''>{`${process.env.NEXT_PUBLIC_CLIENT_URL}?pid=${roomId}`}</button>

          <button>copy</button>
        </div> */}

        <div className='flex flex-wrap items-center w-96 gap-4'>
          {users?.map((user) => {
            return (
              <div className='flex flex-col items-center gap-4' key={user.id}>
                <Avatar name={user.name} address={user.address} size={50} />
                <div className='font-medium'>{user.name}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Lobby
