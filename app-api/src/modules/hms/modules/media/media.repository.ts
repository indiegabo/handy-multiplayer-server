import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Media } from './entities/media.entity';

@Injectable()
export class MediaRepository {
    constructor(
        @InjectRepository(Media)
        private mediaRepository: Repository<Media>,
    ) { }

    async findById(id: string): Promise<Media | null> {
        return this.mediaRepository.findOne({ where: { id } });
    }

    async create(mediaData: Partial<Media>): Promise<Media> {
        const media = this.mediaRepository.create(mediaData);
        return this.mediaRepository.save(media);
    }

    async save(media: Media): Promise<Media> {
        return this.mediaRepository.save(media);
    }

    async delete(id: string): Promise<void> {
        await this.mediaRepository.delete({ id });
    }

    async findByFilename(filename: string): Promise<Media | null> {
        return this.mediaRepository.findOne({ where: { filename } });
    }

    async findByUrl(url: string): Promise<Media | null> {
        // The DB no longer stores an explicit `url` column. We persist the
        // storage key in `metadata.file_key` and (optionally) a public URL in
        // `metadata.public_url`. Search both fields for compatibility.
        const qb = this.mediaRepository.createQueryBuilder('m');
        qb.where("m.metadata ->> 'file_key' = :v", { v: url })
            .orWhere("m.metadata ->> 'public_url' = :v", { v: url });
        const found = await qb.getOne();
        return found ?? null;
    }

    async findAllByType(type: 'image' | 'video' | 'audio' | 'document'): Promise<Media[]> {
        return this.mediaRepository.find({ where: { type } });
    }
}