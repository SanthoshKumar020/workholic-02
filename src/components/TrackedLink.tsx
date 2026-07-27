"use client";

import Link from "next/link";
import { track, type AnalyticsEvent } from "@/lib/analytics";

/**
 * A `next/link` that fires an analytics event on click.
 * Lets server components (like the landing page) instrument their CTAs
 * without becoming client components themselves.
 */
export function TrackedLink({
  href,
  event,
  source,
  className,
  children,
}: {
  href: string;
  event: AnalyticsEvent;
  source: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={className} onClick={() => track(event, { source })}>
      {children}
    </Link>
  );
}
