/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // @react-pdf/renderer ships ESM that Next can bundle on the server.
  experimental: {
    serverComponentsExternalPackages: ["unpdf", "mammoth"],
  },
};

export default nextConfig;
