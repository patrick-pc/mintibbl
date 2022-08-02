import Document, { Html, Head, Main, NextScript } from 'next/document'
import Script from 'next/script'

class AppDocument extends Document {
  render() {
    return (
      <Html lang='en'>
        <Head>
          <Script id='google-analytics' strategy='lazyOnload'>
            {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS}', {
              page_path: window.location.pathname,
            });
                `}
          </Script>
          <link rel='preconnect' href='https://vitals.vercel-insights.com' />
          <link
            href='https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
            rel='stylesheet'
          />
          <meta property='og:url' content='https://mintibbl.fun' />
          <meta property='og:site_name' content='mintibbl.fun' />
          <meta property='og:image' content='/img/dino.png' />
          <meta name='theme-color' content='#FFFFFF' />
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
