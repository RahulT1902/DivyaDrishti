import "./globals.css";
import { Outfit } from "next/font/google";
import { CosmicBackground } from "@/components/CosmicBackground";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata = {
  title: "DivyaDrishti | Align Your Actions",
  description: "Understand your timing. Align your actions. A human-centric personal guidance system.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${outfit.className} antialiased selection:bg-amber-500/20 text-black/80`}>
        <CosmicBackground>
          {children}
        </CosmicBackground>
      </body>
    </html>
  );
}
