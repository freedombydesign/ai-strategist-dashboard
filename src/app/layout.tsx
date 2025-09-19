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
              // COMPREHENSIVE detectStore fix
              (function() {
                try {
                  if (typeof window !== 'undefined') {
                    // Create a robust detectStore function
                    const mockDetectStore = function() {
                      return Promise.resolve({ success: true, detected: false });
                    };

                    // Set detectStore in multiple ways to catch all access patterns
                    window.detectStore = mockDetectStore;

                    // Also set it as a default export pattern
                    if (!window.a) window.a = {};
                    if (!window.a.default) window.a.default = {};
                    window.a.default.detectStore = mockDetectStore;

                    // Override any potential module access
                    if (typeof module !== 'undefined' && module.exports) {
                      module.exports.detectStore = mockDetectStore;
                      if (!module.exports.default) module.exports.default = {};
                      module.exports.default.detectStore = mockDetectStore;
                    }

                    console.log('[LAYOUT] Comprehensive DetectStore fallback provided');
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