import Avatar from '../components/Avatar'
import { shortenAddress } from '../utils/shortenAddress'

const Join = ({ address, name, setName, joinRoom, createRoom }) => {
  return (
    <div className='flex items-center justify-center'>
      <div className='card border w-96'>
        <div className='card-body items-center text-center gap-8'>
          <Avatar name={name} address={address} size={75} />

          <div className='card-title'>
            {address ? shortenAddress(address) : ''}
          </div>

          <input
            className='input input-bordered w-full'
            type='text'
            placeholder='Enter your name'
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div className='card-action w-full'>
            <button
              className='btn btn-outline btn-block mb-4'
              onClick={joinRoom}
            >
              Play
            </button>

            <button className='btn btn-outline btn-block' onClick={createRoom}>
              Create Private Room
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Join
