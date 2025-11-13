/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export", // 👈 new Next.js 13.4+ way to enable static export
  distDir: "out", // optional, ensures CDK finds /out
};

export default nextConfig;
