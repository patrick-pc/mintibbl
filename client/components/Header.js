import NextLink from 'next/link'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'

const Header = () => {
  const { address } = useAccount()

  return (
    <header className='flex flex-row items-center justify-between gap-2 p-6 mb-8'>
      <div className='flex'>
        <NextLink href='/'>
          <div className='flex flex-shrink-0 items-center justify-center gap-2 font-medium text-2xl cursor-pointer'>
            <img src='/img/dino.png' alt='Dino Drawing' className='h-10 w-10' />
            <h1 className={address ? 'hidden lg:block' : 'block'}>mintibbl</h1>
          </div>
        </NextLink>
      </div>
      <div className='flex-none'>
        <ConnectButton.Custom>
          {({
            account,
            chain,
            openAccountModal,
            openChainModal,
            openConnectModal,
            mounted,
          }) => {
            return (
              <div
                {...(!mounted && {
                  'aria-hidden': true,
                  style: {
                    opacity: 0,
                    pointerEvents: 'none',
                    userSelect: 'none',
                  },
                })}
              >
                {(() => {
                  if (!mounted || !account || !chain) {
                    return (
                      <button
                        onClick={openConnectModal}
                        type='button'
                        className='m-btn m-btn-accent m-btn-sm lg:m-btn-md'
                      >
                        Connect Wallet
                      </button>
                    )
                  }

                  if (chain.unsupported) {
                    return (
                      <button
                        onClick={openChainModal}
                        type='button'
                        className='m-btn m-btn-accent m-btn-sm lg:m-btn-md'
                      >
                        Wrong network
                      </button>
                    )
                  }

                  return (
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button
                        onClick={openChainModal}
                        style={{ display: 'flex', alignItems: 'center' }}
                        type='button'
                        className='m-btn m-btn-primary m-btn-sm lg:m-btn-md'
                      >
                        {chain.hasIcon && (
                          <div
                            style={{
                              background: chain.iconBackground,
                              width: 20,
                              height: 20,
                              borderRadius: 999,
                              overflow: 'hidden',
                              marginRight: 4,
                            }}
                          >
                            {chain.iconUrl && (
                              <img
                                alt={chain.name ?? 'Chain icon'}
                                src={chain.iconUrl}
                                style={{ width: 20, height: 20 }}
                              />
                            )}
                          </div>
                        )}
                        <span className='hidden lg:block'>{chain.name}</span>
                      </button>

                      <button
                        onClick={openAccountModal}
                        type='button'
                        className='m-btn m-btn-accent m-btn-sm lg:m-btn-md'
                      >
                        {account.displayName}
                        {account.displayBalance
                          ? ` (${account.displayBalance})`
                          : ''}
                      </button>
                    </div>
                  )
                })()}
              </div>
            )
          }}
        </ConnectButton.Custom>
      </div>
    </header>
  )
}
export default Header
