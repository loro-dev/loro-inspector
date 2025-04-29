import { OpId, VersionVector } from "loro-crdt";
import { LoroFile } from "@/types";
import { useState } from "react";
import { VersionVectorDialog } from "./VersionVectorDialog";

interface ImportedFileDetailsProps {
    file: LoroFile;
}

export function ImportedFileDetails({ file }: ImportedFileDetailsProps) {
    const [showStartVV, setShowStartVV] = useState(false);
    const [showEndVV, setShowEndVV] = useState(false);

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatVersionVector = (vv: VersionVector | undefined) => {
        if (!vv || !vv.toJSON) return 'N/A';
        if (vv.toJSON().size === 0) return 'None';

        const map = vv.toJSON();
        const entries = Array.from(map.entries()) as Array<[string, number]>;
        if (entries.length <= 3) {
            const formattedEntries = entries.map(([key, value]) => `${key}: ${value}`).join("\n");
            return formattedEntries;
        } else {
            const sample = entries.slice(0, 3);
            const formattedSample = sample.map(([key, value]) => `${key}: ${value}`).join("\n");
            return `${formattedSample}\n... (${entries.length} entries)`;
        }
    };

    const formatFrontiers = (frontiers: OpId[] | undefined) => {
        if (!frontiers || frontiers.length === 0) return 'None';

        if (frontiers.length <= 3) {
            return JSON.stringify(frontiers);
        } else {
            return `${JSON.stringify(frontiers.slice(0, 3))} ... (${frontiers.length} entries)`;
        }
    };

    return (
        <div className="rounded-lg border border-gray-800 bg-gray-900/80 p-4">
            <h3 className="mb-2 font-medium text-white">Document Details</h3>
            <div className="space-y-2 text-sm text-gray-400">
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="font-medium">Name:</span>
                    <span className="font-mono text-indigo-400 break-all">{file.name}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="font-medium">Size:</span>
                    <span className="font-mono">{formatBytes(file.binary.length)}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="font-medium">Mode:</span>
                    <span className="font-mono text-indigo-400">{file.mode}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="font-medium">Last Modified:</span>
                    <span className="font-mono">{new Date(file.lastModified).toLocaleString()}</span>
                </div>
                <div className="border-t border-gray-800 my-2"></div>
                <div className="flex flex-col gap-1">
                    <span className="font-medium">Partial Start Version Vector:</span>
                    <code
                        className="group block bg-gray-950 p-2 rounded-md text-xs overflow-auto cursor-pointer hover:bg-gray-900 transition-colors relative"
                        onClick={() => setShowStartVV(true)}
                    >
                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="bg-indigo-900/60 text-[10px] px-1.5 py-0.5 rounded-sm text-white">Click to view all</span>
                        </div>
                        <div className="whitespace-pre">{formatVersionVector(file.partialStartVersionVector)}</div>
                    </code>
                    {showStartVV && (
                        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6 backdrop-blur-sm" onClick={() => setShowStartVV(false)}>
                            <div onClick={(e) => e.stopPropagation()} className="max-w-full max-h-full overflow-auto">
                                <VersionVectorDialog
                                    versionVector={file.partialStartVersionVector}
                                    title="Partial Start Version Vector"
                                    onClose={() => setShowStartVV(false)}
                                />
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex flex-col gap-1">
                    <span className="font-medium">Partial End Version Vector:</span>
                    <code
                        className="group block bg-gray-950 p-2 rounded-md text-xs overflow-auto cursor-pointer hover:bg-gray-900 transition-colors relative"
                        onClick={() => setShowEndVV(true)}
                    >
                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="bg-indigo-900/60 text-[10px] px-1.5 py-0.5 rounded-sm text-white">Click to view all</span>
                        </div>
                        <div className="whitespace-pre">{formatVersionVector(file.partialEndVersionVector)}</div>
                    </code>
                    {showEndVV && (
                        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6 backdrop-blur-sm" onClick={() => setShowEndVV(false)}>
                            <div onClick={(e) => e.stopPropagation()} className="max-w-full max-h-full overflow-auto">
                                <VersionVectorDialog
                                    versionVector={file.partialEndVersionVector}
                                    title="Partial End Version Vector"
                                    onClose={() => setShowEndVV(false)}
                                />
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex flex-col gap-1">
                    <span className="font-medium">Start Frontiers:</span>
                    <code className="block bg-gray-950 p-2 rounded-md text-xs overflow-auto">
                        <div className="break-all">{formatFrontiers(file.startFrontiers)}</div>
                    </code>
                </div>
                <div className="border-t border-gray-800 my-2"></div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="font-medium">Start Timestamp:</span>
                    <span className="font-mono">{new Date(file.startTimestamp * 1000).toLocaleString()}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="font-medium">End Timestamp:</span>
                    <span className="font-mono">{new Date(file.endTimestamp * 1000).toLocaleString()}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="font-medium">Change Number:</span>
                    <span className="font-mono">{file.changeNum.toLocaleString()}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="font-medium">Total Ops Number:</span>
                    <span className="font-mono">{Array.from(file.partialEndVersionVector?.toJSON().values() ?? []).reduce((a, b) => a + b, 0).toLocaleString()}</span>
                </div>
            </div>
        </div>
    );
} 
