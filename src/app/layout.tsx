import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Freedom by Design - AI Business Strategist",
  description: "Your personal business coach with Freedom Score integration - Nuclear Clean v3.0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              console.log('[LAYOUT] Clean layout loaded - no error suppression');
            `
          }}
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}