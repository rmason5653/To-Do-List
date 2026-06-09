import type { Metadata, Viewport } from "next";
import { Inter, Montserrat } from "next/font/google";
import localFont from "next/font/local";
import NavBar from "@/app/components/NavBar";
import { getViewer } from "@/lib/auth-context";
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
// Capped at 5 uses across the app; bundled from the Mason brand kit.
const americanCaptain = localFont({
  src: [
    { path: "./fonts/American_Captain.otf", weight: "900", style: "normal" },
  ],
  variable: "--font-american-captain",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Par — Mason Homes Inventory",
  description:
    "Par vs actual across every unit and central. Every central pull logged.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0B0B0D",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAdmin = (await getViewer())?.role === "admin";
  return (
    <html
      lang="en"
      className={`${inter.variable} ${montserrat.variable} ${americanCaptain.variable}`}
    >
      <body className="font-sans">
        {/* Apply saved theme before paint (no flash). Dark is the default. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{if(localStorage.getItem('mason_theme')==='light'){document.documentElement.setAttribute('data-theme','light');}}catch(e){}})();",
          }}
        />
        <NavBar isAdmin={isAdmin} />
        {children}
      </body>
    </html>
  );
}
