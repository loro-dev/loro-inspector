import { LoroFile } from "@/types";
import { useState } from "react";
import { Button } from "./button";
import { toast } from "sonner";
import { decodeImportBlobMeta, LoroDoc } from "loro-crdt";
import { Textarea } from "./textarea";

interface TextImportProps {
    onRead?: (file: LoroFile) => void;
}

export function TextImport({ onRead }: TextImportProps) {
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleImport = async () => {
        if (!input.trim()) {
            toast.error("Please paste some content to import");
            return;
        }

        setIsLoading(true);

        try {
            let data: Uint8Array;
            let fileName: string;

            const trimmedInput = input.trim();

            // Try to parse as base64 first
            if (trimmedInput.match(/^[A-Za-z0-9+/]*={0,2}$/) && trimmedInput.length > 0) {
                try {
                    const binaryString = atob(trimmedInput);
                    data = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        data[i] = binaryString.charCodeAt(i);
                    }
                    fileName = "base64-import.loro";
                } catch (e) {
                    throw new Error("Invalid base64 format");
                }
                const meta = decodeImportBlobMeta(data, true);
                const loroDoc = new LoroDoc();
                loroDoc.import(data);

                onRead?.({
                    name: fileName,
                    binary: data,
                    lastModified: Date.now(),
                    loroDoc,
                    ...meta
                });
            } else if (trimmedInput.startsWith('{') || trimmedInput.startsWith('[')) {
                const loroDoc = new LoroDoc();
                try {
                    const jsonData = JSON.parse(trimmedInput);
                    loroDoc.importJsonUpdates(jsonData);
                    fileName = "json-import.loro";
                } catch (e: unknown) {
                    throw new Error("Invalid JSON format. Please provide valid JSON updates from `doc.exportJsonUpdates(...)` content.");
                }

                const data = loroDoc.export({ mode: "snapshot" });
                onRead?.({
                    name: fileName,
                    binary: data,
                    lastModified: Date.now(),
                    loroDoc,
                    ...decodeImportBlobMeta(data, true)
                });
            } else {
                throw new Error("Unsupported format");
            }


            toast.success(`Successfully imported ${fileName}`);
            setInput(""); // Clear the input after successful import
        } catch (error) {
            console.error("Import error:", error);
            toast.error(`Import failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <label htmlFor="text-import" className="text-sm font-medium text-gray-300">
                    Paste Content to Import
                </label>
                <Textarea
                    id="text-import"
                    placeholder="Paste your data here..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="min-h-[120px] bg-gray-800/60 border-gray-700 text-gray-200 placeholder:text-gray-500 font-mono text-sm"
                    disabled={isLoading}
                />
            </div>

            <div className="flex gap-2">
                <Button
                    onClick={handleImport}
                    disabled={!input.trim() || isLoading}
                    className="flex-1"
                >
                    {isLoading ? "Importing..." : "Import"}
                </Button>
                <Button
                    variant="outline"
                    onClick={() => setInput("")}
                    disabled={!input.trim() || isLoading}
                >
                    Clear
                </Button>
            </div>

            <div className="text-xs text-gray-500 space-y-1">
                <p>Supported formats:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Base64 encoded Loro updates/snapshots</li>
                    <li>JSON updates from `doc.exportJsonUpdates(...)`</li>
                </ul>
            </div>
        </div>
    );
} 
