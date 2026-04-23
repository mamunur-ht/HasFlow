import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HasFlow — HTML to Webflow Converter",
  description: "Convert HTML, CSS & JS into Webflow-compatible structure",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
