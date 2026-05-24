export const metadata = {
  title: 'StreamChai — Live UPI Donation Alerts for Indian Streamers',
  description: 'StreamChai lets Indian streamers receive UPI donations live on stream. Viewer scans QR, pays ₹1 to ₹500+, message pops up on OBS instantly. Works with YouTube Live, Instagram Live. Free to start.',
  keywords: [
    'stream donation India',
    'UPI donation streamer',
    'OBS donation alert India',
    'Indian streamer donation',
    'live stream UPI payment',
    'YouTube live donation India',
    'streaming donation overlay',
    'StreamChai',
    'streamer alert India',
    'Razorpay streamer',
    'donation overlay OBS',
    'Indian gaming streamer',
    'stream support UPI',
    'chai pilao streamer',
    'live donation popup',
  ],
  authors: [{ name: 'StreamChai' }],
  creator: 'StreamChai',
  metadataBase: new URL('https://streamchai.com'),
  alternates: { canonical: 'https://streamchai.com' },
  openGraph: {
    title: 'StreamChai — Live UPI Alerts for Indian Streamers',
    description: 'Viewer scans QR → pays via UPI → message pops live on your stream. Free. Works with OBS, YouTube, Instagram.',
    url: 'https://streamchai.com',
    siteName: 'StreamChai',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StreamChai — Live UPI Alerts for Indian Streamers',
    description: 'Viewer scans QR → pays via UPI → message pops live on your stream. Free.',
    creator: '@streamchai',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'StreamChai',
              applicationCategory: 'MultimediaApplication',
              operatingSystem: 'Web',
              description: 'Live UPI donation alerts for Indian streamers. Viewers donate via UPI, message pops up live on OBS stream.',
              url: 'https://streamchai.com',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'INR',
                description: 'Free during beta',
              },
              audience: {
                '@type': 'Audience',
                audienceType: 'Indian Streamers, YouTubers, Content Creators',
              },
            }),
          }}
        />
      </head>
      <body style={{ margin: 0, padding: 0, background: '#0a0a14' }}>
        {children}
      </body>
    </html>
  )
}
