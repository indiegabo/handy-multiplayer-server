import { Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { BetterLogger } from "@hms-module/modules/better-logger/better-logger.service";
import { ScopedTokenRepository } from "./scoped-tokens.repository";
import { ScopedToken } from "./entities/scoped-token.entity";

@Injectable()
export class ScopedTokensService {
    constructor(
        private readonly logger: BetterLogger,
        private readonly scopedTokenRepository: ScopedTokenRepository,
    ) {
        this.logger.setContext(ScopedTokensService.name);
    }

    async createWithData(scopes: string[] = [], creatorId: string, data?: any): Promise<ScopedToken> {
        try {
            return this.scopedTokenRepository.manager.transaction(async (manager) => {
                const transactionalRepo = manager.withRepository(this.scopedTokenRepository);
                return transactionalRepo.createToken(scopes, creatorId, data);
            });
        } catch (error) {
            this.logger.error('Transaction failed', error.stack);
            throw new InternalServerErrorException('Failed to create token');
        }
    }

    async revokeToken(tokenId: string, revokerId: string): Promise<void> {
        const token = await this.scopedTokenRepository.findByToken(tokenId);

        if (!token) {
            throw new NotFoundException(`Token with ID '${tokenId}' not found.`);
        }

        try {
            return this.scopedTokenRepository.manager.transaction(async (manager) => {
                const transactionalRepo = manager.withRepository(this.scopedTokenRepository);
                await transactionalRepo.revoke(tokenId, revokerId);
            });
        } catch (error) {
            this.logger.error(`Transaction failed for token ${tokenId}`, error.stack);
            throw new InternalServerErrorException('Failed to revoke token');
        }
    }

    async findActiveByCreator(creatorId: string): Promise<ScopedToken[]> {
        return this.scopedTokenRepository.findActiveByCreator(creatorId);
    }
}
