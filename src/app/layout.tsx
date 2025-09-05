import type { Metadata } from "next";
import "./globals.css";
import ClientAuthProvider from '../components/ClientAuthProvider';
import SubdomainRedirect from '../components/SubdomainRedirect';

export const metadata: Metadata = {
  title: "AI Business Strategist",
  description: "Your personal business coach with Freedom Score integration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SubdomainRedirect />
        <ClientAuthProvider>
          {children}
        </ClientAuthProvider>
      </body>
    </html>
  );
}