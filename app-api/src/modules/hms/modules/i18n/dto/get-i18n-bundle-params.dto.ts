import {
    IsString,
    Matches,
    MaxLength,
} from 'class-validator';

const LOCALE_PATTERN = /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/;
const SEGMENT_PATTERN = /^[A-Za-z0-9._-]+$/;

export class GetI18nBundleParamsDto {
    @IsString()
    @MaxLength(32)
    @Matches(LOCALE_PATTERN)
    locale: string;

    @IsString()
    @MaxLength(64)
    @Matches(SEGMENT_PATTERN)
    moduleName: string;

    @IsString()
    @MaxLength(64)
    @Matches(SEGMENT_PATTERN)
    universe: string;

    @IsString()
    @MaxLength(128)
    @Matches(SEGMENT_PATTERN)
    namespace: string;
}
