import Avatar from './Avatar'
import { shortenAddress } from '../utils/shortenAddress'

const Lobby = ({
  room,
  users,
  startGame,
  setTotalRounds,
  setDrawTime,
  isGameHost,
}) => {
  return (
    <div className='flex justify-center container overflow-hidden gap-8 mx-auto'>
      <div className='flex flex-col justify-center border w-96 p-4'>
        <label className='label'>
          <span className='label-text'>Rounds</span>
        </label>
        <select
          className='select select-bordered w-full mb-4'
          defaultValue={'3'}
          onChange={(e) => setTotalRounds(e.target.value)}
          disabled={users.length < 2 || !isGameHost}
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
          className='select select-bordered w-full mb-4'
          defaultValue={'80'}
          onChange={(e) => setDrawTime(e.target.value)}
          disabled={users.length < 2 || !isGameHost}
        >
          <option value='60'>60</option>
          <option value='70'>70</option>
          <option value='80'>80</option>
          <option value='90'>90</option>
          <option value='100'>100</option>
          <option value='120'>120</option>
        </select>

        <button
          className='btn btn-block'
          onClick={startGame}
          disabled={users.length < 2 || !isGameHost}
        >
          Start Game
        </button>
      </div>

      <div>
        <button className='mb-4'>{`${process.env.NEXT_PUBLIC_CLIENT_URL}?pid=${room}`}</button>

        <div className='flex flex-wrap items-center w-96 gap-4'>
          {users?.map((user) => {
            return (
              <div className='flex flex-col items-center gap-2' key={user.id}>
                <Avatar address={user.address} size={50} />
                <div className='text-sm'>{user.name}</div>
                <div className='text-xs'>{shortenAddress(user.address)}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Lobby
