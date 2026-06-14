import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-brand-gradient text-white shadow-md hover:opacity-90 hover:shadow-glow-sm active:scale-[0.98]",
        secondary:
          "bg-slate-100 text-slate-800 hover:bg-slate-200 active:scale-[0.98]",
        outline:
          "border border-slate-300 bg-white text-slate-800 shadow-sm hover:bg-slate-50 active:scale-[0.98]",
        ghost: "text-slate-700 hover:bg-slate-100 active:scale-[0.98]",
        danger:
          "bg-red-600 text-white shadow-sm hover:bg-red-700 active:scale-[0.98]",
        pro: "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md hover:opacity-90 active:scale-[0.98]",
        // Legacy aliases
        primary:
          "bg-brand-gradient text-white shadow-md hover:opacity-90 hover:shadow-glow-sm active:scale-[0.98]",
      },
      size: {
        sm: "h-8 rounded-lg px-3 text-xs",
        md: "h-10 px-4 py-2",
        default: "h-10 px-4 py-2",
        lg: "h-12 rounded-xl px-6 text-base",
        xl: "h-14 rounded-xl px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, loading, children, disabled, ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
