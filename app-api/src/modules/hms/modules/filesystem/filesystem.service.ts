import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import {
    Dirent,
    Stats,
    promises as fs,
} from 'fs';
import {
    resolve,
    sep,
} from 'path';

@Injectable()
export class FilesystemService {
    /**
     * Resolve a path using process cwd as base.
     */
    resolvePathFromCwd(...segments: string[]): string {
        return resolve(process.cwd(), ...segments);
    }

    /**
     * Resolve a path and ensure it stays inside the informed base.
     */
    resolvePathWithinBase(
        basePath: string,
        ...segments: string[]
    ): string {
        const resolvedBasePath = resolve(basePath);
        const resolvedTargetPath = resolve(
            resolvedBasePath,
            ...segments,
        );

        const isInsideBase =
            resolvedTargetPath === resolvedBasePath ||
            resolvedTargetPath.startsWith(`${resolvedBasePath}${sep}`);

        if (!isInsideBase) {
            throw new BadRequestException(
                'Requested path is outside the configured base directory.',
            );
        }

        return resolvedTargetPath;
    }

    /**
     * Check if a path exists.
     */
    async pathExists(targetPath: string): Promise<boolean> {
        try {
            await fs.access(targetPath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Check if a path exists and is a directory.
     */
    async isDirectory(targetPath: string): Promise<boolean> {
        try {
            const stats = await fs.stat(targetPath);
            return stats.isDirectory();
        } catch {
            return false;
        }
    }

    /**
     * Check if a path exists and is a regular file.
     */
    async isFile(targetPath: string): Promise<boolean> {
        try {
            const stats = await fs.stat(targetPath);
            return stats.isFile();
        } catch {
            return false;
        }
    }

    /**
     * Read a directory with directory entries metadata.
     */
    async readDirectory(targetPath: string): Promise<Dirent[]> {
        const exists = await this.pathExists(targetPath);

        if (!exists) {
            throw new NotFoundException(
                `Directory not found: ${targetPath}`,
            );
        }

        return await fs.readdir(targetPath, { withFileTypes: true });
    }

    /**
     * Read a UTF-8 file from disk.
     */
    async readFileUtf8(filePath: string): Promise<string> {
        const exists = await this.isFile(filePath);

        if (!exists) {
            throw new NotFoundException(`File not found: ${filePath}`);
        }

        return await fs.readFile(filePath, 'utf-8');
    }

    /**
     * Parse a JSON file from disk.
     */
    async readJsonFile<T>(filePath: string): Promise<T> {
        const fileContent = await this.readFileUtf8(filePath);

        try {
            return JSON.parse(fileContent) as T;
        } catch {
            throw new BadRequestException(`Invalid JSON file: ${filePath}`);
        }
    }

    /**
     * Return file stats from disk.
     */
    async getFileStats(filePath: string): Promise<Stats> {
        const exists = await this.isFile(filePath);

        if (!exists) {
            throw new NotFoundException(`File not found: ${filePath}`);
        }

        return await fs.stat(filePath);
    }

    /**
     * Build a deterministic content hash.
     */
    createContentHash(
        content: string | Buffer,
        algorithm: 'sha1' | 'sha256' = 'sha256',
    ): string {
        return createHash(algorithm)
            .update(content)
            .digest('hex');
    }

    /**
     * Build a strong ETag from file content.
     */
    createEtagFromContent(content: string | Buffer): string {
        const hash = this.createContentHash(content, 'sha1');
        return `"${hash}"`;
    }
}
