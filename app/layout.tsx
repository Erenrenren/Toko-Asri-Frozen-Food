import type { Metadata, Viewport } from "next";

import "@/app/globals.css";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — ERP Frozen Food`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_TAGLINE,
  applicationName: APP_NAME,
  keywords: [
    "ERP",
    "frozen food",
    "Toko Asri",
    "manajemen stok",
    "SaaS",
  ],
};

export const viewport: Viewport = {
  themeColor: "#0e7490",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
