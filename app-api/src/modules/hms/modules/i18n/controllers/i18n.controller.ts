import {
    Controller,
    Get,
    HttpStatus,
    Param,
    Req,
    Res,
    UsePipes,
    ValidationPipe,
    Version,
} from '@nestjs/common';
import {
    ApiOkResponse,
    ApiOperation,
    ApiTags,
} from '@nestjs/swagger';
import { ApiResponse } from '@hms/shared-types/hms';
import { Request, Response } from 'express';
import { responser } from '@hms-module/core/utils/response.util';
import { GetI18nBundleParamsDto } from '../dto/get-i18n-bundle-params.dto';
import { GetI18nUniverseParamsDto } from '../dto/get-i18n-universe-params.dto';
import { I18nService } from '../services/i18n.service';
import {
    I18nBundlePayload,
    I18nManifest,
    I18nUniverseBundlesPayload,
} from '../types/i18n.types';

@ApiTags('I18n')
@Controller('i18n')
export class I18nController {
    constructor(
        private readonly i18nService: I18nService,
    ) { }

    @Get('manifest')
    @Version(['1'])
    @ApiOperation({ summary: 'Get ecosystem i18n manifest' })
    @ApiOkResponse({ description: 'Localization manifest from /src/i18n.' })
    async getManifest(
        @Req() request: Request,
        @Res({ passthrough: true }) response: Response,
    ): Promise<ApiResponse<I18nManifest> | void> {
        const manifest = await this.i18nService.getManifest();

        response.setHeader('ETag', manifest.etag);
        response.setHeader(
            'Cache-Control',
            this.i18nService.getManifestCacheControl(),
        );

        const isNotModified = this.i18nService.matchesIfNoneMatch(
            request.headers['if-none-match'],
            manifest.etag,
        );

        if (isNotModified) {
            response.status(HttpStatus.NOT_MODIFIED);
            return;
        }

        return responser.data(manifest.manifest);
    }

    @Get(':locale/:moduleName/:universe')
    @Version(['1'])
    @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
    @ApiOperation({
        summary: 'Get all namespace bundles from a universe',
    })
    @ApiOkResponse({
        description: 'Aggregated namespace payloads for one universe.',
    })
    async getUniverseBundles(
        @Param() params: GetI18nUniverseParamsDto,
        @Req() request: Request,
        @Res({ passthrough: true }) response: Response,
    ): Promise<ApiResponse<I18nUniverseBundlesPayload> | void> {
        const universeBundles = await this.i18nService.getUniverseBundles(
            params.locale,
            params.moduleName,
            params.universe,
        );

        response.setHeader('ETag', universeBundles.etag);
        response.setHeader(
            'Cache-Control',
            this.i18nService.getBundleCacheControl(),
        );

        const isNotModified = this.i18nService.matchesIfNoneMatch(
            request.headers['if-none-match'],
            universeBundles.etag,
        );

        if (isNotModified) {
            response.status(HttpStatus.NOT_MODIFIED);
            return;
        }

        return responser.data(universeBundles.payload);
    }

    @Get(':locale/:moduleName/:universe/:namespace')
    @Version(['1'])
    @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
    @ApiOperation({
        summary: 'Get i18n bundle by locale/module/universe/namespace',
    })
    @ApiOkResponse({
        description: 'Bundle payload for any module under /src/i18n/<module>.',
    })
    async getBundle(
        @Param() params: GetI18nBundleParamsDto,
        @Req() request: Request,
        @Res({ passthrough: true }) response: Response,
    ): Promise<ApiResponse<I18nBundlePayload> | void> {
        const bundle = await this.i18nService.getBundle(
            params.locale,
            params.moduleName,
            params.universe,
            params.namespace,
        );

        response.setHeader('ETag', bundle.etag);
        response.setHeader(
            'Cache-Control',
            this.i18nService.getBundleCacheControl(),
        );

        const isNotModified = this.i18nService.matchesIfNoneMatch(
            request.headers['if-none-match'],
            bundle.etag,
        );

        if (isNotModified) {
            response.status(HttpStatus.NOT_MODIFIED);
            return;
        }

        return responser.data(bundle.payload);
    }
}
