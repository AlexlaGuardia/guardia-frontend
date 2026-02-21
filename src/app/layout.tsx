import type { Metadata, Viewport } from "next";
import { Fraunces, DM_Sans } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://guardiacontent.com'),
  openGraph: {
    title: 'Guardia - Social Media That Works For You',
    description: 'We style your photos, write every caption, schedule every post, and manage engagement for 24 hours.',
    url: 'https://guardiacontent.com',
    siteName: 'Guardia',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Guardia - Social Media That Works For You',
    description: 'We style your photos, write every caption, schedule every post, and manage engagement for 24 hours.',
  },
  title: "Guardia - Social Media That Works For You",
  description: "We style your photos, write every caption, schedule every post, and manage engagement for 24 hours.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Guardia",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#C9A227",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="facebook-domain-verification" content="fnskltx8b70nq7l351c5s4uyfen8am" />
      </head>
      <body className={`${fraunces.variable} ${dmSans.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
