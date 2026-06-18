import "./globals.css";
import { CosmicBackground } from "@/components/CosmicBackground";
import { LanguageProvider } from "@/context/LanguageContext";

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
      <body className="antialiased selection:bg-amber-500/20 text-black/80">
        <LanguageProvider>
          <CosmicBackground>
            {children}
          </CosmicBackground>
        </LanguageProvider>
      </body>
    </html>
  );
}
