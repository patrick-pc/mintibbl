import Document, { Html, Head, Main, NextScript } from 'next/document'

class AppDocument extends Document {
  render() {
    return (
      <Html lang='en'>
        <Head>
          <link rel='preconnect' href='https://vitals.vercel-insights.com' />
          <link
            href='https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
            rel='stylesheet'
          />
          <link rel='icon' href='/favicon.png' />
          <meta
            name='description'
            content='Draw, guess, and mint with your frens!'
          />
          <meta
            name='viewport'
            content='width=device-width, initial-scale=1, maximum-scale=1'
          />
          <meta property='og:url' content='https://mintibbl.fun' />
          <meta property='og:site_name' content='mintibbl.fun' />
          <meta property='og:image' content='/img/dino.png' />
          <meta name='theme-color' content='#FFFFF' />
          <meta name='twitter:card' content='summary' />
          <meta
            name='twitter:image'
            content='https://mintibbl.fun/img/dino.png'
          />
          <title>mintibbl</title>
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default AppDocument
