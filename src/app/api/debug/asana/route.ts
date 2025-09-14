import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const clientId = process.env.ASANA_CLIENT_ID
  const nextAuthUrl = process.env.NEXTAUTH_URL

  const debugInfo = {
    clientId: clientId ? `${clientId.slice(0, 6)}...${clientId.slice(-4)}` : 'MISSING',
    nextAuthUrl: nextAuthUrl,
    hardcodedRedirectUri: 'https://business-systemizer.scalewithruth.com/api/auth/asana/callback',
    expectedRedirectUris: [
      'https://business-systemizer.scalewithruth.com/api/oauth/asana',
      'https://business-systemizer.scalewithruth.com/api/auth/asana/callback'
    ],
    message: 'Go to your Asana Developer Console and verify these EXACT redirect URIs are configured for your OAuth app'
  }

  return NextResponse.json(debugInfo)
}