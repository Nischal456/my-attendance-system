import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'GeckoWorks OMS',
    short_name: 'GeckoWorks',
    description: 'Smart Office Management System',
    start_url: '/login',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#0f172a',
    icons: [
      {
        src: '/paw.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/paw.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
