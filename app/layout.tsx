import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const imageUrl = `${protocol}://${host}/icon.png`;
  const title = "R6 Picker — Tu próxima ronda, al azar";
  const description = "Sorteá operadores de ataque, defensa y mapas de Rainbow Six Siege.";
  return {
    title,
    description,
    icons: {
      icon: [
        { url: "/icon.png", type: "image/png" },
        { url: "/icon.jpg", type: "image/jpeg" },
      ],
      shortcut: "/icon.png",
      apple: "/icon.png",
    },
    openGraph: { title, description, images: [{ url: imageUrl, width: 512, height: 512, alt: "R6 Picker Logo" }] },
    twitter: { card: "summary", title, description, images: [imageUrl] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body></html>;
}
