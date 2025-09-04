import { NextResponse } from 'next/server'

export async function GET() {
  const hostname = process.env.VERCEL_URL || 'localhost'
  
  return NextResponse.json({
    message: 'Freedom Suite deployment test successful!',
    timestamp: new Date().toISOString(),
    hostname,
    environment: process.env.NODE_ENV,
    pages_available: [
      '/freedom-suite',
      '/executive-intelligence'
    ],
    status: 'deployed'
  })
}