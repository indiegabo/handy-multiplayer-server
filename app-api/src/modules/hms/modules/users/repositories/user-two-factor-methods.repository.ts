import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { UserTwoFactorMethod } from '../entities/user-two-factor-method.entity';
import { TwoFactorMethod } from '../../auth/types/two-factor-method.type';

@Injectable()
export class UserTwoFactorMethodsRepository extends Repository<UserTwoFactorMethod> {
    constructor(
        @InjectDataSource()
        private readonly dataSource: DataSource
    ) {
        super(UserTwoFactorMethod, dataSource.createEntityManager());
    }

    async findUser2FAMethod(
        userId: string,
        userType: 'end_user' | 'admin',
        methodType: TwoFactorMethod
    ): Promise<UserTwoFactorMethod | null> {
        return this.findOne({
            where: {
                user_id: userId,
                user_type: userType,
                method_type: methodType
            }
        });
    }

    async update2FAMethod(
        methodId: number,
        updateData: Partial<UserTwoFactorMethod>
    ): Promise<void> {
        await this.update(methodId, updateData);
    }
}