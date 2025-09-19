import type { Metadata } from "next";
import "./globals.css";
import ClientAuthProvider from '../components/ClientAuthProvider';
import SubdomainRedirect from '../components/SubdomainRedirect';

export const metadata: Metadata = {
  title: "Freedom by Design - AI Business Strategist",
  description: "Your personal business coach with Freedom Score integration - Fixed detectStore v4.0",
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
              // Fix detectStore error by providing a fallback
              (function() {
                try {
                  if (typeof window !== 'undefined') {
                    // Provide detectStore fallback if missing
                    if (!window.detectStore) {
                      window.detectStore = function() {
                        return Promise.resolve({ success: true, detected: false });
                      };
                    }
                    console.log('[LAYOUT] DetectStore fallback provided');
                  }
                } catch (e) {
                  console.warn('[LAYOUT] DetectStore setup failed:', e);
                }
              })();
            `
          }}
        />
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