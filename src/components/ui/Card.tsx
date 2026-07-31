import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * The surface every panel in the app sits on.
 *
 * There were 128 hand-rolled card divs before this, and `Card` existed but was
 * imported almost nowhere — because the plain version only covered the simplest
 * case. The moment a panel needed a tint (`border-amber-200 bg-amber-50`) or a
 * different padding, people wrote a div instead, and then the next person
 * copied the div. So the variants below are not invented: each one is a shape
 * that already occurs several times in this codebase.
 *
 * `padding` is a variant rather than something you pass in `className` because
 * the raw divs used p-4, p-5, p-6 and p-8 interchangeably for the same kind of
 * panel. Naming them sm/md/lg/xl makes the inconsistency visible at the call
 * site.
 *
 * Deliberately light-mode only. Dark mode is wired up (`next-themes` +
 * ThemeToggle) but only the /roadmaps screens carry `dark:` classes today;
 * adding `dark:` here alone would make the app look half-converted rather than
 * fixing it. That is a separate, whole-app change.
 */
const cardVariants = cva("border", {
  variants: {
    variant: {
      /** The default panel: white, hairline border, faint lift. */
      default: "border-slate-200 bg-white shadow-sm",
      /** Same, without the shadow — for cards nested inside another card. */
      flat: "border-slate-200 bg-white",
      /** Recessed panel for secondary content inside a default card. */
      muted: "border-slate-100 bg-slate-50",
      /** Informational / brand-highlighted panel. */
      brand: "border-brand-200 bg-brand-50",
      success: "border-emerald-200 bg-emerald-50",
      warning: "border-amber-200 bg-amber-50",
      danger: "border-red-200 bg-red-50",
      info: "border-blue-200 bg-blue-50",
      /** Currently-chosen option in a list of selectable cards. */
      selected: "border-2 border-brand-500 bg-white shadow-sm",
      /** Placeholder / drop-target / empty region. */
      dashed: "border-dashed border-slate-300 bg-slate-50/60",
    },
    radius: {
      xl: "rounded-xl",
      "2xl": "rounded-2xl",
      "3xl": "rounded-3xl",
    },
    padding: {
      none: "",
      sm: "p-4",
      md: "p-5",
      lg: "p-6",
      xl: "p-8",
    },
    /** Hover lift for cards that are themselves links or buttons. */
    interactive: {
      true: "transition hover:-translate-y-0.5 hover:shadow-md",
      false: "",
    },
  },
  defaultVariants: {
    variant: "default",
    radius: "2xl",
    padding: "none",
    interactive: false,
  },
});

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, radius, padding, interactive, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        cardVariants({ variant, radius, padding, interactive }),
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-lg font-semibold leading-none tracking-tight text-slate-900", className)}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-slate-500", className)} {...props} />
  )
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  )
);
CardFooter.displayName = "CardFooter";

/**
 * Card + heading + optional blurb, in one element.
 *
 * The dominant repeated shape in this app is a padded card whose first two
 * children are a small bold heading and a grey one-liner. Expressing that with
 * Card/CardHeader/CardTitle/CardDescription/CardContent takes five components
 * and two padding overrides, which is why nobody did it. This is the short
 * version, and it keeps the heading level explicit so a page doesn't end up
 * with six `<h3>`s and no `<h2>`.
 */
export interface SectionCardProps extends Omit<CardProps, "title"> {
  /**
   * Note the `Omit` above. CardProps extends React.HTMLAttributes<HTMLDivElement>,
   * which already declares `title?: string` — the native HTML tooltip
   * attribute. Widening it to ReactNode here is not a legal extension
   * (`null` isn't assignable to `string | undefined`), so the base member has
   * to be dropped before redeclaring it. This is a rendered heading, not a
   * tooltip, so losing the native attribute is correct rather than a
   * workaround.
   */
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Slot on the same row as the title — a link, badge or small button. */
  action?: React.ReactNode;
  /** Defaults to h2; use h3 when the card sits under an existing h2. */
  as?: "h2" | "h3";
  titleClassName?: string;
}

const SectionCard = React.forwardRef<HTMLDivElement, SectionCardProps>(
  (
    {
      title,
      description,
      action,
      as: Heading = "h2",
      titleClassName,
      padding = "lg",
      className,
      children,
      ...props
    },
    ref
  ) => (
    <Card ref={ref} padding={padding} className={className} {...props}>
      {(title || action) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && (
              <Heading className={cn("text-sm font-bold text-slate-900", titleClassName)}>
                {title}
              </Heading>
            )}
            {description && <p className="mt-0.5 text-xs text-slate-400">{description}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </Card>
  )
);
SectionCard.displayName = "SectionCard";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  SectionCard,
  cardVariants,
};
