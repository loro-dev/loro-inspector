# ![](./public/icon.png) Loro Inspector

A developer tool for inspecting Loro document state and history.

Try it out at [inspector.loro.dev](https://inspector.loro.dev/).

https://github.com/user-attachments/assets/1087d5be-3011-4ce5-9088-889a1901ad55

## What is Loro Inspector?

Loro Inspector is a web-based tool that allows you to examine the internal state
of Loro CRDT documents. With it, you can:

- View the current document state
- Explore document history
- Visualize the Directed Acyclic Graph (DAG) of changes
- Navigate through time to see how the document evolved

## Features

- **File Import**: Analyze Loro document files by drag-and-drop
- **Document State View**: Inspect the current state of your Loro document
- **History Timeline**: Navigate through the document's history
- **DAG Visualization**: View the directed acyclic graph of document changes

## Getting Started

### Running Locally

1. Clone the repository
   ```
   git clone https://github.com/loro-dev/loro-inspector.git
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

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for
details.
