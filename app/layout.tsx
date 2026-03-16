import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MoonStudio Sales Dashboard",
  description: "Dashboard for tracking 3D printing sales across platforms",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
