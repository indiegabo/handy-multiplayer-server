import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

import { AuthZService } from '@src/modules/hms/modules/auth/services/authz.service';
import { UsersService } from '@src/modules/hms/modules/users/services/users.service';
import { BetterLogger } from '@hms-module/modules/better-logger/better-logger.service';

describe('AuthZService', () => {
    let service: AuthZService;

    let jwtService: jest.Mocked<JwtService>;
    let configService: jest.Mocked<ConfigService>;
    let usersService: jest.Mocked<UsersService>;
    let logger: jest.Mocked<BetterLogger>;

    beforeEach(() => {
        jwtService = {
            verify: jest.fn(),
        } as any;

        configService = {
            get: jest.fn().mockReturnValue('test-secret'),
        } as any;

        usersService = {
            getUserByType: jest.fn(),
        } as any;

        logger = {
            setContext: jest.fn(),
            warn: jest.fn(),
        } as any;

        service = new AuthZService(
            jwtService,
            configService,
            usersService,
            logger,
        );
    });

    it('should throw 401 with signature_invalid code when jwt signature is invalid', async () => {
        const request = {
            headers: {
                authorization: 'Bearer bad-token',
            },
        } as any;

        jwtService.verify.mockImplementation(() => {
            throw new JsonWebTokenError('invalid signature');
        });

        await expect(service.verifyAndGetUser(request)).rejects.toBeInstanceOf(
            UnauthorizedException,
        );

        await service.verifyAndGetUser(request).catch((error: UnauthorizedException) => {
            expect(error.getStatus()).toBe(401);
            expect(error.getResponse()).toEqual({
                message: 'Invalid token signature',
                code: 'signature_invalid',
            });
        });
    });

    it('should throw 401 with token_expired code when jwt token expired', async () => {
        const request = {
            headers: {
                authorization: 'Bearer expired-token',
            },
        } as any;

        jwtService.verify.mockImplementation(() => {
            throw new TokenExpiredError('jwt expired', new Date('2026-04-04T00:00:00.000Z'));
        });

        await service.verifyAndGetUser(request).catch((error: UnauthorizedException) => {
            expect(error.getStatus()).toBe(401);
            expect(error.getResponse()).toEqual({
                message: 'Token expired',
                code: 'token_expired',
            });
        });
    });

    it('should return authenticated user when jwt is valid', async () => {
        const request = {
            headers: {
                authorization: 'Bearer valid-token',
            },
            deviceInfo: {
                ip: '127.0.0.1',
                os: 'linux',
                browser: 'chrome',
                deviceType: 'desktop',
            },
        } as any;

        jwtService.verify.mockReturnValue({
            sub: 'user-id',
            email: 'user@test.com',
            user_type: 'end_user',
        } as any);

        const user = {
            id: 'user-id',
            email: 'user@test.com',
        } as any;

        usersService.getUserByType.mockResolvedValue(user);

        const result = await service.verifyAndGetUser(request);

        expect(result).toEqual(user);
        expect(usersService.getUserByType).toHaveBeenCalledWith(
            'user-id',
            'end_user',
        );
    });
});
