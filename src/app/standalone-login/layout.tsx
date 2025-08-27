export default function StandaloneLoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <title>Login - AI Strategist Dashboard</title>
      </head>
      <body className="bg-gray-50">
        {children}
      </body>
    </html>
  )
}