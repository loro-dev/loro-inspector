import { OpId, VersionVector } from "loro-crdt";

export interface LoroFile {
  name: string;
  binary: Uint8Array;
  lastModified: number;
  importedTime: number;
  mode:
    | "outdated-snapshot"
    | "outdated-update"
    | "snapshot"
    | "shallow-snapshot"
    | "update";
  /**
   * The version vector of the start of the import.
   *
   * Import blob includes all the ops from `partial_start_vv` to `partial_end_vv`.
   * However, it does not constitute a complete version vector, as it only contains counters
   * from peers included within the import blob.
   */
  partialStartVersionVector: VersionVector;
  /**
   * The version vector of the end of the import.
   *
   * Import blob includes all the ops from `partial_start_vv` to `partial_end_vv`.
   * However, it does not constitute a complete version vector, as it only contains counters
   * from peers included within the import blob.
   */
  partialEndVersionVector: VersionVector;

  startFrontiers: OpId[];
  startTimestamp: number;
  endTimestamp: number;
  changeNum: number;
}
