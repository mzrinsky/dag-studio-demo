'use client';
import React, { useState, useEffect } from 'react';
import Handle from './Handle';

// Define structure for clarity (though we use placeholders for complex types)
interface PortDefinition {
  label?: string;
  // REMOVED onProcess: Function references cannot be serialized across SSR boundaries.
}

interface PortsProps {
  inputs: PortDefinition[];
  outputs: PortDefinition[];
  children: React.ReactNode;
}

/**
 * Ports Component: Acts as the Binding Engine wrapper.
 * It receives inputs/outputs metadata and structures the UI around the children.
 */
const Ports: React.FC<PortsProps> = ({ inputs, outputs, children }) => {
  // State to track if the component has mounted on the client side
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    // Set mounted state only on the client side
    setHasMounted(true);
  }, []);

  // If not mounted, render null or a minimal structure to prevent hydration errors
  if (!hasMounted) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Handles/Controls wrapper for Inputs (Left Side) */}
      
      <div className="flex justify-between items-start">
        {inputs?.length > 0 && (
        <div className="flex flex-col space-y-2 pl-2 pt-2 border-r border-gray-100 mr-2">
            {inputs.map((input, index) => (
            <Handle 
              key={`in-${index}`} 
              isInput={true} 
              label={input.label || `Input ${index + 1}`} 
            />
          ))}
          </div >
        )}

        {/* The main content wrapper (Child component that renders) */}
        <div className="flex-grow py-1">
          {/* This is where the actual rendered UI component using props goes */}
          {children}
          </div>
        
        {outputs?.length > 0 && (
        <div className="flex flex-col space-y-2 pr-2 pt-2 border-l border-gray-100 ml-2">
            {outputs.map((output, index) => (
            <Handle 
              key={`out-${index}`} 
              isInput={false} 
              label={output.label || `Output ${index + 1}`} 
            />
          ))}
        </div>
        )}
      </div>
      
    </>
  );
};

export default Ports;