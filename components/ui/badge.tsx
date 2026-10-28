import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "outline" | "secondary";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variant === "default" && "bg-[#FF6600] text-white",
        variant === "outline" && "border border-[#FF6600] text-[#FF6600]",
        variant === "secondary" && "bg-gray-100 text-gray-800",
        className
      )}
      {...props}
    />
  );
}
