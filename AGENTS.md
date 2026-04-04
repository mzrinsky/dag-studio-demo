# DAG Studio Project Agent Instructions - Condensed
## Core Architecture Principles
### Component Extension Pattern
- **Core Philosophy**: All shadcn/ui components can be extended with port functionality
- **Port Wrapper**: Create `<Port>` component that wraps any existing shadcn/ui component to expose multiple input/output ports
- **Composition**: Nodes are composed of ports and shadcn/ui components
## This is NOT the Next.js you know
This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.