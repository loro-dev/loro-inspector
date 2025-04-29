import { Change, LoroDoc, OpId, PeerID } from "loro-crdt";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
    Background,
    BackgroundVariant,
    Controls,
    Edge,
    Handle,
    MarkerType,
    Node,
    NodeProps,
    PanOnScrollMode,
    Position,
    ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { sugiyama, coordSimplex, decrossOpt, layeringSimplex, graphStratify } from 'd3-dag';

// Add custom CSS for the ReactFlow panel
import './HistoryVisualizerStyles.css';

interface NodeData {
    change: Change;
}

// Helper function to calculate the height based on change length
const calculateNodeHeight = (length: number): number => {
    if (length < 100) {
        return 70;
    }
    if (length < 1000) {
        return 130;
    }
    if (length < 10000) {
        return 180;
    }
    if (length < 100000) {
        return 230;
    }
    if (length < 1000000) {
        return 280;
    }
    if (length < 10000000) {
        return 330;
    }
    return 380;
};

const ChangeNode = ({ data }: NodeProps<NodeData>) => {
    const { change } = data;

    const formatTimestamp = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleTimeString();
    };

    // Calculate height based on change length with a safety check
    const length = typeof change.length === 'number' ? change.length : 0;
    const nodeHeight = calculateNodeHeight(length);

    // Determine background color based on change length
    const isLargeChange = length > 1000000; // Greater than 1M
    const isMidChange = length > 1000; // Greater than 1K
    const bgColor = isLargeChange ? 'bg-red-900' : isMidChange ? 'bg-blue-900' : 'bg-gray-800';
    const borderColor = isLargeChange ? 'border-red-500' : isMidChange ? 'border-blue-700' : 'border-gray-300';

    return (
        <div
            className={`p-2 rounded-md border ${borderColor} ${bgColor}`}
            style={{
                minHeight: `${nodeHeight}px`,
                height: `${nodeHeight}px`,
                width: '100%'
            }}
        >
            <Handle type="target" position={Position.Top} className={`!bg-${isLargeChange ? 'red' : 'gray'}-400`} />
            <div className="text-xs">
                <div className="font-semibold">{`${change.counter}@${change.peer}`}</div>
                <div className="text-gray-400">{formatTimestamp(change.timestamp)}</div>
                {change.message && (
                    <div className="text-gray-300 truncate max-w-40">{change.message}</div>
                )}
                <div className={`${isLargeChange ? 'text-red-300 font-bold' : 'text-gray-300'}`}>
                    Length: {length.toLocaleString()}
                    {isLargeChange && " (!!)"}
                </div>
            </div>
            <Handle type="source" position={Position.Bottom} className={`!bg-${isLargeChange ? 'red' : 'gray'}-400`} />
        </div>
    );
};

