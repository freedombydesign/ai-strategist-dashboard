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
              // ULTRA AGGRESSIVE detectStore fix
              (function() {
                try {
                  if (typeof window !== 'undefined') {
                    // Create a robust detectStore function
                    const mockDetectStore = function() {
                      console.log('[MOCK] DetectStore called, returning mock result');
                      return Promise.resolve({ success: true, detected: false });
                    };

                    // Override EVERYTHING
                    window.detectStore = mockDetectStore;

                    // Create the 'a' object structure that h1-check.js expects
                    if (!window.a) window.a = {};
                    if (!window.a.default) window.a.default = {};
                    window.a.default.detectStore = mockDetectStore;

                    // Also create alternative access patterns
                    window.a.detectStore = mockDetectStore;

                    // Override global object access
                    Object.defineProperty(window, 'a', {
                      value: {
                        default: {
                          detectStore: mockDetectStore
                        },
                        detectStore: mockDetectStore
                      },
                      writable: true,
                      configurable: true
                    });

                    // Patch any existing scripts that might be trying to access it
                    const originalDefineProperty = Object.defineProperty;
                    Object.defineProperty = function(obj, prop, descriptor) {
                      if (prop === 'detectStore' || (prop === 'default' && descriptor.value && !descriptor.value.detectStore)) {
                        if (descriptor.value) descriptor.value.detectStore = mockDetectStore;
                      }
                      return originalDefineProperty.call(this, obj, prop, descriptor);
                    };

                    console.log('[LAYOUT] ULTRA AGGRESSIVE DetectStore fallback provided');
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