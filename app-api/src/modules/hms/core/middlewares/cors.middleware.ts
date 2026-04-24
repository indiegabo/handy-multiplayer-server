import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class CorsMiddleware implements NestMiddleware {
    private readonly logger = new Logger(CorsMiddleware.name);

    constructor(
        private readonly configService: ConfigService,
    ) { }

    use(req: Request, res: Response, next: NextFunction) {
        // First, we set all the necessary CORS headers
        this.setBaseCorsHeaders(req, res);

        // For OPTIONS (preflight) requests, respond immediately
        if (req.method === 'OPTIONS') {
            return res.status(204).end(); // 204 is more appropriate for OPTIONS
        }

        return next();
    }

    private setBaseCorsHeaders(req: Request, res: Response) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Vary', 'Origin');
    }
}