// Make the function async to support await import
async function d3DagLayout(nodes: Node[], edges: Edge[], direction: 'TB' | 'LR'): Promise<{ nodes: Node[], edges: Edge[] }> {
    if (nodes.length === 0) return { nodes, edges };

    console.log(`Starting d3DagLayout with ${nodes.length} nodes and ${edges.length} edges`);

    // Create node ID to data mapping for later use
    const nodeDataMap = new Map<string, Node<NodeData>>();
    nodes.forEach(node => nodeDataMap.set(node.id, node));

    // Create index-based ID mapping to overcome d3-dag ID issues
    const indexToNodeMap = new Map<number, Node<NodeData>>();
    const nodeToIndexMap = new Map<string, number>();

    nodes.forEach((node, index) => {
        indexToNodeMap.set(index, node);
        nodeToIndexMap.set(node.id, index);
    });

    // Create graphNodes structure for d3-dag
    // Each node needs an id and an array of parentIds (nodes it depends on)
    const graphNodes: { id: string, parentIds: string[] }[] = [];

    // First, create a map of dependencies for each node
    const nodeDependencies = new Map<string, Set<string>>();

    // Initialize empty sets for all nodes
    nodes.forEach(node => {
        nodeDependencies.set(node.id, new Set<string>());
    });

    // Populate dependencies from edges
    // IMPORTANT: Reverse the direction - if A depends on B in the app, 
    // then in d3-dag B should be a parent of A (not the other way around)
    edges.forEach(edge => {
        // In our app, edge goes from source→target meaning target depends on source
        // So source is a parent of target in d3-dag terminology
        const childId = edge.target; // This is the dependent node
        const parentId = edge.source; // This is the dependency

        const deps = nodeDependencies.get(childId);
        if (deps) {
            deps.add(parentId);
        }
    });

    // Create graphNodes array from dependencies
    nodes.forEach(node => {
        const parentIds = Array.from(nodeDependencies.get(node.id) || []);
        graphNodes.push({
            id: node.id,
            parentIds: parentIds
        });
    });

    console.log(`Created ${graphNodes.length} graphNodes with dependencies`);

    // Use graphStratify instead of graphConnect since we're using the parentIds approach
    const stratify = graphStratify();
    const dag = stratify(graphNodes);

    // Count the number of nodes in the dag
    let dagNodeCount = 0;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const _ of dag.nodes()) {
        dagNodeCount++;
    }
    console.log(`Created d3-dag graph with ${dagNodeCount} nodes`);

    // Create a direct mapping between d3-dag nodes and our original nodes
    const dagNodeToOriginalNode = new Map();

    // Define interface for d3-dag node data
    interface D3DagNodeData {
        id: string;
        x?: number;
        y?: number;
        data: {
            id: string;
            parentIds: string[];
        };
    }

    // Process d3-dag nodes and map them to original nodes by ID
    for (const dagNode of dag.nodes()) {
        // Access id directly from the node data with proper typing
        const typedDagNode = dagNode as unknown as D3DagNodeData;
        const nodeId = typedDagNode.data.id;
        if (nodeId && nodeDataMap.has(nodeId)) {
            const originalNode = nodeDataMap.get(nodeId);
            if (originalNode) {
                dagNodeToOriginalNode.set(dagNode, originalNode);
            }
        }
    }

    console.log(`Associated ${dagNodeToOriginalNode.size} d3-dag nodes with original nodes`);

    // Set up the sugiyama layout with sensible defaults
    const layout = sugiyama()
        .layering(layeringSimplex())
        .decross(decrossOpt())
        .coord(coordSimplex())
        .nodeSize((dagNode) => {
            const originalNode = dagNodeToOriginalNode.get(dagNode);
            if (!originalNode) throw new Error("Original node not found for d3-dag node");

            const change = originalNode.data.change;
            return [200, calculateNodeHeight(change.length) * 1.8];
        })
        .gap([80, 80])

    // Apply the layout to the graph
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const layout_typed = layout as any;
    const { width, height } = layout_typed(dag);
    console.log(`D3-DAG Layout size: ${width} x ${height}`);

    // Convert the dag layout back to ReactFlow nodes and edges
    const positionedNodes: Node[] = [];

    // Process positioned nodes
    for (const dagNode of dag.nodes()) {
        console.log(dagNode);
        // Use our direct mapping instead of trying to access ID
        const originalNode = dagNodeToOriginalNode.get(dagNode);

        if (originalNode) {
            const change = originalNode.data.change;

            // Create a new node with the positioned coordinates
            positionedNodes.push({
                ...originalNode,
                position: {
                    x: direction === 'TB' ? ((dagNode as { x?: number }).x || 0) : ((dagNode as { y?: number }).y || 0),
                    y: direction === 'TB' ? ((dagNode as { y?: number }).y || 0) : ((dagNode as { x?: number }).x || 0)
                },
                // Set the height of the node based on the change length
                style: {
                    height: `${calculateNodeHeight(change.length)}px`,
                    width: `200px`
                }
            });
        } else {
            console.error('Original node not found for d3-dag node');
        }
    }

    console.log(`Generated ${positionedNodes.length} positioned nodes for ReactFlow`);

    return { nodes: positionedNodes, edges };
}

