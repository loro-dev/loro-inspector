export interface BinaryFile {
  name: string;
  binary: Uint8Array;
  lastModified: number;
  importedTime: number;
}
