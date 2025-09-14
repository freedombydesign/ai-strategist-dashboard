'use client'

import Link from 'next/link'
import { ArrowLeftIcon, HomeIcon, CogIcon } from '@heroicons/react/24/outline'

interface NavigationHeaderProps {
  title: string
  subtitle?: string
  showBackButton?: boolean
  backUrl?: string
  backLabel?: string
}

export default function NavigationHeader({
  title,
  subtitle,
  showBackButton = true,
  backUrl = '/',
  backLabel = 'Home'
}: NavigationHeaderProps) {
  return (
    <div className="bg-white/10 backdrop-blur-sm border-b border-white/20 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <Link
                href={backUrl}
                className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                <span className="text-sm font-medium">{backLabel}</span>
              </Link>
            )}

            <div>
              <h1 className="text-2xl font-bold text-white">{title}</h1>
              {subtitle && (
                <p className="text-sm text-white/70 mt-1">{subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard"
              className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <HomeIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Dashboard</span>
            </Link>

            <Link
              href="/"
              className="flex items-center space-x-2 bg-purple-600/20 hover:bg-purple-600/30 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <CogIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Home</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}