import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    asChild?: boolean;
    variant?: "default" | "secondary" | "outline" | "ghost";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "default", asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button";

        // Map variants to our premium CSS classes
        let variantClasses = "btn-primary"; // Default
        if (variant === "secondary") variantClasses = "btn-secondary";
        if (variant === "outline") variantClasses = "btn-secondary border-white/20"; // Similar to secondary but maybe clearer naming intention
        if (variant === "ghost") variantClasses = "btn-ghost";

        return (
            <Comp
                className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded-2xl text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                    variantClasses,
                    className
                )}
                ref={ref}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";

export { Button };
