import { DataSource, DataSourceOptions } from "typeorm";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";
import type { MongooseModuleFactoryOptions } from "@nestjs/mongoose";
import * as dotenv from "dotenv";
import { join } from "path";

// src/config/hms/database.config.ts
dotenv.config();
/* ─────────────────────────────────────────────────────────────────────
 * PostgreSQL (Main) — TypeORM DataSource
 * ──────────────────────────────────────────────────────────────────── */

/**
 * Parses a boolean-like environment variable.
 * Accepts: "1", "true", "yes", "on" (case-insensitive).
 * Falls back to the provided defaultValue when unset.
 *
 * @param envName Environment var name.
 * @param defaultValue Default boolean when unset.
 * @returns Parsed boolean value.
 */
function parseEnvFlag(envName: string, defaultValue: boolean): boolean {
    const raw = process.env[envName];
    if (!raw) return defaultValue;

    const v = String(raw).trim().toLowerCase();
    return ["1", "true", "yes", "on"].includes(v);
}

const mainDBTypeOrm: DataSourceOptions = {
    type: "postgres",
    host: process.env.DB_MAIN_HOST || "hms-db-main",
    port: parseInt(process.env.DB_MAIN_PORT || "5432", 10),
    database: process.env.DB_MAIN_DATABASE || "hms_main",
    username: process.env.DB_MAIN_USERNAME || "hms_main_manager",
    password: process.env.DB_MAIN_PASSWORD || "password",
    schema: "public",
    entities: [join(__dirname, "../../**/*.entity{.ts,.js}")],
    synchronize: false,
    migrationsRun: false,
    logging: process.env.DB_MAIN_SHOULD_LOG === "yes",
    namingStrategy: new SnakeNamingStrategy(),
    migrations: [join(__dirname, "../../database/migrations/**/*{.ts,.js}")],
    extra: {
        max: 20,
        connectionTimeoutMillis: 5000,
    },
};

/* ─────────────────────────────────────────────────────────────────────
 * MongoDB (Games) — Optional Mongoose connection
 * ──────────────────────────────────────────────────────────────────── */

/**
 * Indicates whether the optional MongoDB connection should be enabled.
 * Controlled by DB_GAME_ENABLED. Defaults to false (disabled).
 */
export const MONGO_ENABLED: boolean = parseEnvFlag(
    "DB_GAME_ENABLED",
    false
);

/**
 * Builds a Mongo connection URI from environment variables.
 * Supports full override via DB_GAME_URI or component-based assembly.
 *
 * @returns Mongo connection URI.
 */
export function buildMongoUri(): string {
    const full = process.env.DB_GAME_URI;
    if (full && full.trim().length > 0) {
        return full.trim();
    }

    const host = process.env.DB_GAME_HOST || "hms-db-game";
    const port = process.env.DB_GAME_PORT || "27017";
    const db = process.env.DB_GAME_DATABASE || "games_db";
    const user = process.env.DB_GAME_USERNAME || "";
    const pass = process.env.DB_GAME_PASSWORD || "";
    const opts = process.env.DB_GAME_OPTIONS || ""; // e.g., "replicaSet=rs0"

    const hasAuth = user.trim().length > 0 && pass.trim().length > 0;
    const credentials = hasAuth ? `${user}:${pass}@` : "";
    const query = opts ? `?${opts}` : "";

    return `mongodb://${credentials}${host}:${port}/${db}${query}`;
}

/**
 * Factory to produce Mongoose root options based on ConfigService
 * while remaining easily togglable. Only used when MONGO_ENABLED is true.
 *
 * @returns Root options for MongooseModule.forRootAsync.
 */
export function mongooseRootFactory(): MongooseModuleFactoryOptions {
    const uri = buildMongoUri();
    const hasAuth = uri.includes("@");
    const replicaSet = process.env.DB_GAME_REPLICA_SET || undefined;

    return {
        uri,
        ...(hasAuth
            ? { authSource: process.env.DB_GAME_AUTHSOURCE || "admin" }
            : {}),
        ...(replicaSet ? { replicaSet } : {}),
        retryAttempts: 5,
        retryDelay: 1000,
    };
}

export const DB_CONFIG = {
    sources: {
        main: new DataSource(mainDBTypeOrm),
        // Note: Mongo config remains available but is opt-in via MONGO_ENABLED.
        game: { uri: buildMongoUri() },
    },
};

export const cli = {
    migrationsDir: "src/database/migrations",
};
