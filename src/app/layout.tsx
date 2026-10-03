import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed, Barlow_Semi_Condensed } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { StickyCartBar } from "@/components/cart/StickyCartBar";

// The logo's tagline is set in Bahnschrift (a DIN-style railway signage face).
// Barlow is the closest open superfamily, so headings, UI and the departure
// boards all share the signage DNA of the brand mark.
const barlow = Barlow({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-barlow", display: "swap" });
const barlowSemi = Barlow_Semi_Condensed({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-barlow-semi", display: "swap" });
const barlowCondensed = Barlow_Condensed({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-barlow-condensed", display: "swap" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Safar Zaika — Hot food, delivered to your train seat",
    template: "%s · Safar Zaika",
  },
  description:
    "Order fresh meals from trusted local kitchens and get them delivered to your berth at the next station. Enter your PNR, pick a station, eat well on every journey.",
  applicationName: "Safar Zaika",
  keywords: ["food on train", "order food in train", "PNR food delivery", "railway food delivery", "Safar Zaika"],
  openGraph: {
    type: "website",
    siteName: "Safar Zaika",
    title: "Safar Zaika — Your journey. Our zaika.",
    description: "Fresh food from local kitchens, delivered to your seat at the next station.",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Safar Zaika — Your journey. Our zaika.",
    description: "Fresh food from local kitchens, delivered to your seat at the next station.",
  },
  robots: { index: false, follow: false }, // prototype: keep out of search engines until launch
};

export const viewport: Viewport = {
  themeColor: "#0d2250",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${barlow.variable} ${barlowSemi.variable} ${barlowCondensed.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-cocoa-900 focus:px-4 focus:py-2 focus:text-cream-50"
        >
          Skip to content
        </a>
        <Providers>
          <Navbar />
          {/* overflow-x-clip here (not on body) so bleeding carousels never widen the mobile layout viewport */}
          <main id="main" className="flex-1 overflow-x-clip">
            {children}
          </main>
          <Footer />
          <StickyCartBar />
        </Providers>
      </body>
    </html>
  );
}
