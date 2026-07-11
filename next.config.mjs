/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // @react-pdf/renderer ships ESM that Next can bundle on the server.
  experimental: {
    serverComponentsExternalPackages: ["unpdf", "mammoth"],
  },
  // Proxy the admin panel (a separate app) under /admin on this same domain.
  // Set ADMIN_ORIGIN in Vercel to the admin deployment's URL, e.g.
  //   ADMIN_ORIGIN=https://hyrise-admin.vercel.app
  // Until it's set, these rewrites are skipped (no effect locally).
  async rewrites() {
    const adminOrigin = process.env.ADMIN_ORIGIN?.replace(/\/$/, "");
    if (!adminOrigin) return [];
    return [
      { source: "/admin", destination: `${adminOrigin}/admin` },
      { source: "/admin/:path*", destination: `${adminOrigin}/admin/:path*` },
    ];
  },
};

export default nextConfig;
