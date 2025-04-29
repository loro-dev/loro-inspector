# ![](./public/icon.png) Loro Inspector

A developer tool for inspecting Loro document state, structure, and history.

## What is Loro Inspector?

Loro Inspector is a web-based tool that allows you to examine the internal state
of Loro CRDT documents. With it, you can:

- View the current document state
- Explore document history
- Visualize the Directed Acyclic Graph (DAG) of changes
- Navigate through time to see how the document evolved

## What is Loro?

[Loro](https://loro.dev/) is a high-performance Conflict-free Replicated Data
Types (CRDT) library that makes building local-first and collaborative
applications easier. CRDTs allow multiple users to independently edit the same
document without coordination, while automatically resolving conflicts.

Loro features:

- P2P synchronization
- Automatic conflict resolution
- Local-first operation
- Rich CRDT types (Text, Rich Text, Map, List, Tree, etc.)
- Time travel capabilities
- High performance with minimal storage overhead

## Features

- **Document State View**: Inspect the current state of your Loro document
- **History Timeline**: Navigate through the document's history
- **DAG Visualization**: View the directed acyclic graph of document changes
- **File Import**: Analyze Loro document files by drag-and-drop
- **Example Document**: Try the tool with a provided example document

## Getting Started

### Online Demo

Visit the [Loro Inspector website](https://loro-inspector.vercel.app/) to use
the tool directly in your browser.

### Running Locally

1. Clone the repository
   ```
   git clone https://github.com/zxch3n/loro-inspector.git
   ```

2. Install dependencies
   ```
   cd loro-inspector
   pnpm install
   ```

3. Start the development server
   ```
   pnpm dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Usage

1. Either:
   - Drag and drop a Loro document file onto the dropzone
   - Click "Try Example Document" to load the included sample

2. Use the tabs to switch between different views:
   - **State**: View the current document state
   - **History**: Explore the document's edit history
   - **DAG**: Visualize the document's change graph

3. In the State view, use the timeline slider to navigate through different
   versions of the document.

## Building for Production

To create a production build:

```
pnpm build
```

The built files will be in the `dist` directory.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for
details.
