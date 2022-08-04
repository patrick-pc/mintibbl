import Avatar from './Avatar'
import { shortenAddress } from '../utils/shortenAddress'
import { copyToClipboard } from '../utils/copyToClipboard'

const Lobby = ({
  roomId,
  users,
  startGame,
  setTotalRounds,
  setDrawTime,
  isGameHost,
}) => {
  return (
    <div className='container mx-auto'>
      <div className='flex flex-col lg:flex-row items-center justify-center gap-8 mx-4'>
        {/* Game Settings */}
        <div className='w-full lg:w-[400px]'>
          <div className='flex items-center justify-center'>
            <div className='flex flex-col bg-white m-border w-96 gap-8 p-8'>
              <div>
                <label className='label'>
                  <span className='label-text'>Rounds</span>
                </label>
                <select
                  className='select m-border w-full disabled:m-border mb-4'
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
                  className='select m-border w-full disabled:m-border'
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
                className='m-btn m-btn-primary disabled:m-btn-disabled disabled:cursor-not-allowed'
                onClick={startGame}
                disabled={users.length < 2 || !isGameHost}
              >
                Start Game
              </button>
            </div>
          </div>
        </div>

        {/* Users */}
        <div className='w-full lg:w-[400px] h-[333px]'>
          <div className='flex items-center justify-center'>
            <div className='flex flex-col w-96 gap-8'>
              <div
                className={`${
                  roomId.toString().startsWith('P')
                    ? 'flex items-center justify-between m-border p-4'
                    : 'hidden'
                }`}
              >
                <p className='text-xs md:text-sm font-medium'>{`${process.env.NEXT_PUBLIC_CLIENT_URL}?pid=${roomId}`}</p>
                <button
                  className='m-btn m-btn-secondary m-btn-sm'
                  onClick={() =>
                    copyToClipboard(
                      `${process.env.NEXT_PUBLIC_CLIENT_URL}?pid=${roomId}`,
                      'Copied invite link to clipboard!'
                    )
                  }
                >
                  Copy
                </button>
              </div>
              <div className='grid grid-cols-2 lg:grid-cols-3 gap-8'>
                {users?.map((user) => {
                  return (
                    <div
                      className='flex flex-col items-center gap-2'
                      key={user.id}
                    >
                      <Avatar
                        name={user.name}
                        address={user.address}
                        size={50}
                      />
                      <div className='flex flex-col items-center justify-center text-center'>
                        <p className='font-medium'>{user.name}</p>
                        <span
                          className={`bg-violet-200 rounded text-gray-500 text-2xs font-mono px-1 py-0.5 ${
                            user.address && 'cursor-pointer'
                          }`}
                          onClick={() => {
                            user.address &&
                              copyToClipboard(
                                user.address,
                                'Copied wallet address to clipboard!'
                              )
                          }}
                        >
                          {user.address
                            ? shortenAddress(user.address)
                            : 'Not Connected'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* <p className='text-xs opacity-50'>min. 2 players | max. 6 players</p> */}
    </div>
  )
}

export default Lobby
