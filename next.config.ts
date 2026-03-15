import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  // Opcjonalnie wyłączamy optymalizację obrazków dla statycznego exportu (jeśli byłaby używana natywna optymalizacja)
  images: {
    unoptimized: true,
  }
};

export default nextConfig;
