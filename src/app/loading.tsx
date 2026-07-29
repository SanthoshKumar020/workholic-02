import { SkeletonCard, Skeleton } from "@/components/ui/AsyncState";

/**
 * App-wide route transition skeleton.
 *
 * Next.js shows this automatically while a server component page is being
 * rendered. Without it, clicking a link on a slow connection produced no
 * feedback at all — the page just sat there, which reads as a dead link.
 *
 * Any route can override this with its own `loading.tsx`.
 */
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="mt-3 h-4 w-80 max-w-full" />

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard lines={2} />
        <SkeletonCard lines={4} />
      </div>

      <span className="sr-only" role="status">
        Loading…
      </span>
    </div>
  );
}
