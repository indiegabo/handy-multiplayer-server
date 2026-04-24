import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { UserAuthProvider } from '../entities/user-auth-provider.entity';

@Injectable()
export class UserAuthProviderRepository extends Repository<UserAuthProvider> {
    constructor(
        @InjectDataSource()
        private readonly dataSource: DataSource
    ) {
        super(UserAuthProvider, dataSource.createEntityManager());
    }

    async findById(id: string): Promise<UserAuthProvider | null> {
        return this.findOne({ where: { id } });
    }

}