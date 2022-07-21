import '../styles/globals.css'
import '@rainbow-me/rainbowkit/styles.css'
import { getDefaultWallets, RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { chain, configureChains, createClient, WagmiConfig } from 'wagmi'
import { alchemyProvider } from 'wagmi/providers/alchemy'
import { publicProvider } from 'wagmi/providers/public'
import { useState, useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import Head from 'next/head'
import Header from '../components/Header'
import Footer from '../components/Footer'

const { chains, provider } = configureChains(
  [chain.mainnet, chain.rinkeby, chain.polygonMumbai],
  [
    alchemyProvider({ alchemyId: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY }),
    publicProvider(),
  ]
)

const { connectors } = getDefaultWallets({
  appName: 'mintibbl.fun',
  chains,
})

const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
})

function MyApp({ Component, pageProps }) {
  const [showing, setShowing] = useState(false)

  useEffect(() => {
    setShowing(true)
  }, [])

  if (!showing) {
    return null
  }

  if (typeof window === 'undefined') {
    return <></>
  } else {
    return (
      <WagmiConfig client={wagmiClient}>
        <RainbowKitProvider chains={chains}>
          <Head>
            <title>mintibbl.fun</title>
            <meta
              name='description'
              content='Immortalized those hilarious drawings!'
            />
            <link rel='icon' href='/favicon.png' />
          </Head>
          <div className='min-h-screen w-full'>
            <Header />
            <Component {...pageProps} />
            <Footer />
          </div>
          <Toaster />
        </RainbowKitProvider>
      </WagmiConfig>
    )
  }
}

export default MyApp
