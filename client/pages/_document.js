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
          <meta property='og:url' content='https://mintibbl.fun' />
          <meta property='og:site_name' content='mintibbl.fun' />
          <meta property='og:image' content='/img/dino.png' />
          <meta name='theme-color' content='#000000' />
          <meta name='twitter:card' content='summary' />
          <meta
            name='twitter:image'
            content='https://mintibbl.fun/img/dino.png'
          />
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
