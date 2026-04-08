import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'; // Assuming shadcn/ui tooltip components are available

/**
 * Handle Component: Represents a connection point (Input or Output).
 * Displays only a dot, using the label as a tooltip on hover.
 */
const Handle: React.FC<{ isInput: boolean; label: string }> = ({ isInput, label }) => {
  const baseClasses = "p-1 cursor-pointer transition-colors border-none rounded-md flex items-center justify-center";
  const inputClasses = "bg-blue-50 hover:bg-blue-100 border-blue-200";
  const outputClasses = "bg-green-50 hover:bg-green-100 border-green-200";

  return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`${baseClasses} ${isInput ? inputClasses : outputClasses}`} 
               data-handle-type={isInput ? 'input' : 'output'}>
            {/* The dot visualization only */}
            <div className={`w-2 h-2 rounded-full ${isInput ? 'bg-blue-600' : 'bg-green-600'}`}></div>
          </div>
        </TooltipTrigger>
        <TooltipContent className="text-sm shadow-lg">
          {/* Display the label content inside the tooltip */}
          {label}
        </TooltipContent>
      </Tooltip>
  );
};

export default Handle;
