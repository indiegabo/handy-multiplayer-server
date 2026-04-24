import { Injectable } from '@nestjs/common';
import {
    DataSource,
    Repository,
    SelectQueryBuilder,
} from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

import { AdminUser } from '../entities/admin-user.entity';
import { GetAdminUsersFilter } from
    '../payloads/filters/get-admin-users.filter';
import { applySortToQB, normalizeSort } from
    '@hms-module/core/api/sorting/sort.utils';
import { SortRule } from "@hms/shared-types/hms";

const ADMIN_USERS_ALLOWED_SORT = {
    id: 'au.id',
    email: 'au.email',
    name: 'au.name',
    is_owner: 'au.is_owner',
    became_owner_at: 'au.became_owner_at',
    created_at: 'au.created_at',
    updated_at: 'au.updated_at',
} as const;

const ADMIN_USERS_DEFAULT_SORT: SortRule[] = [
    { field: 'created_at', direction: 'asc' },
    { field: 'email', direction: 'asc' },
];

@Injectable()
export class AdminUsersRepository extends Repository<AdminUser> {
    constructor(
        @InjectDataSource()
        private readonly dataSource: DataSource,
    ) {
        super(AdminUser, dataSource.createEntityManager());
    }

    async findById(id: string): Promise<AdminUser | null> {
        return this.findOne({ where: { id } });
    }

    async findByEmail(email: string): Promise<AdminUser | null> {
        return this.findOne({ where: { email } });
    }

    /**
     * Builds query for listing admin users with filters and safe sorting.
     */
    buildAdminUsersListQb(
        filters?: GetAdminUsersFilter,
    ): SelectQueryBuilder<AdminUser> {
        const qb = this.createQueryBuilder('au');

        if (filters?.term) {
            qb.andWhere(
                '(au.name ILIKE :term)',
                { term: `%${filters.term}%` },
            );
        }

        const normalizedSort = normalizeSort(
            filters?.sort,
            ADMIN_USERS_ALLOWED_SORT,
            ADMIN_USERS_DEFAULT_SORT,
        );
        applySortToQB(qb, normalizedSort);

        return qb;
    }
}
