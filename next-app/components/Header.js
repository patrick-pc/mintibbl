import NextLink from 'next/link'
import { ConnectButton } from '@rainbow-me/rainbowkit'

const Header = () => {
  return (
    <header className='flex flex-row items-center justify-between gap-2 p-6 mb-6'>
      <div className='flex'>
        <NextLink href='/'>
          <span className='font-bold text-2xl cursor-pointer'>Mintibble</span>
        </NextLink>
      </div>
      <div className='flex-none'>
        <ConnectButton />
      </div>
    </header>
  )
}
export default Header
