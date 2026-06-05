import type { Metadata } from "next";
import { Inter, DM_Sans, Ubuntu} from "next/font/google"; 
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import ClientInit from "../components/ClientInIt";
import Chatbot from "../components/Chatbot";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

// Configure Inter (Your Default)
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap', 
});

// Configure any alternative fonts (e.g., DM Sans)
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: 'swap',
});

const ubuntu = Ubuntu({
  weight: ['400'],
  subsets: ["latin"],
  variable: "--font-ubuntu",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Minutebound | Plan your Itinerary",
  description: "Travel Planner Application",
  icons: {
    icon: '/logo.svg', 
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body
        // Inject ALL font variables here, and apply 'font-sans' to set the default
        className={`${inter.variable} ${dmSans.variable} ${ubuntu.variable} font-sans antialiased min-h-screen flex flex-col`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <ClientInit />
          <div className="sticky top-0 z-[100]">
            <Navbar />
          </div>
          <div className="flex-1 flex flex-col min-h-screen">
            {children}
          </div>
          
          <Footer />
          <Chatbot />
        </AuthProvider>
      </body>
    </html>
  );
}

