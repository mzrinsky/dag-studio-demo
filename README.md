# DAG Studio Demo POC

Ths is a proof-of-concept demo project to explore ideas around using as many existing frameworks as possible
to create a modern node-based visual programming framework.
Specifically I want to explore ideas I have around implementing connection ports as a Component that can wrap
other components and provide the connection functionality.

## Project Overview
DAG Studio will be a modern node-based visual programming framework built with Next.js 16, React 18+, shadcn/ui, and Tailwind CSS. It aims to be a better alternative to LiteGraph and Rete.js.

## Technical Requirements
- Use React 18+ features (useEffect, useState, etc.)
- Implement proper TypeScript typing
- Leverage Tailwind CSS for styling
- Follow shadcn/ui design patterns
- Ensure responsive design
- Use proper accessibility attributes

## File Structure
- Components in `/components/` directory
- shadcn/ui Components in `/components/ui/` directory
- Main pages in `/app/` directory
- Use TypeScript for type safety
- Follow shadcn/ui component patterns


## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.


```jsx
inputports = [
{
	id: 'uuid?',
	key: 'user_input',
	label: 'User Input',
	type: 'string',
},
]

<Node>
	<Ports inputs={inputports}>
        <Field>
            <FieldLabel htmlFor="user-input-id">User Input</FieldLabel>
            <Input id="user-input-id" placeholder="Your Input.." />
            <FieldDescription>
                Your input goes here.
            </FieldDescription>
        </Field>
	</Ports>
</Node>
```