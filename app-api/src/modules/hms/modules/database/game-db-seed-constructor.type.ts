import { GameDBSeed } from "./game-db-seed.interface";

export type GameDBSeedConstructor = new (
    ...args: any[]
) => GameDBSeed;