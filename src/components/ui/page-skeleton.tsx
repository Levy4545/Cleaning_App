/**
 * Neutral loading skeleton shown via route-level `loading.tsx` while a server
 * page awaits its data. Keeps the paint instant without needing i18n or auth.
 */
export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-ink">
      <div className="md:pl-64">
        <div className="sticky top-0 z-30 border-b border-line bg-ink/85 px-4 py-4 sm:px-8">
          <div className="h-6 w-40 animate-pulse rounded bg-elevated" />
        </div>
        <div className="space-y-6 px-4 pb-28 pt-6 sm:px-8 md:pb-12">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl border border-line bg-panel" />
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-xl border border-line bg-panel" />
        </div>
      </div>
    </div>
  );
}
