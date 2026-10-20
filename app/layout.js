import { ClerkProvider } from "@clerk/nextjs";
import { Instrument_Serif, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const serif = Instrument_Serif({ weight: "400", subsets: ["latin"], variable: "--font-serif" });
const sans = IBM_Plex_Sans({ weight: ["400", "500", "600"], subsets: ["latin"], variable: "--font-sans" });

export const metadata = {
  title: "Plumb — straight answers",
  description: "Ask anything. Get a straight answer, and know when it isn't sure.",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${serif.variable} ${sans.variable}`}>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