export function HistoryVisualizer({ loroDoc }: { loroDoc: LoroDoc }) {
    const [layoutDirection, setLayoutDirection] = useState<'TB' | 'LR'>('TB');
    const [debugInfo, setDebugInfo] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
    const lastLayoutDirection = useRef(layoutDirection);

    // Add new state for the layout results
    const [layoutResult, setLayoutResult] = useState<{
        nodes: Node[];
        edges: Edge[];
        nodeCount: number;
    }>({
        nodes: [],
        edges: [],
        nodeCount: 0
    });

    // Helper to create a node ID from a change
    const getNodeId = (change: Change): string => {
        // Use the last op id in the change as the node ID
        return `${change.peer}_${change.counter + change.length - 1}`;
    };

    // Helper to find the change that contains a given OpId
    const findContainingChange = (
        changes: Map<PeerID, Change[]>,
        opId: OpId
    ): Change | null => {
        const peerChanges = changes.get(opId.peer);
        if (!peerChanges) return null;

        // Find the change that contains this op
        return peerChanges.find(change =>
            opId.counter >= change.counter &&
            opId.counter < change.counter + change.length
        ) || null;
    };

    // Build initial nodes and edges with basic positions
    const elementsData = useMemo<Promise<{
        nodes: Node[];
        edges: Edge[];
        nodeMap: Map<string, Node<NodeData>>;
        nodeCount: number;
    }>>(() => {
        const calculateLayout = async () => {
            setIsLoading(true);
            const changes: Map<PeerID, Change[]> = loroDoc.getAllChanges();
            const nodeMap = new Map<string, Node<NodeData>>();
            const edgeList: Edge[] = [];

            // Debug info collection
            let totalChanges = 0;
            let peersInfo = "";
            let mergedChanges = 0;

            // First pass: Create nodes with potential merging
            changes.forEach((cs, peer) => {
                totalChanges += cs.length;
                peersInfo += `Peer ${peer}: ${cs.length} changes, `;

                // First clone the changes array to avoid modifying the original
                const changesToProcess = [...cs];

                // Merge continuous changes from the same peer
                let i = 0;
                while (i < changesToProcess.length - 1) {
                    const currentChange = changesToProcess[i];
                    const nextChange = changesToProcess[i + 1];

                    // Check if they are continuous
                    if (currentChange.counter + currentChange.length === nextChange.counter) {
                        // Check if current only has one dependent which is next
                        const currentDeps = new Set(changesToProcess.filter(c =>
                            c.deps.some(dep =>
                                dep.peer === currentChange.peer &&
                                dep.counter >= currentChange.counter &&
                                dep.counter < currentChange.counter + currentChange.length
                            )
                        ).map(c => getNodeId(c)));

                        // Check if next only depends on current
                        const nextOnlyDependsOnCurrent = nextChange.deps.every(dep =>
                            dep.peer === currentChange.peer &&
                            dep.counter >= currentChange.counter &&
                            dep.counter < currentChange.counter + currentChange.length
                        ) && nextChange.deps.length > 0;

                        if (currentDeps.size === 1 &&
                            currentDeps.has(getNodeId(nextChange)) &&
                            nextOnlyDependsOnCurrent) {
                            // Merge the changes
                            currentChange.length += nextChange.length;
                            // Remove the next change
                            changesToProcess.splice(i + 1, 1);
                            mergedChanges++;
                            // Don't increment i, check if we can merge more
                            continue;
                        }
                    }
                    i++;
                }

                changesToProcess.forEach((change) => {
                    // Create node for this change, using the last op ID as node ID
                    const id = getNodeId(change);
                    nodeMap.set(id, {
                        id,
                        data: {
                            change,
                        },
                        position: { x: 0, y: 0 }, // Will be positioned by layout
                        type: 'changeNode',
                    });
                });
            });

            // Second pass: Create edges between the filtered nodes
            nodeMap.forEach((node) => {
                const change = node.data.change;
                const sourceId = node.id;

                // For each dependency, find the containing change and create an edge
                change.deps.forEach((depOpId) => {
                    const depChange = findContainingChange(changes, depOpId);

                    if (depChange) {
                        const targetId = getNodeId(depChange);

                        // Create edge from dependency to this change
                        if (nodeMap.has(targetId) && targetId !== sourceId) {
                            edgeList.push({
                                id: `${targetId}-${sourceId}`,
                                source: sourceId,
                                target: targetId,
                                animated: false,
                                style: { stroke: '#999', strokeWidth: 2 },
                                markerEnd: {
                                    type: MarkerType.ArrowClosed,
                                    width: 15,
                                    height: 15,
                                    color: '#aaa',
                                }
                            });
                        }
                    }
                });
            });

            // Update debug info
            const nodeCount = nodeMap.size;
            const edgeCount = edgeList.length;
            setDebugInfo(`Found ${totalChanges} changes across peers: ${peersInfo}. Merged ${mergedChanges} changes. Created ${nodeCount} nodes and ${edgeCount} edges.`);

            // Create a basic array of nodes
            const initialNodes = Array.from(nodeMap.values());

            // Apply d3-dag layout to position the nodes (await the result)
            const { nodes, edges } = await d3DagLayout(initialNodes, edgeList, layoutDirection);

            // Log the node and edge counts
            console.log(`Created ${nodeCount} nodes and ${edgeCount} edges. Merged ${mergedChanges} changes.`);
            console.log(`Positioned nodes count: ${nodes.length}`);

            if (nodes.length === 0 && nodeCount > 0) {
                console.error("Nodes were created but no positioned nodes were generated by the layout");
                console.log("Sample node data:", Array.from(nodeMap.values())[0]);
            }

            setIsLoading(false);
            return { nodes, edges, nodeMap, nodeCount };
        };

        return calculateLayout();
    }, [loroDoc, layoutDirection]);

    // Handle the async layout calculation
    useEffect(() => {
        // Set loading state
        setIsLoading(true);

        // Process the layout promise
        elementsData.then(result => {
            console.log('Layout calculation complete:', result.nodes.length, 'nodes');
            // Update the layout result
            setLayoutResult({
                nodes: result.nodes,
                edges: result.edges,
                nodeCount: result.nodeCount
            });
            // Clear loading state
            setIsLoading(false);
        }).catch(error => {
            console.error('Layout calculation failed:', error);
            setIsLoading(false);
        });
    }, [elementsData]);

    // Trigger fit view when direction changes
    useEffect(() => {
        if (reactFlowInstance && lastLayoutDirection.current !== layoutDirection) {
            setTimeout(() => {
                reactFlowInstance.fitView({ padding: 0.2 });
                lastLayoutDirection.current = layoutDirection;
            }, 50);
        }
    }, [reactFlowInstance, layoutDirection]);

    const nodeTypes = useMemo(() => ({ changeNode: ChangeNode }), []);

    const onInit = useCallback((instance: ReactFlowInstance) => {
        setReactFlowInstance(instance);
        setTimeout(() => {
            instance.fitView({ padding: 0.2 });
        }, 50);
    }, []);

    console.log(elementsData);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                    <span>Layout:</span>
                    <select
                        value={layoutDirection}
                        onChange={(e) => setLayoutDirection(e.target.value as 'TB' | 'LR')}
                        className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm"
                    >
                        <option value="TB">Top to Bottom</option>
                        <option value="LR">Left to Right</option>
                    </select>
                </div>
            </div>

            <div className="border border-gray-700 rounded-md h-[700px] bg-gray-900 ">
                {isLoading ? (
                    <div className="h-full flex items-center justify-center text-white">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : layoutResult.nodes.length > 0 ? (
                    <ReactFlow
                        nodes={layoutResult.nodes}
                        edges={layoutResult.edges}
                        nodeTypes={nodeTypes}
                        onInit={onInit}
                        fitView
                        fitViewOptions={{ padding: 0.4 }}
                        minZoom={0.1}
                        maxZoom={2}
                        panOnScroll={true}
                        panOnScrollMode={PanOnScrollMode.Free}
                        nodesDraggable={false}
                        elementsSelectable={true}
                        defaultEdgeOptions={{
                            style: { stroke: '#ddd' },
                            animated: false,
                            markerEnd: {
                                type: MarkerType.ArrowClosed,
                                width: 20,
                                height: 20,
                                color: '#aaa',
                            }
                        }}
                        style={{ background: '#1a1a1a' }}
                    >
                        <Background color="#555" variant={BackgroundVariant.Dots} />
                        <Controls />
                    </ReactFlow>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500">
                        <div>No changes found in the document</div>
                        <div className="text-xs mt-2">
                            {debugInfo}
                            <div className="mt-2">Found nodes: {layoutResult.nodeCount || 0}, Positioned nodes: {layoutResult.nodes?.length || 0}</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
