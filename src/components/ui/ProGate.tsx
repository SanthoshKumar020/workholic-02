import * as React from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

/**
 * Shown in place of a Pro-only tool for a free user.
 *
 * Eight pages had their own version of this panel: three byte-identical copies,
 * and five more that differed only in icon tint, heading size and button
 * padding. Because they were separate copies they also disagreed on the thing
 * that matters — some explained what you'd get for the money, some just said
 * "Available on Pro" — so the same upgrade decision was presented well on one
 * screen and badly on the next. `blurb` is required for that reason.
 *
 * `ProHistoryGate` is the sibling of this for saved-history lists; that one is
 * dashed and inline, this one replaces the whole tool.
 */
export function ProGate({
  title = "Pro Feature",
  blurb,
  cta = "Upgrade to Pro",
  href = "/billing",
  icon,
  iconTone = "slate",
  /** Use h1 when this panel *is* the page; h2 when it sits under a page title. */
  headingLevel: Heading = "h2",
  children,
  className,
}: {
  title?: React.ReactNode;
  /** What they actually get. One or two sentences, concrete. */
  blurb: React.ReactNode;
  cta?: string;
  href?: string;
  icon?: React.ReactNode;
  iconTone?: "slate" | "amber" | "brand";
  headingLevel?: "h1" | "h2";
  /** Extra actions rendered under the CTA — e.g. a "back to map" link. */
  children?: React.ReactNode;
  className?: string;
}) {
  const tones = {
    slate: "bg-slate-100 text-slate-400",
    amber: "bg-amber-100 text-amber-600",
    brand: "bg-brand-100 text-brand-600",
  } as const;

  return (
    <Card
      className={cn(
        "flex flex-col items-center gap-5 px-6 py-16 text-center",
        className
      )}
    >
      <div
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-2xl",
          tones[iconTone]
        )}
      >
        {icon ?? <Lock className="h-7 w-7" />}
      </div>
      <Heading className="text-xl font-bold text-slate-900">{title}</Heading>
      <p className="max-w-sm text-slate-500">{blurb}</p>
      <Button asChild className="px-6">
        <Link href={href}>{cta}</Link>
      </Button>
      {children}
    </Card>
  );
}
