'use client';
import React, { ReactNode, ReactElement, useRef, useEffect, useState } from 'react';
import Ports from './Ports';
import { Card } from '@/components/ui/card'; // Assuming ui components are available
import * as d3 from 'd3'; // Import d3

interface NodeProps {
  title?: string;
  showTitle?: boolean;
  children: ReactNode;
  /** Optional wrapper element to use instead of the default Card wrapper. */
  wrapperElement?: React.ElementType<{ title?: string, showTitle?: boolean, ref?: React.Ref<HTMLDivElement>, style?: React.CSSProperties }>;
  /** Callback fired when the node is dropped, passing new {x, y} coordinates. */
  onDragEnd?: (x: number, y: number) => void;
  /** Initial position for the node (optional). */
  initialX?: number;
  initialY?: number;
}

/**
 * Node Component: The structural shell container.
 * It houses the Ports, providing visual encapsulation.
 */
const Node: React.FC<NodeProps> = ({ title, showTitle, children, wrapperElement, onDragEnd, initialX = 0, initialY = 0 }) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  // State to track the current position for live preview
  const [position, setPosition] = useState({ x: initialX, y: initialY });

  // State to hold the initial offset when dragging starts
  const dragOffset = useRef({ x: 0, y: 0 });
  // State to hold the initial position when dragging starts
  const initialPosition = useRef({ x: initialX, y: initialY });

  // Effect to handle D3 drag initialization
  useEffect(() => {
    const element = nodeRef.current;
    if (!element) return;

    const drag = d3.drag()
      .on("start", (event) => {
        // Get current element position
        const rect = element.getBoundingClientRect();
        
        // The offset is the distance from the mouse click to the top-left of the node
        // event.x/y are usually already relative to the container in d3-drag
        // but to be safe and consistent with absolute positioning:
        dragOffset.current = {
             x: event.x - position.x,
             y: event.y - position.y
         };
        
        element.style.cursor = 'grabbing';
      })
      .on("drag", (event) => {
        // New position is simply the current event coordinates minus our initial offset
        const newX = event.x - dragOffset.current.x;
        const newY = event.y - dragOffset.current.y;
        
        setPosition({ x: newX, y: newY });
      })
      .on("end", (event) => {
        // We use the current state values rather than event.x/y 
        // because event.x/y are the cursor's position, not the node's position
        if (onDragEnd) {
            onDragEnd(position.x, position.y);
        }

        element.style.cursor = 'grab';
      });

    d3.select(element).call(drag);

    return () => {
      d3.select(element).on(".drag", null);
    };
  }, [onDragEnd, position]); // Added position to dependencies to ensure correct offset calculation

  // Determine the base class for styling
  const baseClasses = "w-64 gap-0 shadow-xl border-2 border-indigo-300 bg-white/95 p-4 absolute transition-none";

  // Use transform for better performance and to avoid layout thrashing
  const style: React.CSSProperties = {
    transform: `translate(${position.x}px, ${position.y}px)`,
    left: 0,
    top: 0,
    cursor: 'grab',
    position: 'absolute', 
  };

 // If a custom wrapper is provided, use it as a Component
  if (wrapperElement) {
    const Wrapper = wrapperElement;
    return (
      <Wrapper 
        title={title} 
        showTitle={showTitle} 
        ref={nodeRef} 
        style={style}
      >
        {children}
      </Wrapper>
    );
  }

  // Default behavior using Card
  return (
    <div
      ref={nodeRef}
      className={baseClasses}
      style={style}
    >
      {/* Conditionally render the title */}
      {title && showTitle !== false && (
        <h3 className="text-lg font-semibold text-indigo-700">{title}</h3>
      )}
      {/* The Ports component is now responsible for receiving the metadata (inputs/outputs) 
          and wrapping the children, making Node purely structural. */}
      {children}
    </div>
  );
};

export default Node;



