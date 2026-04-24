import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { ScopedToken } from '../entities/scoped-token.entity';

const PREFIX_LENGTH = 6;
const BODY_LENGTH = 32;
const SUFFIX_LENGTH = 4;
const SEPARATOR = '.';

@Injectable()
export class ScopedTokenRepository extends Repository<ScopedToken> {
    constructor(
        @InjectDataSource()
        private readonly dataSource: DataSource
    ) {
        super(ScopedToken, dataSource.createEntityManager());
    }

    async findByToken(token: string): Promise<ScopedToken | null> {
        return this.findOne({ where: { token } });
    }

    async createWithData(
        scopes: string[] = [],
        data: any,
    ): Promise<ScopedToken> {
        let token: string;
        let existingToken: ScopedToken | null;

        // Keep generating tokens until we find a unique one
        do {
            const tokenBody = randomBytes(BODY_LENGTH).toString('hex');
            const prefix = randomBytes(PREFIX_LENGTH).toString('hex').toUpperCase();
            const suffix = randomBytes(SUFFIX_LENGTH).toString('hex').toUpperCase();
            token = `${prefix}${SEPARATOR}${tokenBody}${SEPARATOR}${suffix}`;
            existingToken = await this.findOne({ where: { token } });
        } while (existingToken);

        const scopableToken = this.create({
            token,
            data,
            scopes,
        });

        return this.save(scopableToken);
    }

    async revoke(token: string): Promise<void> {
        await this.update({ token }, { revoked_at: new Date() });
    }

    async isValid(token: string): Promise<boolean> {
        const scopableToken = await this.findByToken(token);
        return !!scopableToken && !scopableToken.revoked_at;
    }

    async destroy(token: string): Promise<void> {
        await this.delete({ token });
    }

    async hasScope(token: string, scope: string): Promise<boolean> {
        const scopableToken = await this.findByToken(token);
        return scopableToken?.scopes.includes(scope) ?? false;
    }

    async hasAnyScope(token: string, scopes: string[]): Promise<boolean> {
        const scopableToken = await this.findByToken(token);
        return scopes.some(scope => scopableToken?.scopes.includes(scope)) ?? false;
    }

    async hasAllScopes(token: string, scopes: string[]): Promise<boolean> {
        const scopableToken = await this.findByToken(token);
        return scopes.every(scope => scopableToken?.scopes.includes(scope)) ?? false;
    }

    getPartialView(token: string): string {
        const [prefix, , suffix] = token.split(SEPARATOR);
        return `${prefix}...${suffix}`;
    }
}