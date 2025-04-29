import { LoroFile } from "@/types";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { decodeImportBlobMeta, LoroDoc } from "loro-crdt";

export function Dropzone({ onRead }: { onRead?: (file: LoroFile) => void }) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      acceptedFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onabort = () => console.log("file reading was aborted");
        reader.onerror = (e) => {
          console.error(e);
          toast.error("File reading has failed");
        };
        reader.onload = () => {
          // Do whatever you want with the file contents
          const binaryStr = reader.result;
          if (!binaryStr) {
            toast.error("File reading has failed");
            return;
          }
          if (typeof binaryStr === "string") {
            toast.error(
              "File reading has failed (getting string instead of binary)",
            );
            return;
          }

          const data = new Uint8Array(binaryStr);
          try {
            const meta = decodeImportBlobMeta(data, true);
            const loroDoc = new LoroDoc();
            loroDoc.import(data);
            onRead?.({
              name: file.name,
              binary: data,
              lastModified: file.lastModified,
              loroDoc,
              ...meta
            });
            toast.success(`Loaded ${file.name}`);
          } catch (e) {
            toast.error("Invalid Loro document");
            return;
          }

        };
        reader.readAsArrayBuffer(file);
      });
    },
    [onRead],
  );
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div
      {...getRootProps()}
      className={`group relative flex h-[160px] w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-all duration-300 ${isDragActive
        ? "border-indigo-500 bg-indigo-500/10"
        : "border-gray-700 bg-gray-800/20 hover:border-gray-600 hover:bg-gray-800/30"
        }`}
      style={{
        maxWidth: "calc(100vw - 60px)",
      }}
    >
      <input {...getInputProps()} />

      <div className="flex flex-col items-center gap-3 px-4 py-5 text-center">
        <div className={`rounded-full p-3 transition-colors ${isDragActive ? "bg-indigo-500/20 text-indigo-400" : "bg-gray-800 text-gray-400 group-hover:bg-gray-700 group-hover:text-gray-300"
          }`}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>

        <div className="space-y-1">
          <p className={`text-sm font-medium ${isDragActive ? "text-indigo-400" : "text-gray-300 group-hover:text-white"
            }`}>
            {isDragActive ? "Drop your file here" : "Drop your Loro document here"}
          </p>
          <p className="text-xs text-gray-500">
            or <span className="text-indigo-400 underline">browse files</span>
          </p>
        </div>
      </div>

      {/* Animated border for active drag state */}
      {isDragActive && (
        <div className="absolute inset-0 z-0 animate-pulse rounded-lg border-2 border-indigo-500 opacity-50"></div>
      )}
    </div>
  );
}
