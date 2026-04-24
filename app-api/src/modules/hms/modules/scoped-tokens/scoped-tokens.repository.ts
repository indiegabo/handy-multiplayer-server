// scoped-tokens.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ScopedToken } from './entities/scoped-token.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ScopedTokenRepository extends Repository<ScopedToken> {
    constructor(
        @InjectDataSource()
        private readonly dataSource: DataSource
    ) {
        super(ScopedToken, dataSource.createEntityManager());
    }

    async findById(id: string): Promise<ScopedToken | null> {
        return this.findOne({ where: { id } });
    }

    async findByToken(token: string): Promise<ScopedToken | null> {
        return this.findOne({ where: { token } });
    }

    async createToken(scopes: string[], creatorId: string, data?: any): Promise<ScopedToken> {
        const token = new ScopedToken();
        token.token = uuidv4();
        token.scopes = scopes;
        token.creator_id = creatorId;
        token.data = data || {};

        return this.save(token);
    }

    async revoke(tokenId: string, revokerId: string): Promise<ScopedToken> {
        const token = await this.findByToken(tokenId);
        if (!token) {
            throw new Error('Token not found');
        }

        token.revoked_at = new Date();
        token.revoker_id = revokerId;
        return this.save(token);
    }

    async findActiveByCreator(creatorId: string): Promise<ScopedToken[]> {
        return this.find({
            where: {
                creator_id: creatorId,
                revoked_at: null,
            },
        });
    }
}