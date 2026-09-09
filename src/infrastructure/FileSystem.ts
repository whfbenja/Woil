import * as FileSystem from 'expo-file-system';

export interface FileSystemOperations {
  listFiles(dir: string): Promise<string[]>;
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  deleteFile(path: string): Promise<void>;
  fileExists(path: string): Promise<boolean>;
  createDirectory(path: string): Promise<void>;
}

export class ExpoFileSystem implements FileSystemOperations {
  async listFiles(dir: string): Promise<string[]> {
    const info = await FileSystem.getInfoAsync(dir);
    if (!info.exists) return [];
    const files = await FileSystem.readDirectoryAsync(dir);
    return files;
  }

  async readFile(path: string): Promise<string> {
    return await FileSystem.readAsStringAsync(path);
  }

  async writeFile(path: string, content: string): Promise<void> {
    await FileSystem.writeAsStringAsync(path, content);
  }

  async deleteFile(path: string): Promise<void> {
    await FileSystem.deleteAsync(path, { idempotent: true });
  }

  async fileExists(path: string): Promise<boolean> {
    const info = await FileSystem.getInfoAsync(path);
    return info.exists;
  }

  async createDirectory(path: string): Promise<void> {
    await FileSystem.makeDirectoryAsync(path, { intermediates: true });
  }
}