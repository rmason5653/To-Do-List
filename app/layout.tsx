import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ops To-Do — Mason Homes",
  description: "Daily ops and personal task hub, synced with Slack.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0E0E10",
};

// Apply the saved theme before paint so there is no light/dark flash.
const themeInit = `(function(){try{if(localStorage.getItem('todo_theme')==='light')document.documentElement.classList.add('light');}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        {children}
      </body>
    </html>
  );
}
