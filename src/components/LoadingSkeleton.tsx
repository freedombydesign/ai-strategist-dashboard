'use client'

interface LoadingSkeletonProps {
  height?: string
  className?: string
}

export default function LoadingSkeleton({ height = 'h-32', className = '' }: LoadingSkeletonProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 animate-pulse ${className}`}>
      <div className={`bg-gray-200 rounded ${height}`}></div>
    </div>
  )
}

export function LoadingSkeletonInline({ height = 'h-4', className = '' }: LoadingSkeletonProps) {
  return (
    <div className={`bg-gray-200 rounded animate-pulse ${height} ${className}`}></div>
  )
}