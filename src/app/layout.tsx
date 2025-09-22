import type { Metadata } from "next";
import "./globals.css";
import ClientAuthProvider from '../components/ClientAuthProvider';

export const metadata: Metadata = {
  title: "Business Systemizer - Workflow Automation Platform",
  description: "Transform your business operations with AI-powered workflow systemization and automation tools",
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
              // COMPREHENSIVE GRAMMARLY/EXTENSION FIX - runs immediately
              (function() {
                'use strict';

                // Create safe detectStore function that returns a proper Promise
                const safeDetectStore = function() {
                  return Promise.resolve({ detected: false, store: null });
                };

                // Override ALL possible access patterns for detectStore
                function setupComprehensiveOverrides() {
                  try {
                    // Direct window access
                    window.detectStore = safeDetectStore;

                    // Module pattern overrides (a.default.detectStore)
                    if (!window.a) window.a = {};
                    if (!window.a.default) window.a.default = {};
                    window.a.default.detectStore = safeDetectStore;

                    // Alternative module patterns
                    ['b', 'c', 'd', 'e', 'f', 'g', 'h'].forEach(letter => {
                      if (!window[letter]) window[letter] = {};
                      if (!window[letter].default) window[letter].default = {};
                      window[letter].default.detectStore = safeDetectStore;
                    });

                    // Global namespace pollution prevention
                    Object.defineProperty(window, 'detectStore', {
                      value: safeDetectStore,
                      writable: true,
                      configurable: true
                    });

                    // Handle dynamic property access
                    const handler = {
                      get: function(target, prop) {
                        if (prop === 'detectStore') {
                          return safeDetectStore;
                        }
                        if (prop === 'default') {
                          return new Proxy({}, {
                            get: function(target, prop) {
                              if (prop === 'detectStore') {
                                return safeDetectStore;
                              }
                              return target[prop];
                            }
                          });
                        }
                        return target[prop];
                      }
                    };

                    // Apply proxy to common module variables
                    ['a', 'b', 'c', 'd', 'e'].forEach(letter => {
                      if (!window[letter]) {
                        window[letter] = new Proxy({}, handler);
                      }
                    });

                  } catch (e) {
                    console.log('[EXTENSION-FIX-ERROR]', e);
                  }
                }

                // Error suppression for Grammarly/extension errors
                window.addEventListener('error', function(event) {
                  const msg = (event.message || '').toLowerCase();
                  const filename = (event.filename || '').toLowerCase();

                  if (filename.includes('h1-check') ||
                      filename.includes('extension') ||
                      msg.includes('detectstore') ||
                      msg.includes("can't access property")) {
                    console.log('[EXTENSION-ERROR-SUPPRESSED]', event.message);
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    return false;
                  }
                }, true);

                // Promise rejection handler
                window.addEventListener('unhandledrejection', function(event) {
                  const reason = String(event.reason || '').toLowerCase();
                  if (reason.includes('detectstore') || reason.includes('h1-check')) {
                    console.log('[EXTENSION-REJECTION-SUPPRESSED]', event.reason);
                    event.preventDefault();
                    return false;
                  }
                }, true);

                // Run setup immediately and continuously
                setupComprehensiveOverrides();

                // Re-run setup after DOM loads and periodically
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', setupComprehensiveOverrides);
                }

                // Continuous override in case extension overwrites
                setInterval(setupComprehensiveOverrides, 50);

              })();
            `,
          }}
        />
      </head>
      <body>
        <ClientAuthProvider>
          {children}
        </ClientAuthProvider>
      </body>
    </html>
  );
}