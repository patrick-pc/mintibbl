import Avatar from '../components/Avatar'
import { shortenAddress } from '../utils/shortenAddress'

const Join = ({ address, setRoom, joinRoom }) => {
  return (
    <div className='flex items-center justify-center'>
      <div className='card border w-96'>
        <div className='card-body items-center text-center gap-8'>
          <Avatar address={address} size={100} />

          <div className='card-title'>
            {address ? shortenAddress(address) : ''}
          </div>

          <input
            className='input input-bordered w-full'
            type='text'
            placeholder='Room id'
            onChange={(e) => setRoom(e.target.value)}
          />

          <div className='card-action w-full'>
            <button className='btn btn-outline btn-block' onClick={joinRoom}>
              Join
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Join
