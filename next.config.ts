import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  experimental: {
    // Menjaga ukuran bundle server tetap wajar saat modul SCM/CRM
    // dan payment gateway ditambahkan pada tahap berikutnya.
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
