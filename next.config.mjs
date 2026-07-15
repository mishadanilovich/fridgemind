import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  // Офлайн-фоллбэк должен лежать в precache, иначе fallbacks в app/sw.ts нечего отдавать;
  // revision меняется на каждую сборку, чтобы SW перекачал свежий HTML страницы.
  additionalPrecacheEntries: [{ url: "/~offline", revision: crypto.randomUUID() }],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Supabase Storage public bucket host — replace with your project ref
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default withSerwist(nextConfig);
