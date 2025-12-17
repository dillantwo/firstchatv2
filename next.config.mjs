/** @type {import('next').NextConfig} */
const nextConfig = {
  // 增加服务器響應時間限制
  serverRuntimeConfig: {
    // Will only be available on the server side
    mySecret: 'secret',
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
    staticFolder: '/static',
  },
  // 性能优化配置
  serverExternalPackages: ['mongoose'],
  // API 路由优化
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Connection',
            value: 'keep-alive',
          },
        ],
      },
    ];
  },
  // 启用 instrumentation
  experimental: {
    instrumentationHook: true,
  },
};

export default nextConfig;
