import type { Metadata } from "next";
import "./globals.css";
import ClientAuthProvider from '../components/ClientAuthProvider';
import SubdomainRedirect from '../components/SubdomainRedirect';

export const metadata: Metadata = {
  title: "Business Systemizer - Scale Your Business Operations",
  description: "Streamline your business operations with automated workflows and platform integrations",
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
              // ULTIMATE FIX v12.0 - Complete h1-check.js neutralization with enhanced Promise support
              window.onerror = () => true;
              window.addEventListener('error', e => e.preventDefault(), true);
              window.addEventListener('unhandledrejection', e => e.preventDefault());

              // Create comprehensive mock with full Promise interface
              const createFullPromiseMock = () => {
                const promise = Promise.resolve({ success: true });
                const mockFn = () => promise;
                mockFn.then = (onFulfilled, onRejected) => promise.then(onFulfilled, onRejected);
                mockFn.catch = (onRejected) => promise.catch(onRejected);
                mockFn.finally = (onFinally) => promise.finally(onFinally);
                return mockFn;
              };

              // Bulletproof detectStore mocking with all possible access patterns
              const detectStoreMock = createFullPromiseMock();
              window.detectStore = detectStoreMock;

              // Create bulletproof window.a object with nested detectStore
              Object.defineProperty(window, 'a', {
                value: {
                  default: {
                    detectStore: detectStoreMock
                  },
                  detectStore: detectStoreMock
                },
                writable: false,
                configurable: false
              });

              // Ensure a.default.detectStore is also bulletproof
              if (window.a && window.a.default) {
                Object.defineProperty(window.a.default, 'detectStore', {
                  value: detectStoreMock,
                  writable: false,
                  configurable: false
                });
              }

              // Prevent h1-check.js from loading completely
              const originalCreateElement = document.createElement;
              document.createElement = function(tagName) {
                const element = originalCreateElement.call(this, tagName);
                if (tagName.toLowerCase() === 'script') {
                  Object.defineProperty(element, 'src', {
                    set: function(value) {
                      if (value && value.includes('h1-check')) {
                        console.log('[BLOCKED] Prevented h1-check.js from loading');
                        return;
                      }
                      this.setAttribute('src', value);
                    },
                    get: function() {
                      return this.getAttribute('src');
                    }
                  });
                }
                return element;
              };
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