/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // We only use wagmi's `injected()` connector, but `wagmi/connectors`
    // re-exports every connector from one barrel file, including
    // `baseAccount` — which pulls in @coinbase/cdp-sdk's optional x402
    // payment packages that aren't installed. Stub that unused chain out
    // so webpack doesn't fail resolving modules we never call.
    config.resolve.alias = {
      ...config.resolve.alias,
      '@base-org/account': false,
      '@coinbase/cdp-sdk': false,
    }
    return config
  },
}

module.exports = nextConfig
