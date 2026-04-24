import { Injectable } from "@nestjs/common";
import {
    DataSource,
    Repository,
    SelectQueryBuilder,
} from "typeorm";
import { InjectDataSource } from "@nestjs/typeorm";
import { User } from "../entities/user.entity";
import { GetEndUsersFilter } from
    "../payloads/filters/get-end-users.filter";
import { applySortToQB, normalizeSort } from "@hms-module/core/api/sorting/sort.utils";
import { SortRule } from "@hms/shared-types/hms";

/**
 * Maps allowed client fields to fully qualified columns.
 * Keep aliases consistent with the QB ("u" here).
 */
const END_USERS_ALLOWED_SORT = {
    id: "u.id",
    username: "u.username",
    display_name: "u.display_name",
    email: "u.email",
    created_at: "u.created_at",
    updated_at: "u.updated_at",
} as const;

/**
 * Default sorting if client doesn't send sort
 * or only sends unknown fields.
 */
const END_USERS_DEFAULT_SORT: SortRule[] = [
    { field: "created_at", direction: "asc" },
    { field: "username", direction: "asc" },
];

@Injectable()
export class UsersRepository extends Repository<User> {
    constructor(
        @InjectDataSource()
        private readonly dataSource: DataSource,
    ) {
        super(User, dataSource.createEntityManager());
    }

    /**
     * Finds a user by id.
     */
    async findById(id: string): Promise<User | null> {
        return this.findOne({ where: { id } });
    }

    /**
     * Find a user by their email.
     *
     * @param email Email of the user to find.
     * @returns The user if found, or `null` if not.
     */
    async findByEmail(email: string): Promise<User | null> {
        return this.findOne({ where: { email } });
    }

    /**
     * Find a user by their username.
     *
     * @param username Username of the user to find.
     * @returns The user if found, or `null` if not.
     */
    async findByUsername(username: string): Promise<User | null> {
        return this.findOne({ where: { username } });
    }

    /**
     * Find a user by email or username.
     *
     * @param emailOrUsername Email or username of the user.
     * @returns The user if found, or `null` if not.
     */
    async findByEmailOrUsername(
        emailOrUsername: string,
    ): Promise<User | null> {
        return this.findOne({
            where: [
                { email: emailOrUsername },
                { username: emailOrUsername },
            ],
        });
    }

    /**
     * Builds a base query for listing end users with optional filters
     * and normalized multi-column sorting from query (safe whitelist).
     * Uses ILIKE for case-insensitive search (PostgreSQL).
     */
    buildEndUsersListQb(
        filters?: GetEndUsersFilter,
    ): SelectQueryBuilder<User> {
        const qb = this.createQueryBuilder("u");

        // Only end users live in this table;

        if (filters?.username) {
            qb.andWhere("u.username ILIKE :username", {
                username: `%${filters.username}%`,
            });
        }

        if (filters?.term) {
            qb.andWhere(
                "(u.username ILIKE :term OR u.display_name ILIKE :term)",
                { term: `%${filters.term}%` },
            );
        }

        // Apply normalized sorting (whitelist + fallback).
        const normalizedSort = normalizeSort(
            filters?.sort,
            END_USERS_ALLOWED_SORT,
            END_USERS_DEFAULT_SORT,
        );
        applySortToQB(qb, normalizedSort);

        return qb;
    }
}
