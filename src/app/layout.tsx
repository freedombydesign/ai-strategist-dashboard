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
              // NUCLEAR detectStore fix v6.0 - Run before AND after all scripts
              (function() {
                const createMockDetectStore = () => {
                  const mockFn = function(...args) {
                    console.log('[MOCK] DetectStore intercepted:', args);
                    return Promise.resolve({ success: true, detected: false, result: 'mock' });
                  };
                  mockFn.then = (resolve) => resolve({ success: true, detected: false });
                  return mockFn;
                };

                const setupDetectStore = () => {
                  try {
                    const mockDetectStore = createMockDetectStore();

                    // Aggressive override strategy
                    window.detectStore = mockDetectStore;
                    if (!window.a) window.a = {};
                    if (!window.a.default) window.a.default = {};
                    window.a.default.detectStore = mockDetectStore;
                    window.a.detectStore = mockDetectStore;

                    console.log('[LAYOUT] DetectStore setup complete');
                  } catch (e) {
                    console.error('[LAYOUT] DetectStore setup failed:', e);
                  }
                };

                // Run immediately
                setupDetectStore();

                // Run after DOM loads
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', setupDetectStore);
                } else {
                  setupDetectStore();
                }

                // Run after ALL scripts load (including h1-check.js)
                window.addEventListener('load', () => {
                  setTimeout(setupDetectStore, 100);
                  setTimeout(setupDetectStore, 500);
                  setTimeout(setupDetectStore, 1000);
                });

                // Continuous monitoring and override
                const monitorInterval = setInterval(() => {
                  if (window.a?.default?.detectStore && typeof window.a.default.detectStore !== 'function') {
                    setupDetectStore();
                  }
                }, 1000);

                // Stop monitoring after 10 seconds
                setTimeout(() => clearInterval(monitorInterval), 10000);
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