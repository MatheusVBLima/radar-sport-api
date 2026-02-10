export function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 rounded bg-muted" />
              <div className="h-3 w-32 rounded bg-muted" />
            </div>
            <div className="space-y-2 text-right">
              <div className="ml-auto h-6 w-16 rounded bg-muted" />
              <div className="ml-auto h-3 w-24 rounded bg-muted" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
