import Avatar from './Avatar'

const Lobby = ({ users, startGame, isGameHost }) => {
  return (
    <div className='flex justify-center container overflow-hidden gap-4 mx-auto'>
      <div className='flex flex-col justify-center border w-96 p-4'>
        <label className='label'>
          <span className='label-text'>Rounds</span>
        </label>
        <select
          className='select select-bordered w-full mb-4'
          defaultValue={'3'}
          disabled={users.length < 2 || !isGameHost}
        >
          <option value='2'>2</option>
          <option value='3'>3</option>
          <option value='4'>4</option>
          <option value='5'>5</option>
        </select>

        <label className='label'>
          <span className='label-text'>Draw time in seconds</span>
        </label>
        <select
          className='select select-bordered w-full mb-4'
          defaultValue={'80'}
          disabled={users.length < 2 || !isGameHost}
        >
          <option value='60'>60</option>
          <option value='70'>70</option>
          <option value='80'>80</option>
          <option value='90'>90</option>
          <option value='100'>100</option>
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
        <button>http://localhost:3000/?pid={users[0]?.room}</button>
        {users?.map((user) => {
          return (
            <div key={user.id}>
              <Avatar address={user.address} size={50} />
              <div>{user.address}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Lobby
