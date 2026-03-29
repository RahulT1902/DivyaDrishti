import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "DivyaDrishti | Quantitative Life Operating System",
  description: "A real-time analytical engine for life decisions powered by Vedic Astrology",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-black text-white antialiased`}>
        {children}
      </body>
    </html>
  );
}
