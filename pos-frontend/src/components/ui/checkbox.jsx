import * as React from "react";
import { cn } from "@/lib/utils";

const Checkbox = React.forwardRef(({ className, checked, onCheckedChange, ...props }, ref) => {
    return (
        <div
            ref={ref}
            role="checkbox"
            aria-checked={checked}
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    if (onCheckedChange) onCheckedChange(!checked);
                }
            }}
            onClick={() => {
                if (onCheckedChange) onCheckedChange(!checked);
            }}
            className={cn(
                "peer h-4 w-4 shrink-0 rounded-sm border border-gray-300 bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:text-white cursor-pointer transition-colors",
                checked && "bg-blue-600 border-blue-600 text-white",
                className
            )}
            {...props}
        >
            {checked && (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 mx-auto my-auto"
                >
                    <polyline points="20 6 9 17 4 12" />
                </svg>
            )}
        </div>
    );
});
Checkbox.displayName = "Checkbox";

export { Checkbox };
