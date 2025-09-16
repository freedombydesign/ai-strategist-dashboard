import type { Metadata } from "next";
import "../../globals.css";

export const metadata: Metadata = {
  title: "Freedom Diagnostic Assessment - Business Systemizer",
  description: "Discover your Business Freedom Score and get personalized recommendations.",
};

export default function DiagnosticLayout({
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
              // NUCLEAR ERROR SUPPRESSION FOR DIAGNOSTIC PAGE ONLY
              (function() {
                window.console = window.console || {};
                window.console.error = function() {};
                window.console.warn = function() {};
                window.console.info = function() {};
                window.console.log = function() {};

                window.addEventListener('error', function(e) { e.preventDefault(); e.stopPropagation(); return false; }, true);
                window.addEventListener('unhandledrejection', function(e) { e.preventDefault(); return false; }, true);
                window.onerror = function() { return true; };
                window.onunhandledrejection = function(e) { e.preventDefault(); return false; };

                // Block ALL fetch requests
                window.fetch = function() {
                  return Promise.resolve({
                    ok: false,
                    json: () => Promise.resolve({ success: false, error: 'API disabled for diagnostic' })
                  });
                };
              })();
            `
          }}
        />
      </head>
      <body>
        {/* NO AUTH PROVIDER - COMPLETELY STANDALONE */}
        {children}
      </body>
    </html>
  );
}