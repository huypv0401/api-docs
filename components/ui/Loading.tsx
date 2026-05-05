export function Spinner({ size = 'md', label = 'Loading...' }: { size?: 'sm' | 'md' | 'lg'; label?: string }) {
  const sizeClass = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' }[size]
  return (
    <span role="status" aria-label={label} className="inline-flex items-center gap-2">
      <svg className={`animate-spin text-gray-500 dark:text-zinc-400 ${sizeClass}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  )
}

export function SkeletonLine({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-200 dark:bg-zinc-700 ${className}`} aria-hidden="true" />
}
