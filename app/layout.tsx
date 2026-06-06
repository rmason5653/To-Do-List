import type { Metadata, Viewport } from "next";
import { Inter, Montserrat } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

// Inter — all body, UI text, and data.
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

// Montserrat — headings, nav, buttons, card titles, big numbers.
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["500", "700", "800", "900"],
  variable: "--font-montserrat",
  display: "swap",
});

// American Captain — display punch only (splash / empty / milestone).
const americanCaptain = localFont({
  src: [
    { path: "./fonts/American_Captain.otf", weight: "900", style: "normal" },
  ],
  variable: "--font-american-captain",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Punch List — Mason Homes",
  description: "Daily ops and personal task hub, synced with Slack.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0B0B0D",
};

// Apply the saved theme before paint so there is no light/dark flash.
const themeInit = `(function(){try{if(localStorage.getItem('todo_theme')==='light')document.documentElement.classList.add('light');}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${montserrat.variable} ${americanCaptain.variable}`}
    >
      <body className="font-sans">
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        {children}
      </body>
    </html>
  );
}
