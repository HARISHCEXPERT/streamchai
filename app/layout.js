export const metadata = {
  title: 'StreamChai — Live UPI Alerts for Indian Streamers',
  description: 'Turn UPI payments into live stream interactions.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#0f0f1a' }}>
        {children}
      </body>
    </html>
  )
}
