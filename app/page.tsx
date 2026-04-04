"use client";

import * as React from "react";
import { Canvas } from "@/components/canvas";
import { Node } from "@/components/node";
import { Ports } from "@/components/port";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function Home() {
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null);
  
  return (
    <Canvas 
      onCanvasClick={() => setSelectedNodeId(null)}
      className="p-8"
    >
      <div className="flex flex-col w-full gap-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            DAG Studio
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Node-based visual programming framework
          </p>
        </div>
        
        <div className="flex flex-1 min-h-screen flex-wrap gap-6">
          {/* Example 1: Simple node with ports */}
          <Node
            id="node-1"
            title="Input Node"
            description="Node showing input and output ports on components."
            inputs={[
              { id: "input-1", type: "input", dataType: "string", label: "Name" },
              { id: "input-2", type: "input", dataType: "number", label: "Value" },
            ]}
            outputs={[
              { id: "output-1", type: "output", dataType: "object", label: "Result" },
            ]}
            isSelected={selectedNodeId === "node-1"}
            onNodeClick={(id) => setSelectedNodeId(id)}
          >
            <div className="flex flex-col w-full gap-3">
              <div className="flex flex-col w-full items-center gap-2">
                <Ports id="input=1" inputs={[
                  {
                    id: "input-1",
                    type: "input",
                    label: "name input"
                  },
                  {
                    id: "input-2",
                    type: "input",
                    label: "alt name input"
                  },
                ]}
                outputs={[
                  {
                    id: "output-1",
                    type: "output",
                    label: "name output"
                  }
                ]}>
                  <Label htmlFor="name-input" className="text-sm font-medium">
                    Name:
                  </Label>
                  <Input id="name-input" placeholder="Enter name" className="w-full" />
                </Ports>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="value-input" className="text-sm font-medium">
                  Value:
                </Label>
                <Input id="value-input" type="number" placeholder="Enter value" className="flex-1" />
              </div>
            </div>
          </Node>
          
          {/* Example 2: Node with wrapped components */}
          <Node
            id="node-2"
            title="Processing Node"
            description="Node with wrapped components and ports"
            inputs={[
              { id: "input-1", type: "input", dataType: "string", label: "Text" },
            ]}
            outputs={[
              { id: "output-1", type: "output", dataType: "string", label: "Uppercase" },
              { id: "output-2", type: "output", dataType: "number", label: "Length" },
            ]}
            isSelected={selectedNodeId === "node-2"}
            onNodeClick={(id) => setSelectedNodeId(id)}
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Label htmlFor="switch-example" className="text-sm font-medium">
                  Toggle Switch:
                </Label>
                <Switch id="switch-example" />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="card-example" className="text-sm font-medium">
                  Card Example:
                </Label>
                <Card className="w-full">
                  <CardContent className="p-3 text-sm">
                    This is a card inside a node
                  </CardContent>
                </Card>
              </div>
            </div>
          </Node>
        </div>
      </div>
    </Canvas>
  );
}