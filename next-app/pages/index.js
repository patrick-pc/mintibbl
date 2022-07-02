import Head from 'next/head'
import DrawingBoard from '../components/DrawingBoard'

const Home = () => {
  return (
    <div>
      <Head>
        <title>Mintibble</title>
        <meta
          name='description'
          content='Immortalized those hilarious drawings!'
        />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <div className='flex items-center justify-center h-screen w-full gap-8'>
        <DrawingBoard />
      </div>
    </div>
  )
}

export default Home
