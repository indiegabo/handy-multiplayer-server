import { Connection } from "mongoose";

export abstract class GameDBSeed {
    abstract run(connection: Connection): Promise<void>;
}