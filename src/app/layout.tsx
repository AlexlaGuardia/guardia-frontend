import type { Metadata, Viewport } from "next";
import { Fraunces, DM_Sans, Lora } from "next/font/google";
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

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://guardiacontent.com'),
  openGraph: {
    title: 'Guardia - Social Media That Works For You',
    description: 'Send us your photos. We style them, write the captions, post on schedule, and handle engagement — so you can run your business.',
    url: 'https://guardiacontent.com',
    siteName: 'Guardia',
    type: 'website',
    images: [{ url: '/images/guardia-og.png', width: 1200, height: 630, alt: 'Guardia - Social Media Management for Local Businesses' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Guardia - Social Media That Works For You',
    description: 'Send us your photos. We style them, write the captions, post on schedule, and handle engagement — so you can run your business.',
    images: ['/images/guardia-og.png'],
  },
  title: "Guardia - Social Media That Works For You",
  description: "Send us your photos. We style them, write the captions, post on schedule, and handle engagement — so you can run your business.",
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
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://guardiacontent.com',
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
      <body className={`${fraunces.variable} ${dmSans.variable} ${lora.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
