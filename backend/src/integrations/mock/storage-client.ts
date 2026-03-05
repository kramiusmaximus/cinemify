import type { StorageClient } from "../types.js";

export class MockStorageClient implements StorageClient {
  async getPublicUrl(path: string): Promise<string> {
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }

    return `https://mock.storage.local/${path.replace(/^\/+/, "")}`;
  }
}
