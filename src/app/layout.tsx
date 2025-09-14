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
      <body>
        <ClientAuthProvider>
          {children}
        </ClientAuthProvider>
      </body>
    </html>
  );
}