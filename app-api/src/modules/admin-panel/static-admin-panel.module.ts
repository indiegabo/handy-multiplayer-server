// admin-panel/static-admin-panel.module.ts
import { DynamicModule, Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import * as fs from 'fs';

@Module({})
export class StaticAdminPanelModule {
    static register(): DynamicModule {
        const enable =
            process.env.APP_ENVIRONMENT === 'staging' ||
            process.env.APP_ENVIRONMENT === 'production' ||
            process.env.NODE_ENV === 'production';

        const rootPath = join(process.cwd(), 'public', 'admin');
        const exists = fs.existsSync(rootPath);

        if (!enable || !exists) {
            return { module: StaticAdminPanelModule };
        }

        return {
            module: StaticAdminPanelModule,
            imports: [
                ServeStaticModule.forRoot({
                    rootPath,
                    serveRoot: '/admin-panel',
                    useGlobalPrefix: false,
                    // Evita '*' puro; usa wildcard nomeado compatível com path-to-regexp v6
                    renderPath: '*path',
                    serveStaticOptions: {
                        fallthrough: true,
                        index: 'index.html',
                        cacheControl: true,
                        etag: true,
                        lastModified: true,
                    },
                }),
            ],
        };
    }
}
