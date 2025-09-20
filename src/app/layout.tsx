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
              // BULLETPROOF detectStore fix v5.0
              (function() {
                try {
                  if (typeof window !== 'undefined') {
                    // Create bulletproof detectStore function that ALWAYS returns a promise
                    const mockDetectStore = function(...args) {
                      console.log('[MOCK] DetectStore called with args:', args);
                      return Promise.resolve({ success: true, detected: false, result: 'mock' });
                    };

                    // Ensure it has a .then method (make it thenable)
                    mockDetectStore.then = function(resolve, reject) {
                      return Promise.resolve({ success: true, detected: false }).then(resolve, reject);
                    };

                    // Nuclear option: override EVERYTHING before ANY script loads
                    window.detectStore = mockDetectStore;

                    // Create 'a' namespace with multiple fallbacks
                    if (!window.a) window.a = {};
                    window.a.default = window.a.default || {};
                    window.a.default.detectStore = mockDetectStore;
                    window.a.detectStore = mockDetectStore;

                    // Defensive property definitions that can't be overwritten
                    Object.defineProperty(window, 'detectStore', {
                      value: mockDetectStore,
                      writable: false,
                      configurable: false
                    });

                    Object.defineProperty(window.a, 'detectStore', {
                      value: mockDetectStore,
                      writable: false,
                      configurable: false
                    });

                    Object.defineProperty(window.a.default, 'detectStore', {
                      value: mockDetectStore,
                      writable: false,
                      configurable: false
                    });

                    // Intercept any future attempts to access detectStore
                    const handler = {
                      get: function(target, prop) {
                        if (prop === 'detectStore') {
                          return mockDetectStore;
                        }
                        return target[prop];
                      }
                    };

                    window.a = new Proxy(window.a, handler);
                    window.a.default = new Proxy(window.a.default, handler);

                    console.log('[LAYOUT] BULLETPROOF DetectStore v5.0 active');
                  }
                } catch (e) {
                  console.error('[LAYOUT] DetectStore setup failed:', e);
                  // Last resort fallback
                  if (typeof window !== 'undefined') {
                    window.detectStore = () => Promise.resolve({ success: true, detected: false });
                  }
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