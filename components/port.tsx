"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Define types for ports
export type PortType = "input" | "output";
export type PortDataType = "string" | "number" | "boolean" | "object" | "array";

export interface PortProps {
  id: string;
  type: PortType;
  dataType?: PortDataType;
  label?: string;
  className?: string;
  isConnecting?: boolean;
  isConnected?: boolean;
  onConnect?: (portId: string, connectedPortId: string) => void;
  onDisconnect?: (portId: string, disconnectedPortId: string) => void;
}

// The Port component that wraps any existing shadcn/ui component to allow complex components to expose multiple input / output ports
export const Port = React.forwardRef<HTMLDivElement, PortProps>(
  ({ 
    id, 
    type, 
    dataType = "object", 
    label = "", 
    className, 
    isConnecting = false,
    isConnected = false,
    onConnect,
    onDisconnect,
    ...props 
  }, ref) => {
    const portColor = type === "input" ? "bg-blue-500" : "bg-green-500";
    const portSize = "w-3 h-3";
    
    return (
      <div 
        ref={ref}
        className={cn(
          "relative flex items-center gap-2 group",
          className
        )}
        {...props}
      >
        {type === "input" ? (
          <>
            {/* Port indicator with tooltip */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div 
                    className={cn(
                      portSize,
                      portColor,
                      "rounded-full border border-white shadow-md",
                      "group-hover:ring-2 group-hover:ring-blue-300",
                      isConnecting && "ring-2 ring-blue-400",
                      isConnected && "ring-2 ring-green-400"
                    )}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{label}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </>
        ) : (
          <>
            {/* Port indicator with tooltip */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div 
                    className={cn(
                      portSize,
                      portColor,
                      "rounded-full border border-white shadow-md",
                      "group-hover:ring-2 group-hover:ring-blue-300",
                      isConnecting && "ring-2 ring-blue-400",
                      isConnected && "ring-2 ring-green-400"
                    )}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{label}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </>
        )}
      </div>
    );
  }
);

Port.displayName = "Port";

// New Ports component that wraps content with input/output ports
export const Ports = React.forwardRef<HTMLDivElement, {
  inputs?: PortProps[];
  outputs?: PortProps[];
  children?: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>>(
  ({ inputs = [], outputs = [], children, className, ...props }, ref) => {
    return (
      <div 
        ref={ref}
        className={cn("flex w-full items-start gap-4", className)}
        {...props}
      >
        {/* Input ports */}
        {inputs && inputs.length > 0 && (
          <div className="flex flex-col gap-2">
            {inputs.map((input, index) => (
              <Port key={`input-${input.id || index}`} {...input} />
            ))}
          </div>
        )}
        
        {/* Main content */}
        <div className="flex-1">
          {children}
        </div>
        
        {/* Output ports */}
        {
          outputs && outputs.length > 0 && (
            <div className="flex flex-col gap-2">
              {outputs.map((output, index) => (
                <Port key={`output-${output.id || index}`} {...output} />
              ))}
            </div>
          )
        }
      </div>
    );
  }
);

Ports.displayName = "Ports";