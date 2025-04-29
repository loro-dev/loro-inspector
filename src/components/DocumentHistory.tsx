import { Change, LoroDoc } from "loro-crdt";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { X, Copy, Check } from "lucide-react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export function DocumentHistory({ loroDoc }: { loroDoc: LoroDoc }) {
    const [changes, setChanges] = useState<Change[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredChanges, setFilteredChanges] = useState<Change[]>([]);
    const [selectedChange, setSelectedChange] = useState<
        Change & { json: string } | null
    >(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const changesArr: Change[] = [];
        loroDoc.travelChangeAncestors(loroDoc.oplogFrontiers(), (c) => {
            changesArr.push(c);
            return true;
        });
        setChanges(changesArr);
    }, [loroDoc]);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredChanges(changes);
            return;
        }

        const filtered = changes.filter((change) => {
            // Search by PeerID
            if (searchQuery === `${change.peer}`) {
                return true;
            }

            // Search by OpId (counter@PeerId)
            const opIdPattern = `${change.counter}@${change.peer}`;
            if (searchQuery.includes(opIdPattern)) {
                return true;
            }

            // Search within range counter~counter+length
            if (searchQuery.includes("@")) {
                const [counterStr, peerId] = searchQuery.split("@");
                const counter = parseInt(counterStr, 10);

                if (
                    !isNaN(counter) && peerId === `${change.peer}` &&
                    counter >= change.counter &&
                    counter < change.counter + change.length
                ) {
                    return true;
                }
            }

            // Search by message
            if (
                change.message &&
                change.message.toLowerCase().includes(searchQuery.toLowerCase())
            ) {
                return true;
            }

            return false;
        });

        setFilteredChanges(filtered);
    }, [searchQuery, changes]);

    const formatTimestamp = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleString();
    };

    const formatOpIdInfo = (change: Change) => {
        return `${change.counter}@${change.peer} (${change.length})`;
    };

    const handleRowClick = (change: Change) => {
        setSelectedChange({
            ...change,
            json: JSON.stringify(
                loroDoc.exportJsonInIdSpan({
                    peer: change.peer,
                    counter: change.counter,
                    length: change.length,
                }),
                null,
                2,
            ),
        });
    };

    const closeDialog = () => {
        setSelectedChange(null);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="flex flex-col w-full min-h-[400px] space-y-4">
            <div className="sticky top-0 z-10 py-3 px-4 bg-gray-900/90 border-b border-gray-800 backdrop-blur-sm">
                <Input
                    type="search"
                    className="w-full bg-gray-800/60 border-gray-700 text-gray-200 placeholder:text-gray-500"
                    placeholder="Search by PeerID, OpId (counter@PeerId), or message content"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="mt-2 text-sm text-gray-400">
                    {changes.length} total changes, {filteredChanges.length}
                    {" "}
                    shown
                </div>
            </div>

            <div className="flex-1 overflow-auto px-1 max-h-[calc(80vh-100px)] overflow-y-auto">
                <div className="rounded-md border border-gray-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse relative">
                            <thead className="sticky top-0">
                                <tr className="bg-gray-900 text-gray-300 border-b border-gray-800">
                                    <th className="font-medium text-left py-3 px-4">
                                        OpId
                                    </th>
                                    <th className="font-medium text-left py-3 px-4">
                                        Lamport
                                    </th>
                                    <th className="font-medium text-left py-3 px-4">
                                        Timestamp
                                    </th>
                                    <th className="font-medium text-left py-3 px-4">
                                        Dependencies
                                    </th>
                                    <th className="font-medium text-left py-3 px-4">
                                        Message
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filteredChanges.map((change, index) => (
                                    <tr
                                        key={index}
                                        className="border-b border-gray-800 hover:bg-gray-800/30 cursor-pointer"
                                        onClick={() => handleRowClick(change)}
                                    >
                                        <td className="font-mono text-indigo-300 py-3 px-4">
                                            {formatOpIdInfo(change)}
                                        </td>
                                        <td className="text-gray-300 py-3 px-4">
                                            {change.lamport}
                                        </td>
                                        <td className="text-gray-300 py-3 px-4">
                                            {formatTimestamp(change.timestamp)}
                                        </td>
                                        <td className="font-mono py-3 px-4 max-w-xs truncate">
                                            {change.deps.map((dep, i) => (
                                                <div
                                                    key={i}
                                                    className="text-xs text-gray-400"
                                                >
                                                    {`${dep.counter}@${dep.peer}`}
                                                </div>
                                            ))}
                                        </td>
                                        <td className="text-gray-300 py-3 px-4">
                                            {change.message || "-"}
                                        </td>
                                    </tr>
                                ))}
                                {filteredChanges.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="h-24 text-center text-gray-500"
                                        >
                                            {searchQuery
                                                ? "No matching changes found"
                                                : "No changes available"}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Change Detail Dialog */}
            {selectedChange && (
                <div
                    className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6 backdrop-blur-sm"
                    onClick={closeDialog}
                >
                    <div
                        className="w-full max-w-2xl max-h-[80vh] overflow-auto bg-gray-900 rounded-lg border border-gray-800 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between bg-gray-800 px-4 py-3 border-b border-gray-700">
                            <h3 className="text-lg font-medium text-white">
                                Change Details
                            </h3>
                            <button
                                onClick={closeDialog}
                                className="rounded-full p-1 text-gray-400 hover:bg-gray-700/70 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-5 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <h4 className="text-sm font-medium text-gray-500">
                                        OpId
                                    </h4>
                                    <div className="font-mono text-indigo-300 text-sm bg-gray-800/50 p-2 rounded">
                                        {formatOpIdInfo(selectedChange)}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-sm font-medium text-gray-500">
                                        Peer ID
                                    </h4>
                                    <div className="font-mono text-gray-300 text-sm bg-gray-800/50 p-2 rounded">
                                        {selectedChange.peer}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-sm font-medium text-gray-500">
                                        Counter
                                    </h4>
                                    <div className="font-mono text-gray-300 text-sm bg-gray-800/50 p-2 rounded">
                                        {selectedChange.counter}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-sm font-medium text-gray-500">
                                        Length
                                    </h4>
                                    <div className="font-mono text-gray-300 text-sm bg-gray-800/50 p-2 rounded">
                                        {selectedChange.length}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-sm font-medium text-gray-500">
                                        Lamport Timestamp
                                    </h4>
                                    <div className="font-mono text-gray-300 text-sm bg-gray-800/50 p-2 rounded">
                                        {selectedChange.lamport}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-sm font-medium text-gray-500">
                                        Timestamp
                                    </h4>
                                    <div className="font-mono text-gray-300 text-sm bg-gray-800/50 p-2 rounded">
                                        {formatTimestamp(
                                            selectedChange.timestamp,
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <h4 className="text-sm font-medium text-gray-500">
                                    Message
                                </h4>
                                <div className="font-mono text-gray-300 text-sm bg-gray-800/50 p-2 rounded min-h-[2.5rem]">
                                    {selectedChange.message || "-"}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-sm font-medium text-gray-500">
                                    Dependencies ({selectedChange.deps.length})
                                </h4>
                                <div className="bg-gray-800/50 rounded p-3 max-h-40 overflow-y-auto">
                                    {selectedChange.deps.length > 0
                                        ? (
                                            <div className="space-y-2">
                                                {selectedChange.deps.map((
                                                    dep,
                                                    i,
                                                ) => (
                                                    <div
                                                        key={i}
                                                        className="flex justify-between items-center px-2 py-1 hover:bg-gray-800 rounded"
                                                    >
                                                        <span className="font-mono text-indigo-300 text-xs">
                                                            {`${dep.counter}@${dep.peer}`}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )
                                        : (
                                            <div className="text-center text-gray-500">
                                                No dependencies
                                            </div>
                                        )}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-sm font-medium text-gray-500">
                                        Change JSON Content
                                    </h4>
                                    <button
                                        onClick={() => copyToClipboard(selectedChange.json)}
                                        className="flex items-center gap-1 text-xs py-1 px-2 rounded bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                                        title="Copy JSON"
                                    >
                                        {copied ? (
                                            <>
                                                <Check size={14} />
                                                <span>Copied!</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy size={14} />
                                                <span>Copy</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                                <div className="bg-gray-800/80 rounded overflow-hidden border border-gray-700/30">
                                    <div className="max-h-[300px] overflow-auto">
                                        <SyntaxHighlighter
                                            language="json"
                                            style={vscDarkPlus}
                                            customStyle={{
                                                margin: 0,
                                                padding: '12px',
                                                borderRadius: 0,
                                                background: 'transparent',
                                                fontSize: '0.8rem',
                                            }}
                                            wrapLines={true}
                                            showLineNumbers={true}
                                            lineNumberStyle={{
                                                minWidth: '2.5em',
                                                paddingRight: '1em',
                                                color: 'rgba(156, 163, 175, 0.5)',
                                                textAlign: 'right',
                                                userSelect: 'none',
                                            }}
                                        >
                                            {selectedChange.json}
                                        </SyntaxHighlighter>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
