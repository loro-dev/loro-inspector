import { VersionVector } from "loro-crdt";
import { X } from "lucide-react";

interface VersionVectorDialogProps {
    versionVector: VersionVector | undefined;
    title: string;
    onClose?: () => void;
}

export function VersionVectorDialog({ versionVector, title, onClose }: VersionVectorDialogProps) {
    if (!versionVector || !versionVector.toJSON) return null;

    const map = versionVector.toJSON();
    const entries = Array.from(map.entries()) as Array<[string, number]>;

    // Sort entries by peerId
    const sortedEntries = [...entries].sort((a, b) => a[0].localeCompare(b[0]));

    return (
        <div className="bg-gray-900/95 border border-indigo-900/40 rounded-xl p-6 max-h-[80vh] overflow-auto relative shadow-xl backdrop-blur-sm w-[350px]">
            {onClose && (
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-800/50 p-1.5"
                    aria-label="Close"
                >
                    <X size={18} />
                </button>
            )}
            <h3 className="text-white font-semibold mb-5 text-lg">{title}</h3>
            <div className="space-y-3">
                {sortedEntries.map(([peerId, counter]) => (
                    <div
                        key={peerId}
                        className="flex justify-between items-center border-b border-gray-800/60 pb-2.5 hover:bg-gray-800/20 px-2 rounded-md transition-colors -mx-2"
                    >
                        <span className="font-mono text-indigo-400 text-sm truncate max-w-[65%]" title={peerId}>
                            {peerId}
                        </span>
                        <span className="font-mono text-gray-300 font-medium">{counter}</span>
                    </div>
                ))}
            </div>
            <div className="mt-4 text-center text-xs text-gray-500">
                {entries.length} entries
            </div>
        </div>
    );
} 
