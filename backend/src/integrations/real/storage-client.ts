import type { StorageClient } from "../types.js";

export class RealStorageClient implements StorageClient {
  async getPublicUrl(_path: string): Promise<string> {
    throw new Error("TODO: implement real Storage integration");
  }
}
