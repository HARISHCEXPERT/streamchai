export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/overlay/', '/qr/', '/api/'],
    },
    sitemap: 'https://streamchai.com/sitemap.xml',
  }
}
