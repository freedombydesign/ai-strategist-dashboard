import type { Metadata } from "next";
import "./globals.css";
import ClientAuthProvider from '../components/ClientAuthProvider';

export const metadata: Metadata = {
  title: "Business Systemizer - Workflow Optimization Platform",
  description: "Transform your service delivery workflows into streamlined, repeatable systems. Export to Trello, Asana, ClickUp, Monday.com, and Notion.",
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
              // Global error handler to prevent client-side errors from breaking the app
              window.addEventListener('error', function(e) {
                console.warn('Global error caught:', e.message);
                // Prevent certain extension errors from propagating
                if (e.message.includes('detectStore') ||
                    e.message.includes('chrome-extension') ||
                    e.message.includes('safari-extension')) {
                  e.preventDefault();
                  return false;
                }
              });

              window.addEventListener('unhandledrejection', function(e) {
                console.warn('Unhandled promise rejection caught:', e.reason);
                // Prevent extension promise rejections from breaking the app
                if (e.reason && typeof e.reason === 'string' &&
                    (e.reason.includes('detectStore') ||
                     e.reason.includes('extension'))) {
                  e.preventDefault();
                }
              });
            `
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