import { BadRequestException } from '@nestjs/common';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { FilesystemService }
    from '@hms-module/modules/filesystem/filesystem.service';

describe('FilesystemService', () => {
    let service: FilesystemService;
    let tempRootPath: string;

    beforeEach(async () => {
        service = new FilesystemService();
        tempRootPath = await fs.mkdtemp(join(tmpdir(), 'hms-fs-'));
    });

    afterEach(async () => {
        await fs.rm(tempRootPath, {
            recursive: true,
            force: true,
        });
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should resolve a path inside the informed base directory', () => {
        const resolvedPath = service.resolvePathWithinBase(
            tempRootPath,
            'sg',
            'launcher',
            'auth.json',
        );

        expect(resolvedPath.startsWith(tempRootPath)).toBe(true);
    });

    it('should throw when path traversal escapes the base directory', () => {
        expect(() => {
            service.resolvePathWithinBase(
                tempRootPath,
                '..',
                'escape.json',
            );
        }).toThrow(BadRequestException);
    });

    it('should read and parse a json file', async () => {
        const filePath = join(tempRootPath, 'sample.json');

        await fs.writeFile(
            filePath,
            JSON.stringify({
                key: 'value',
            }),
            'utf-8',
        );

        const parsedFile = await service.readJsonFile<{ key: string }>(filePath);

        expect(parsedFile).toEqual({ key: 'value' });
    });
});
