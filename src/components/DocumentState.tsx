import { LoroDoc } from "loro-crdt";
import { useEffect, useState } from "react";
import { debounce } from "throttle-debounce";

export function DocumentState({ loroDoc }: { loroDoc: LoroDoc }) {
    const [state, setState] = useState<unknown>(undefined);
    useEffect(() => {
        setState(loroDoc.toJSON());
        const sub = loroDoc.subscribe(
            debounce(100, () => {
                setState(loroDoc.toJSON());
            })
        );
        return () => {
            sub();
        }
    }, [loroDoc])
    return <div className="overflow-x-auto max-w-[calc(100vw-80px)] lg:max-w-[calc(100vw-600px)]">
        <CollapsibleJsonViewer json={state} />
    </div>;
}


export function CollapsibleJsonViewer({ json }: { json: unknown }) {
    const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
    const [modal, setModal] = useState<{ open: boolean, content: string }>({ open: false, content: "" });

    if (json === undefined) {
        return (
            <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4 text-center text-gray-500">
                <div className="animate-pulse">Loading document state...</div>
            </div>
        );
    }

    const toggleNode = (path: string) => {
        setExpandedNodes(prev => ({
            ...prev,
            [path]: !prev[path]
        }));
    };

    const openStringModal = (content: string) => {
        setModal({ open: true, content });
    };

    const closeModal = () => {
        setModal({ open: false, content: "" });
    };

    const renderStringValue = (value: string) => {
        const MAX_LENGTH = 100;
        const isLong = value.length > MAX_LENGTH;
        const displayValue = isLong ? `${value.slice(0, MAX_LENGTH)}...` : value;

        return (
            <span
                className={`text-green-400 ${isLong ? 'cursor-pointer hover:underline' : ''}`}
                onClick={isLong ? () => openStringModal(value) : undefined}
                title={isLong ? "Click to view full content" : undefined}
            >
                "{displayValue}"
            </span>
        );
    };

    const renderValue = (value: unknown, path: string = "root", depth: number = 0): React.ReactNode => {
        if (value === null) return <span className="text-gray-500">null</span>;
        if (value === undefined) return <span className="text-gray-500">undefined</span>;

        const isExpanded = expandedNodes[path] === true || depth === 0; // First level always expanded

        if (Array.isArray(value)) {
            if (value.length === 0) return <span className="text-gray-400">[]</span>;

            return (
                <div className="ml-4">
                    <div
                        className="flex cursor-pointer items-center gap-1 text-gray-300 hover:text-white w-full"
                        onClick={() => toggleNode(path)}
                    >
                        <span className={`transition-transform ${isExpanded ? "rotate-90" : "rotate-0"}`}>
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </span>
                        <span className="text-gray-500">Array({value.length})</span>
                        {!isExpanded && <span className="text-gray-500 text-xs">...</span>}
                    </div>

                    {isExpanded && (
                        <div className="border-l-2 border-gray-800 pl-2 ml-1 mt-1">
                            {value.map((item, index) => (
                                <div key={`${path}.${index}`} className="my-1">
                                    <span className="text-gray-500 mr-2">{index}:</span>
                                    {renderValue(item, `${path}.${index}`, depth + 1)}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        }

        if (typeof value === "object" && value !== null) {
            const entries = Object.entries(value);
            if (entries.length === 0) return <span className="text-gray-400">{"{}"}</span>;

            return (
                <div className="ml-4">
                    <div
                        className="flex cursor-pointer items-center gap-1 text-gray-300 hover:text-white w-full"
                        onClick={() => toggleNode(path)}
                    >
                        <span className={`transition-transform ${isExpanded ? "rotate-90" : "rotate-0"}`}>
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </span>
                        <span className="text-gray-500">Object({entries.length})</span>
                        {!isExpanded && <span className="text-gray-500 text-xs">...</span>}
                    </div>

                    {isExpanded && (
                        <div className="border-l-2 border-gray-800 pl-2 ml-1 mt-1">
                            {entries.map(([key, val]) => (
                                <div key={`${path}.${key}`} className="my-1">
                                    <span className="text-indigo-400 mr-2">{key}:</span>
                                    {renderValue(val, `${path}.${key}`, depth + 1)}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        }

        if (typeof value === "string") {
            return renderStringValue(value);
        }

        if (typeof value === "number") {
            return <span className="text-amber-400">{value}</span>;
        }

        if (typeof value === "boolean") {
            return <span className="text-red-400">{value.toString()}</span>;
        }

        return <span>{String(value)}</span>;
    };

    const buildNodePaths = (obj: unknown, currentPath: string = "root", paths: string[] = []): string[] => {
        if (obj === null || obj === undefined || typeof obj !== 'object') {
            return paths;
        }

        paths.push(currentPath);

        if (Array.isArray(obj)) {
            obj.forEach((item, index) => {
                buildNodePaths(item, `${currentPath}.${index}`, paths);
            });
        } else {
            Object.entries(obj).forEach(([key, value]) => {
                buildNodePaths(value, `${currentPath}.${key}`, paths);
            });
        }

        return paths;
    };

    const expandAll = () => {
        const paths = buildNodePaths(json);
        const expanded: Record<string, boolean> = {};
        paths.forEach(path => {
            expanded[path] = true;
        });
        setExpandedNodes(expanded);
    };

    return (
        <>
            <div className="overflow-hidden rounded-lg border border-gray-800 bg-gray-900/50 text-sm">
                <div className="bg-gray-800/80 px-4 py-2 flex justify-between items-center">
                    <div className="text-sm font-medium text-gray-200">Document State</div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setExpandedNodes({})}
                            className="rounded-md px-2 py-1 text-xs text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
                        >
                            Collapse All
                        </button>
                        <button
                            onClick={expandAll}
                            className="rounded-md px-2 py-1 text-xs text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
                        >
                            Expand All
                        </button>
                    </div>
                </div>

                {true && (
                    <div className="max-h-[600px] overflow-auto p-4 font-mono">
                        <div className="min-w-max">
                            {renderValue(json)}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal for displaying full string content */}
            {modal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeModal}>
                    <div
                        className="max-h-[80vh] max-w-[90vw] overflow-auto rounded-lg bg-gray-900 p-6 shadow-xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-white">String Content</h3>
                            <button
                                onClick={closeModal}
                                className="rounded-full p-1 text-gray-400 hover:bg-gray-800 hover:text-white"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                        <pre className="whitespace-pre-wrap break-words rounded-md bg-gray-950 p-4 text-green-400 font-mono text-sm overflow-auto max-h-[60vh]">
                            {modal.content}
                        </pre>
                    </div>
                </div>
            )}
        </>
    );
}
