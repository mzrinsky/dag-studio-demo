import DAGFlow from '@/components/DAGFlow';
import Module from '@/components/Module';
import Ports from '@/components/Ports'; // Import Ports component

// Mocking the functionality expected by the components for demonstration purposes
// In a real app, state and context would manage these values.
const mockInputState = { value: "Initial Data A", label: "Source A" };
const mockOutputState = { value: "Processed Value X", label: "Output X" };

// --------------------------------------------------------------
// Module 1: Data Source Module (Only Output)
// -------------------------------------------------------
const SourceModule = () => (
  <Module title="Data Source (Input)">
    <Ports
        outputs={[
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
  </Module>
);

// ---------------------------------------------------
// Module 2: Transformation Module (Input -> Output)
// ----------------------------------------------------------------------
const TransformModule = () => (
    <Module title="Transformer Module">
        <Ports
            inputs={[
                { label: "DataStream" }
            ]}
            outputs={[
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
  </Module>
);

export default function Home() {
  return (
    <DAGFlow>
        <SourceModule />
        <TransformModule />
    </DAGFlow>
  );
}
