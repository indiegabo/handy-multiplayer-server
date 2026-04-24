import { Injectable } from '@nestjs/common';
import { DataSource, LessThan, Repository } from 'typeorm';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';

@Injectable()
export class RefreshTokenRepository extends Repository<RefreshToken> {
    constructor(
        @InjectDataSource()
        private readonly dataSource: DataSource
    ) {
        super(RefreshToken, dataSource.createEntityManager());
    }

    async findByToken(token: string): Promise<RefreshToken | null> {
        return this.findOne({ where: { token } });
    }

    async deleteExpiredTokens(): Promise<void> {
        await this.delete({ expires_at: LessThan(new Date()) });
    }
}

