import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * The `<main>` wrapper for every page.
 *
 * Page shells had drifted to ten different widths (max-w-sm through max-w-7xl)
 * and four vertical paddings, so moving between two tools felt like moving
 * between two products. The fix is not "pick one width" — a login form and a
 * dashboard grid genuinely need different measures — it's to pick a *small
 * closed set* so the drift can't come back:
 *
 * - `form`    max-w-md   auth, join-by-code, short single-purpose forms,
 *                        and the "you need to sign in / upgrade" interstitials
 * - `narrow`  max-w-3xl  prose and single-column tools (one input, one result)
 * - `default` max-w-4xl  the standard tool page — already the most common
 * - `wide`    max-w-6xl  dashboards and multi-column card grids
 *
 * Vertical padding is deliberately not a prop. It was py-8/10/12/14/16 across
 * the app with no pattern behind the choice, and one value is the whole point.
 *
 * `flex-1` is included because the body is `min-h-screen flex flex-col`: without
 * it, short pages leave the footer floating in the middle of the viewport.
 */
const pageShellVariants = cva("mx-auto w-full flex-1 px-4 py-12", {
  variants: {
    width: {
      form: "max-w-md",
      narrow: "max-w-3xl",
      default: "max-w-4xl",
      wide: "max-w-6xl",
    },
  },
  defaultVariants: { width: "default" },
});

export type PageShellWidth = NonNullable<
  VariantProps<typeof pageShellVariants>["width"]
>;

/**
 * The page title block: eyebrow / title / description on the left, an optional
 * actions slot on the right.
 *
 * Exported on its own because a few pages render their header inside a client
 * component (so it can react to state) while the `<main>` stays in the server
 * component. Those should still get the same type scale.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  align = "left",
  className,
}: {
  /** Small uppercase kicker above the title. */
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Buttons / selects that belong to the page as a whole. */
  actions?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  const centered = align === "center";
  return (
    <div
      className={cn(
        "mb-8 gap-4",
        centered
          ? "flex flex-col items-center text-center"
          : "flex flex-col sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className={cn("min-w-0", centered && "flex flex-col items-center")}>
        {eyebrow && (
          <p className="text-xs font-bold uppercase tracking-widest text-brand-500">
            {eyebrow}
          </p>
        )}
        <h1
          className={cn(
            "text-3xl font-bold text-slate-900",
            eyebrow && "mt-1.5"
          )}
        >
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-slate-500">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
    </div>
  );
}

export interface PageShellProps
  // `title` is omitted from the base because React.HTMLAttributes declares it
  // as `string` (the native HTML tooltip attribute). Redeclaring it as
  // ReactNode without dropping it first is not a legal extension and fails
  // the build. Here it's a rendered page heading, not a tooltip.
  extends Omit<React.HTMLAttributes<HTMLElement>, "title">,
    VariantProps<typeof pageShellVariants> {
  eyebrow?: React.ReactNode;
  /** Omit to render a shell with no header at all. */
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  align?: "left" | "center";
  headerClassName?: string;
}

const PageShell = React.forwardRef<HTMLElement, PageShellProps>(
  (
    {
      className,
      width,
      eyebrow,
      title,
      description,
      actions,
      align,
      headerClassName,
      children,
      ...props
    },
    ref
  ) => (
    <main
      ref={ref}
      className={cn(pageShellVariants({ width }), className)}
      {...props}
    >
      {title && (
        <PageHeader
          eyebrow={eyebrow}
          title={title}
          description={description}
          actions={actions}
          align={align}
          className={headerClassName}
        />
      )}
      {children}
    </main>
  )
);
PageShell.displayName = "PageShell";

export { PageShell, pageShellVariants };
