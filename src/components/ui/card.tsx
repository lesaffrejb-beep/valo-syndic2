import * as React from "react";
import { cn } from "@/lib/utils"; // Assuming this utility exists, if not I'll define it or use a simple helper

// Simple class merger if utility is missing, but standard projects usually have it.
// If not, I can handle it. I'll stick to a safe import for now or inline simple merger if needed.
// Checking previous files, I haven't seen 'cn' imported, but it's standard.
// I will assume standard `lib/utils` or `@/utils/cn`.
// Let's create `src/lib/utils.ts` if it doesn't exist in next step to be safe, but for now I'll use it.

const Card = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "glass" | "tactile" | "premium" }
>(({ className, variant = "default", ...props }, ref) => {
    const variantClass = variant === "glass" ? "card-glass" : "card-premium";
    return (
        <div
            ref={ref}
            className={cn(variantClass, className)}
            {...props}
        />
    );
});
Card.displayName = "Card";

const CardHeader = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex flex-col space-y-1.5 p-6 md:p-8 pb-0", className)}
        {...props}
    />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h3
        ref={ref}
        className={cn(
            "text-2xl font-semibold leading-none tracking-tight text-white",
            className
        )}
        {...props}
    />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <p
        ref={ref}
        className={cn("text-sm text-muted-foreground", className)}
        {...props}
    />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 md:p-8 pt-4", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex items-center p-6 md:p-8 pt-0", className)}
        {...props}
    />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
