import { useEffect, useState } from 'react'
import { CONTRACT_ADDRESS } from '../constants'
import Avatar from '../components/Avatar'
import axios from 'axios'

const Join = ({ address, name, setName, joinRoom, createRoom }) => {
  const [nfts, setNfts] = useState([])

  useEffect(() => {
    fetchNfts()
  }, [])

  const fetchNfts = async () => {
    const limit = 15
    const baseURL = `https://polygon-mumbai.g.alchemy.com/nft/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}/getNFTsForCollection/`
    // const fetchURL = `${baseURL}?contractAddress=${CONTRACT_ADDRESS}&withMetadata=${true}&limit=${limit}`
    const fetchURL = `${baseURL}?contractAddress=0x3807be837a65ebcf97647f6490b4337d03d76579&withMetadata=${true}&limit=${limit}`
    const config = {
      method: 'GET',
      url: fetchURL,
    }
    const res = await axios(config)
    setNfts(res.data.nfts)
  }

  return (
    <div className='flex flex-col container mx-auto gap-40'>
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
              Draw some cool sh*t, laugh while guessing, and make them NFTs!
            </h2>
            <p className='text-sm opacity-50'>It's free, even gas!</p>
          </div>
        </div>
      </div>

      <div className='flex flex-col gap-8 mx-4'>
        <div className='flex flex-col md:flex-row items-center justify-between'>
          <h3 className='text-lg font-medium'>Latest Drawings</h3>

          <div className='flex gap-4'>
            <a
              className='flex items-center justify-center'
              href='https://testnets.opensea.io/collection/mintibbl'
              target='_blank'
            >
              <img className='h-7 w-7' src='/img/opensea.png' alt='OpenSea' />
              <span className='text-blue-500 text-sm font-medium'>OpenSea</span>
            </a>
            <a
              className='flex items-center justify-center'
              href='https://opensea.io/collection/mintnft-721?search[sortAscending]=false&search[sortBy]=CREATED_DATE&search[stringTraits][0][name]=Collection&search[stringTraits][0][values][0]=Mintibbl%20-%20Test'
              target='_blank'
            >
              <img className='h-7 w-7' src='/img/mint.png' alt='OpenSea' />{' '}
              <span className='text-violet-500 text-sm font-medium'>
                Gas-Free NFTs
              </span>
            </a>
          </div>
        </div>

        <div className='grid grid-cols-2 lg:grid-cols-5 gap-8'>
          {nfts.map((nft, i) => (
            <div
              className='flex flex-col items-center justify-center gap-2 m-test'
              key={i}
            >
              <a
                className='m-item'
                href={`https://testnets.opensea.io/assets/mumbai/0x3807be837a65ebcf97647f6490b4337d03d76579/${parseInt(
                  nft.id.tokenId
                )}`}
                target='_blank'
              >
                <img
                  className='h-auto w-auto rounded-md'
                  src={nft.media[0].gateway}
                  alt={nft.title}
                />
              </a>

              <div className='flex items-center justify-between w-full'>
                <span className='font-medium'>{nft.title}</span>

                <div
                  className='tooltip tooltip-bottom'
                  data-tip={`Mintibbl "${nft.metadata.name}" collection`}
                >
                  <a
                    className='opacity-20'
                    href={`https://testnets.opensea.io/collection/mintibbl?search[stringTraits][0][name]=Word&search[stringTraits][0][values][0]=${nft.metadata.name}`}
                    target='_blank'
                  >
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      className='h-5 w-5'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                      strokeWidth='2'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'
                      />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Join
