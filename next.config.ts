import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@electric-sql/pglite", "postgres", "@react-pdf/renderer"],
  poweredByHeader: false,
  // fichiers chargés dynamiquement par la génération PDF (polices standard), non détectés automatiquement
  outputFileTracingIncludes: {
    "/api/reports/[id]/pdf": ["./node_modules/pdfkit/js/standard-fonts/**/*", "./node_modules/pdfkit/js/data/**/*", "./node_modules/@react-pdf/**/*.wasm", "./node_modules/yoga-layout/**/*"],
  },
  async headers() {
    return [{ source: "/(.*)", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ] }];
  },
};

export default nextConfig;
