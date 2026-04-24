import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Media } from './entities/media.entity';
import { MediaAssociation } from './entities/media-association.entity';
import { MediaService } from './services/media.service';
import { StorageModule } from '../storage/storage.module';
import { MediaCollectionsLoader } from './utils/media-collections-loader';

@Module({
    imports: [
        TypeOrmModule.forFeature([Media, MediaAssociation]),
        StorageModule,
    ],
    providers: [
        MediaService,
        MediaCollectionsLoader,
    ],
    exports: [MediaService],
})
export class MediaModule { }