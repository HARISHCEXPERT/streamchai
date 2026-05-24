export const metadata = {
  title: 'StreamChai — Live UPI Alerts for Indian Streamers',
  description: 'Turn UPI payments into live stream interactions. Viewer donates via UPI, message pops live on your stream.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'StreamChai — Live UPI Alerts for Indian Streamers',
    description: 'Turn UPI payments into live stream interactions.',
    url: 'https://streamchai.com',
    siteName: 'StreamChai',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#0a0a14' }}>
        {children}
      </body>
    </html>
  )
}
