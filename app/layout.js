import { SearchProvider } from "@/context/SearchContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "./globals.css";

export const metadata = {
  title: "ShopSmart | AI-Powered Price Comparison",
  description: "Stop tab-hopping. Start saving! ShopSmart uses AI to find the lowest prices across Amazon, Flipkart, eBay, and more instantly.",
  keywords: ["price comparison", "shopping", "ecommerce", "deals", "discounts", "ShopSmart", "AI shopping"],
  openGraph: {
    title: "ShopSmart | Best Deals Finder",
    description: "Identify products and find the lowest prices across all major e-commerce platforms in seconds.",
    url: "https://shopsmart-finder.vercel.app",
    siteName: "ShopSmart",
    images: [
      {
        url: "/Images/Logo_shopsmart.png",
        width: 800,
        height: 600,
        alt: "ShopSmart Logo",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ShopSmart | AI Price Comparison",
    description: "The smartest way to save money while shopping online.",
    images: ["/Images/Logo_shopsmart.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body>
        <SearchProvider>
          <Navbar />
          {children}
          <Footer />
        </SearchProvider>
      </body>
    </html>
  );
}
