import DAGFlow from '@/components/DAGFlow';
import Node from '@/components/Node';
import Ports from '@/components/Ports'; // Import Ports component
import { Card } from '@/components/ui/card';

// Mocking the functionality expected by the components for demonstration purposes
// In a real app, state and context would manage these values.
const mockInputState = { value: "Initial Data A", label: "Source A" };
const mockOutputState = { value: "Processed Value X", label: "Output X" };

// --------------------------------------------------------------
// Node 1: Data Source Node (Only Output)
// -------------------------------------------------------
const SourceNode = () => (
  <Node title="Data Source (Input)">
    <Ports
        outputs={[
            // REMOVED nodeRef: Should be managed internally by Node/Ports
            { label: "DataStream" }
        ]}>
      {/* The content component that reads from the Ports context */}
        <label className="block text-sm font-medium text-gray-700">Source Value:</label>
        <input
            type="text"
            defaultValue={mockInputState.value}
            className="w-full p-2 border border-gray-300"
            disabled
        />
    </Ports>
  </Node>
);

// ---------------------------------------------------
// Node 2: Transformation Node (Input -> Output)
// ----------------------------------------------------------------------
const TransformNode = () => (
    <Node title="Transformer Node">
        <Ports
            inputs={[
                // REMOVED nodeRef: Should be managed internally by Node/Ports
                { label: "DataStream" }
            ]}
            outputs={[
                // REMOVED nodeRef: Should be managed internally by Node/Ports
                { label: "TransformedData" }
            ]}>
                {/* The content component that reads from the Ports context */}
                <label className="text-sm font-medium text-gray-700">Input Received:</label>
                {/* Assuming the input field now reads from the Port context/props */}
                <input
                    type="text"
                    defaultValue={mockInputState.value}
                    className="w-full p-2 border border-gray-300 bg-yellow-50"
                />
                <label className="text-sm font-medium text-gray-700 pt-2">Final Output:</label>
                <input
                    type="text"
                    defaultValue={mockOutputState.value}
                    className="w-full p-2 border border-gray-300 rounded-md"
                />
        </Ports>
  </Node>
);

export default function Home() {
  return (
    <DAGFlow>
        <SourceNode />
        <TransformNode />
    </DAGFlow>
  );
}



