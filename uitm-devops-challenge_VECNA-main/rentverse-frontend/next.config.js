/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true, // Required for static export
    // Allow external images from scrapers
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
      },
      // FazWaz domains for scraped images
      {
        protocol: 'https',
        hostname: 'cdn.fazwaz.com',
      },
      {
        protocol: 'https',
        hostname: '*.fazwaz.com', // Wildcard for all subdomains
      },
      {
        protocol: 'https',
        hostname: 'www.fazwaz.my',
      },
      {
        protocol: 'https',
        hostname: '*.fazwaz.my', // Wildcard for Malaysian subdomains
      },
    ],
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:5000',
    NEXT_PUBLIC_MAPTILER_API_KEY: process.env.NEXT_PUBLIC_MAPTILER_API_KEY || '',
  },

  // API rewrites to proxy requests to backend
  async rewrites() {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:5000';
    const cleanApiBaseUrl = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;

    return [
      // Property routes
      {
        source: '/api/properties/:path*',
        destination: `${cleanApiBaseUrl}/api/properties/:path*`,
      },

      // Authentication routes
      {
        source: '/api/auth/:path*',
        destination: `${cleanApiBaseUrl}/api/auth/:path*`,
      },

      // Upload routes
      {
        source: '/api/upload/:path*',
        destination: `${cleanApiBaseUrl}/api/upload/:path*`,
      },

      // Booking routes
      {
        source: '/api/bookings/:path*',
        destination: `${cleanApiBaseUrl}/api/bookings/:path*`,
      },

      // Favorites routes
      {
        source: '/api/favorites/:path*',
        destination: `${cleanApiBaseUrl}/api/properties/:path*`,
      },

      // Admin routes
      {
        source: '/api/admin/:path*',
        destination: `${cleanApiBaseUrl}/api/admin/:path*`,
      },

      // Fallback for all other API routes
      {
        source: '/api/:path*',
        destination: `${cleanApiBaseUrl}/api/:path*`,
      },
    ];
  },

  // // CORS headers
  // async headers() {
  //   return [
  //     {
  //       source: '/api/:path*',
  //       headers: [
  //         {
  //           key: 'Access-Control-Allow-Origin',
  //           value: process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3001'
  //         },
  //         {
  //           key: 'Access-Control-Allow-Methods',
  //           value: 'GET, POST, PUT, DELETE, OPTIONS, PATCH'
  //         },
  //         {
  //           key: 'Access-Control-Allow-Headers',
  //           value: 'X-Requested-With, Content-Type, Authorization, Accept'
  //         },
  //         {
  //           key: 'Access-Control-Allow-Credentials',
  //           value: 'true'
  //         },
  //       ],
  //     },
  //   ];
  // },

  // React strict mode (disable if causing double renders)
  reactStrictMode: false,

  // Allow TypeScript to ignore build errors during development
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;