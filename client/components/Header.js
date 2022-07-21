import NextLink from 'next/link'
import { ConnectButton } from '@rainbow-me/rainbowkit'

const Header = () => {
  return (
    <header className='flex flex-row items-center justify-between gap-2 p-6 mb-16'>
      <div className='flex'>
        <NextLink href='/'>
          <div className='flex flex-shrink-0 items-center justify-center gap-2 font-medium text-2xl cursor-pointer'>
            <img src='/img/dino.png' alt='Dino Drawing' className='h-10 w-10' />
            mintibbl.fun
          </div>
        </NextLink>
      </div>
      <div className='flex-none'>
        <ConnectButton />
      </div>
    </header>
  )
}
export default Header
