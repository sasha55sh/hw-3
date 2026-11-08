import type { Metadata } from "next";
import { Manrope, Playwrite_US_Trad } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope-family",
  subsets: ["latin"],
});

const playwrite = Playwrite_US_Trad({
  variable: "--font-playwrite-family",
});

export const metadata: Metadata = {
  title: "Hook Lab",
  description: "Generate hook, first line and on-screen text variants from a winning ad script.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${manrope.variable} ${playwrite.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-manrope">{children}</body>
    </html>
  );
}
