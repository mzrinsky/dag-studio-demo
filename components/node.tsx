"use client";

import React, { useRef } from 'react';
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Draggable from "react-draggable";
import { Ports, PortProps } from "@/components/port";

// Global node manager for z-index management
const nodeManager = {
  nodes: new Map<string, { zIndex: number }>(),
  highestZIndex: 1,
  
  // Get the current z-index for a node
  getNodeZIndex: (id: string) => {
    const node = nodeManager.nodes.get(id);
    return node ? node.zIndex : 1;
  },
  
  // Bring a node to the front
  bringToFront: (id: string) => {
    // First, update the highest z-index
    nodeManager.highestZIndex += 1;
    
    // Update this node's z-index
    nodeManager.nodes.set(id, { zIndex: nodeManager.highestZIndex });
    
    // Update all other nodes to shift down
    nodeManager.nodes.forEach((node, nodeId) => {
      if (nodeId !== id && node.zIndex > nodeManager.highestZIndex - 1) {
        node.zIndex = node.zIndex - 1;
      }
    });
    
    return nodeManager.highestZIndex;
  },
  
  // Remove a node from tracking
  removeNode: (id: string) => {
    nodeManager.nodes.delete(id);
  },
  
  // Initialize a node
  initNode: (id: string) => {
    if (!nodeManager.nodes.has(id)) {
      nodeManager.highestZIndex += 1;
      nodeManager.nodes.set(id, { zIndex: nodeManager.highestZIndex });
      return nodeManager.highestZIndex;
    }
    return nodeManager.getNodeZIndex(id);
  }
};

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
    const [zIndex, setZIndex] = React.useState(1);
    const nodeElementRef = React.useRef<HTMLDivElement>(null);
    const isDragging = React.useRef(false);

    // Initialize the node when component mounts
    React.useEffect(() => {
      const initialZIndex = nodeManager.initNode(id);
      setZIndex(initialZIndex);
      return () => {
        nodeManager.removeNode(id);
      };
    }, [id]);

    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onNodeClick?.(id);
      
      // Bring to front on click
      const newZIndex = nodeManager.bringToFront(id);
      setZIndex(newZIndex);
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
      // Bring node to front when dragging starts
      const newZIndex = nodeManager.bringToFront(id);
      setZIndex(newZIndex);
    };

    const handleStop = () => {
      isDragging.current = false;
      // No need to reset z-index - it's already managed by the node manager
    };

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
            zIndex
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