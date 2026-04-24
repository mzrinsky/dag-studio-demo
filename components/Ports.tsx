'use client';
import React, { useState, useEffect } from 'react';
import Handle from './Handle';
import { useGraphStore } from '@/store/useGraphStore'; // Adjust path as needed

interface PortDefinition {
  id?: string; // Optional: if not provided, we generate one
  label?: string;
  onChange?: (val: any, ctx: any) => void;
  onProcess?: () => Promise<any>;
  onCommit?: (val: any, ctx: any) => void;
}

interface PortsProps {
  inputs?: PortDefinition[];
  outputs?: PortDefinition[];
  children: React.ReactNode;
}

const Ports: React.FC<PortsProps> = ({ inputs, outputs, children }) => {
  const [hasMounted, setHasMounted] = useState(false);
  
  // Store actions for registration
  const registerPortHandlers = useGraphStore((state) => state.registerPortHandlers);
  const unregisterPortHandlers = useGraphStore((state) => state.unregisterPortHandlers);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted) return;

    // Registration Logic: Ensure all defined ports exist in the Global Registry
    const allPorts = [...(inputs || []), ...(outputs || [])];
    
    allPorts.forEach((port) => {
      const portId = port.id || `port-${crypto.randomUUID()}`;
      const handlers = {
        onChange: port.onChange,
        onProcess: port.onProcess,
        onCommit: port.onCommit,
      };
      registerPortHandlers(portId, handlers);
    });

    return () => {
      allPorts.forEach((port) => {
        if (port.id) unregisterPortHandlers(port.id);
      });
    };
  }, [inputs, outputs, hasMounted, registerPortHandlers, unregisterPortHandlers]);

  if (!hasMounted) return <>{children}</>;

  return (
    <div className="flex justify-between items-start">
      {!!inputs && inputs.length > 0 && (
        <div className="flex flex-col space-y-2 pl-2 pt-2 border-r border-gray-100 mr-2">
          {inputs.map((input) => (
            <Handle 
              key={input.id || 'gen-in'} // Fallback for render, though registration handles the real ID
              isInput={true} 
              label={input.label || `Input`} 
            />
          ))}
        </div>
      )}

      <div className="flex-grow py-1">{children}</div>
      
      {!!outputs && outputs.length > 0 && (
        <div className="flex flex-col space-y-2 pr-2 pt-2 border-l border-gray-100 ml-2">
          {outputs.map((output) => (
            <Handle 
              key={output.id || 'gen-out'} 
              isInput={false} 
              label={output.label || `Output`} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Ports;