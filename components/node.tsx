"use client";

import React, { useRef } from 'react';
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Draggable from "react-draggable";
import { Ports, PortProps } from "@/components/port";

export interface NodeProps {
  id: string;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  isSelected?: boolean;
  onNodeClick?: (id: string) => void;
  onNodeDoubleClick?: (id: string) => void;
  inputs?: PortProps[];
  outputs?: PortProps[];
  position?: { x: number; y: number };
  onNodeMove?: (id: string, position: { x: number; y: number }) => void;
}

export const Node = React.forwardRef<HTMLDivElement, NodeProps>(
  ({ 
    id,
    title,
    description,
    children,
    className,
    isSelected = false,
    onNodeClick,
    onNodeDoubleClick,
    inputs = [],
    outputs = [],
    position = { x: 0, y: 0 },
    onNodeMove,
    ...props 
  }, ref) => {
    const [nodePosition, setNodePosition] = React.useState(position);
    const nodeElementRef = React.useRef<HTMLDivElement>(null);
    const isDragging = React.useRef(false);

    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onNodeClick?.(id);
    };

    const handleDoubleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onNodeDoubleClick?.(id);
    };

    const handleDrag = (e: any, data: any) => {
      const newPosition = { x: data.x, y: data.y };
      setNodePosition(newPosition);
      onNodeMove?.(id, newPosition);
    };

    const handleStart = () => {
      isDragging.current = true;
    };

    const handleStop = () => {
      isDragging.current = false;
    };

    // // Update position when external position changes
    // this is conflicting
    // React.useEffect(() => {
    //   // Only update if position has actually changed
    //   if (!isDragging.current) {
    //     if (nodePosition.x !== position.x || nodePosition.y !== position.y) {
    //       //setNodePosition(position);
    //       console.debug('Node position changed: ', { nodePosition, position });
    //     }
    //   }
    // }, [position, nodePosition]);

    return (
      <Draggable
        position={nodePosition}
        onDrag={handleDrag}
        onStart={handleStart}
        onStop={handleStop}
        nodeRef={nodeElementRef}
        cancel=".no-drag"
        bounds="parent"
      >
        <div 
          ref={nodeElementRef}
          className={cn(
            "relative group",
            className
          )}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          style={{
            position: 'absolute',
            zIndex: 1
          }}
          {...props}
        >
          <div className={cn(
            "p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md border",
            isSelected 
              ? "border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800" 
              : "border-gray-200 dark:border-gray-700",
            "hover:shadow-lg transition-shadow"
          )}>
            {/* Node header */}
            {(title || description) && (
              <div className="mb-3">
                {title && (
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {title}
                  </h3>
                )}
                {description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {description}
                  </p>
                )}
              </div>
            )}
            {children}
          </div>
        </div>
      </Draggable>
    );
  }
);

Node.displayName = "Node";

// Export Ports for direct usage
export { Ports };