"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface CanvasProps {
  children?: React.ReactNode;
  className?: string;
  onCanvasClick?: () => void;
}

export const Canvas = React.forwardRef<HTMLDivElement, CanvasProps>(
  ({ children, className, onCanvasClick, ...props }, ref) => {
    return (
      <div 
        ref={ref}
        className={cn(
          "relative w-full h-full min-h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden canvas-container",
          className
        )}
        onClick={onCanvasClick}
        {...props}
      >
        <div className="absolute inset-0 bg-grid-pattern bg-[length:40px_40px] opacity-10 dark:opacity-20" />
        {children}
      </div>
    );
  }
);

Canvas.displayName = "Canvas";