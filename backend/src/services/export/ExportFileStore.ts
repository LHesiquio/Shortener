import { access, mkdir, unlink, writeFile } from 'fs/promises';
import path from 'path';
import { env } from '@config/env';

const STORAGE_DIR = path.resolve(process.cwd(), env.EXPORT_STORAGE_DIR);

/**
 * Local-disk storage for generated export files.
 *
 * Files are keyed by job id (e.g. "64f...c1.csv") so concurrent exports of the
 * same shortlink never collide. The original, user-facing filename lives in the
 * database and is only used for the Content-Disposition header.
 */
export const ExportFileStore = {
  get directory(): string {
    return STORAGE_DIR;
  },

  async save(storedName: string, data: Buffer | string): Promise<number> {
    await ensureDirectory();
    const buffer = typeof data === 'string' ? Buffer.from(data, 'utf-8') : data;
    await writeFile(path.resolve(STORAGE_DIR, storedName), buffer);
    return buffer.byteLength;
  },

  resolve(storedName: string): string {
    return path.resolve(STORAGE_DIR, storedName);
  },

  async exists(storedName: string): Promise<boolean> {
    try {
      await access(path.resolve(STORAGE_DIR, storedName));
      return true;
    } catch {
      return false;
    }
  },

  async remove(storedName: string): Promise<void> {
    try {
      await unlink(path.resolve(STORAGE_DIR, storedName));
    } catch {
      // File already gone — nothing to clean up.
    }
  },
};

async function ensureDirectory(): Promise<void> {
  await mkdir(STORAGE_DIR, { recursive: true });
}
