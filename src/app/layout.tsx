import type { Metadata } from "next";
import "./globals.css";
import ClientAuthProvider from '../components/ClientAuthProvider';
import SubdomainRedirect from '../components/SubdomainRedirect';

export const metadata: Metadata = {
  title: "Freedom by Design - AI Business Strategist",
  description: "Your personal business coach with Freedom Score integration - Nuclear Clean v2.0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
      </head>
      <body>
        <ClientAuthProvider>
          <SubdomainRedirect />
          {children}
        </ClientAuthProvider>
      </body>
    </html>
  );
}