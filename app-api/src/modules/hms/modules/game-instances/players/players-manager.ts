import { Delay } from "@hms-module/core/utils/delay";
import { PlayerJoinFailedException } from "../exceptions/player-join-failed.exception";
import { GameInstance } from "../game-instance";
import { HMSUser, Player } from "./player";
import { Subject } from "rxjs";
import { GAME_INSTANCES_CONFIG } from "@src/config/hms/game-instances.config";

export enum PlayerEntryStatus {
    TryingToJoin,
    Joined,
    Disconnected,
    Left,
    TimedOut,
    Removed,
}

type HMSUserID = {
    identifier: string;
    hmsPlayerID: number;
};

type PlayerEntry = {
    hmsUser: HMSUserID;
    player: Player;
    status: PlayerEntryStatus;
    joinedAt?: Date;
    leftAt?: Date;
    disconnectedAt?: Date;
};

type PlayerJoinedPayload = {
    identifier: string;
    bridgeToken: string;
};

type PlayerLeftPayload = {
    hsmPlayerID: number;
};

type PlayerConnectionLostPayload = {
    hsmPlayerID: number;
};

type PlayerConnectionRestabilishedPayload = {
    hsmPlayerID: number;
};

type PlayerStatusChangedEvent = {
    hsmPlayerID: number;
    newStatus: PlayerEntryStatus;
}

const enum PlayerManagementEvents {
    JoinStart = "player-join-start",
    JoinTimedOut = "player-join-timed-out",
    Joined = "player-joined",
    ConnectionLost = "player-connection-lost",
    ConnectionRestabilished = "player-connection-restabilished",
    Left = "player-left",
}

export class PlayersManager {
    /**
     * A map of bridge tokens to player entries that are trying to join the HMS-GAME-INSTANCE.
     * The bridge token is used to identify the player in the join process.
     */
    private _playersTryingToJoin: Map<string, PlayerEntry> = new Map<string, PlayerEntry>();

    /**
     * A map of hmsPlayerID's to player entries that are currently joined to the game instance.
     */
    private _joinedPlayers: Map<number, PlayerEntry> = new Map<number, PlayerEntry>();

    /**
     * A map of hmsPlayerID's to player entries that have been disconnected from the game instance.
     */
    private _disconnectedPlayers: Map<number, PlayerEntry> = new Map<number, PlayerEntry>();

    /**
     * The next hmsPlayerID to be used for a new player.
     */
    private _nextHMSPlayerID: number = 1;

    /**
     * A map of player email addresses to player entries.
     */
    private _players: Map<string, PlayerEntry> = new Map<string, PlayerEntry>();

    /**
     * A subject that emits every time a player's status changes.
     * This is used to notify other parts of the system when a player's status changes.
     */
    private _playerStatusChanged$: Subject<PlayerStatusChangedEvent> = new Subject<PlayerStatusChangedEvent>();

    /**
     * An observable that emits every time a player's status changes.
     * This is a public API that can be used to observe player status changes.
     */
    public playerStatusChanged$ = this._playerStatusChanged$.asObservable();

    constructor(private _gameInstance: GameInstance) {
        this._nextHMSPlayerID = this.initializeNextHMSPlayerID();
        this._gameInstance.instanceSocket.on(
            PlayerManagementEvents.Joined,
            (payload: PlayerJoinedPayload) => this.handlePlayerJoinedEvent(payload)
        );
        this._gameInstance.instanceSocket.on(
            PlayerManagementEvents.Left,
            (payload: PlayerLeftPayload) => this.handlePlayerLeftEvent(payload)
        );
        this._gameInstance.instanceSocket.on(
            PlayerManagementEvents.ConnectionLost,
            (payload: PlayerConnectionLostPayload) => this.handlePlayerConnectionLostEvent(payload)
        );
        this._gameInstance.instanceSocket.on(
            PlayerManagementEvents.ConnectionRestabilished,
            (payload: PlayerConnectionRestabilishedPayload) => this.handlePlayerConnectionRestabilishedEvent(payload)
        );
    }

    get gameInstance(): GameInstance {
        return this._gameInstance;
    }

    /**
     * Starts the process of a player joining the game.
     * Generates a unique bridgeToken and sends it to the HMS-GAME-INSTANCE. 
     * The HMS-GAME-CLIENT should then connect to the game instance directly using the returned bridgeToken.
     * @param user The user object.
     * @returns A promise that resolves with an object containing the bridgeToken
     * and the player object.
     */
    async startPlayerJoinProcess(
        user: HMSUser
    ): Promise<{ bridgeToken: string; player: Player }> {
        if (!user || !user.id) {
            this.gameInstance.logger?.error("Invalid user object.");
            return null;
        }

        // Case the user already joined the game at some point we use that same player entry.
        // Otherwise we create a new player entry.
        let entry = this._players.get(user.username);
        if (entry) {
            entry.status = PlayerEntryStatus.TryingToJoin;
        } else {
            entry = {
                hmsUser: {
                    identifier: user.username,
                    hmsPlayerID: this.generateUniqueNetworkId(),
                },
                player: {
                    user: user,
                },
                status: PlayerEntryStatus.TryingToJoin,
            } as PlayerEntry;
        }

        // Generate bridgeToken
        const bridgeToken = this.generateBridgeToken();

        // This is a synchrounous call to HMS-GAME-INSTANCE to start the player join process
        const result = await this.gameInstance.dispatchToInstanceAsync(
            PlayerManagementEvents.JoinStart,
            {
                bridgeToken,
                entry,
            }
        );

        if (!result.success) {
            this.gameInstance.logger?.error("Failed to start player join process.");
            this.gameInstance.logger?.error(result.error);
            throw new PlayerJoinFailedException(
                `Instance did not respond to ${PlayerManagementEvents.JoinStart}.`
            );
        }

        // At any time, if the HMS-GAME-INSTANCE, returns succes to the player-join-start event,
        // they will be forever in the the _player map under some status.
        this._players.set(entry.player.user.username, entry);

        this._playersTryingToJoin.set(bridgeToken, entry);

        // After the player-join-start event has been sent to HMS-GAME-INSTANCE,
        // we wait for the player to actually join the game. If the player
        // doesn't join in the specified amount of time, we timeout the join
        // process and remove the player from the _playersTryingToJoin map.
        const joinTimeout = GAME_INSTANCES_CONFIG.players.joinTimeout;
        Delay.for(joinTimeout).promise.then(() => {
            // Check if the player is still in the _playersTryingToJoin map
            if (!this._playersTryingToJoin.has(bridgeToken)) return;

            // Retrieve the player entry
            const entry = this._playersTryingToJoin.get(bridgeToken);

            // Set the status of the player to 'TimedOut'
            entry.status = PlayerEntryStatus.TimedOut;

            // Remove the player from the _playersTryingToJoin map
            this._playersTryingToJoin.delete(bridgeToken);

            // Send a message to the game instance to notify about the timeout
            // so it can clean up the player
            this._gameInstance.dispatchToInstance(
                PlayerManagementEvents.JoinTimedOut,
                { bridgeToken }
            );

            // Log a warning message about the timeout
            this.gameInstance.logger?.warn(
                `Player with hmsPlayerID ${entry.hmsUser.hmsPlayerID} did not join in ${joinTimeout / 1000} seconds.`
            );
        });

        return { bridgeToken: bridgeToken, player: entry.player };
    }

    /**
    * Retrieves a player by their hmsPlayerID.
    *
    * @throws Error if no player with the given hmsPlayerID exists.
    * @returns The player with the given hmsPlayerID.
    */
    getPlayer(hmsPlayerID: number): Player {
        if (!this._joinedPlayers.has(hmsPlayerID)) {
            throw new Error(`Player with hmsPlayerID ${hmsPlayerID} not found`);
        }
        return this._joinedPlayers.get(hmsPlayerID).player;
    }

    getPlayerByEmail(email: string): Player | undefined {
        return this._players.get(email)?.player;
    }

    /**
     * Retrieves all players that are currently joined to the game instance.
     *
     * @returns An array of all players that are currently joined to the game instance.
     */
    getAllJoinedPlayers(): Player[] {
        return Array.from(this._joinedPlayers.values()).map((entry) => entry.player);
    }

    /**
     * Removes a player from the game instance.
     *
     * @param email The email of the player to remove.
     * @param reason The reason for the removal.
     * @returns true if the player was successfully removed, false otherwise.
     */
    async removePlayer(email: string, reason: string): Promise<boolean> {
        const playerEntry = this._players.get(email);
        if (!playerEntry) {
            return true;
        }

        // Send a message to the game instance to remove the player
        const result = await this.gameInstance.dispatchToInstanceAsync('remove-player', playerEntry.hmsUser);

        if (result.success) {
            // Remove the player from the joined players list
            this._joinedPlayers.delete(playerEntry.hmsUser.hmsPlayerID);
            // Set the status of the player to 'Removed'
            playerEntry.status = PlayerEntryStatus.Removed;
            // TODO: Set the reason for the removal
        }

        return result.success;
    }

    /**
    * Handles the PlayerJoined event from the game instance.
    * Moves the player from the "trying to join" list to the "joined" list.
    * @param payload The payload from the PlayerJoined event.
    */
    private handlePlayerJoinedEvent(payload: PlayerJoinedPayload): void {
        const { bridgeToken } = payload;

        // Validate the bridgeToken
        if (!this._playersTryingToJoin.has(bridgeToken)) {
            this.gameInstance.logger?.error(
                `Invalid bridgeToken ${bridgeToken} for received from instance.`
            );
            this.gameInstance.logger?.error(payload);
            return;
        }

        const entry = this._playersTryingToJoin.get(bridgeToken);

        if (!entry) {
            this.gameInstance.logger?.error(
                `Player with bridgeToken ${bridgeToken} not found in trying to join list during `
                + `${PlayerManagementEvents.Joined} event.`
            );
            return;
        }

        this._playersTryingToJoin.delete(bridgeToken);

        this._joinedPlayers.set(entry.hmsUser.hmsPlayerID, entry);
        this.changePlayerStatus(entry, PlayerEntryStatus.Joined);

        this.gameInstance.logger?.log(
            `Player with hmsPlayerID ${entry.hmsUser.hmsPlayerID} successfully joined.`
        );
    }


    /**
     * Handles the PlayerLeft event from the game instance.
     * 
     * When a player leaves the game instance, this method moves them from the "joined" list
     * to the "left" list and updates their status to 'Left'.
     * 
     * @param payload - The payload containing the hmsPlayerID of the player who left.
     * @throws Error if the player with the given hmsPlayerID does not exist in the joined players list.
     */
    private handlePlayerLeftEvent(payload: PlayerLeftPayload): void {
        const { hsmPlayerID: hmsPlayerID } = payload;

        // Check if the player with the given hmsPlayerID exists in the joined players list
        if (!this._joinedPlayers.has(hmsPlayerID)) {
            this.gameInstance.logger?.error(
                `Invalid hmsPlayerID ${hmsPlayerID} received from instance on ${PlayerManagementEvents.Left} event.`
            );
            return;
        }

        // Retrieve the player's entry from the joined players list
        const entry = this._joinedPlayers.get(hmsPlayerID);
        this.changePlayerStatus(entry, PlayerEntryStatus.Left);
        entry.leftAt = new Date();

        // Remove the player from the joined players list
        this._joinedPlayers.delete(hmsPlayerID);
    }

    /**
     * Handles the PlayerConnectionLost event from the game instance.
     * 
     * When a player's connection is lost, this method moves them from the "joined" list
     * to the "disconnected" list and updates their status to 'Disconnected'.
     * 
     * @param payload - The payload containing the hmsPlayerID of the player whose connection has been lost.
     * @throws Error if the player with the given hmsPlayerID does not exist in the joined players list.
     */
    private handlePlayerConnectionLostEvent(payload: PlayerConnectionLostPayload): void {
        // Check if the player with the given hmsPlayerID exists in the joined players list
        if (!this._joinedPlayers.has(payload.hsmPlayerID)) {
            this.gameInstance.logger?.error(
                `Invalid hmsPlayerID ${payload.hsmPlayerID} for received from instance on `
                + `${PlayerManagementEvents.ConnectionLost} event.`
            );
            return;
        }

        // Retrieve the player's entry from the joined players list
        const entry = this._joinedPlayers.get(payload.hsmPlayerID);

        // Update the player's status to 'Disconnected'
        this.changePlayerStatus(entry, PlayerEntryStatus.Disconnected);

        // Set the disconnectedAt timestamp
        entry.disconnectedAt = new Date();

        // Add the player to the disconnected players list
        this._disconnectedPlayers.set(payload.hsmPlayerID, entry);

        // Remove the player from the joined players list
        this._joinedPlayers.delete(payload.hsmPlayerID);
    }

    /**
     * Handles the PlayerConnectionRestabilished event from the game instance.
     * 
     * This method moves a player from the "disconnected" list back to the "joined" list
     * when their connection is re-established. It updates the player's status to 'Joined'.
     * 
     * @param payload - The payload containing the hmsPlayerID of the player whose connection
     * has been re-established.
     * 
     * @throws Error if the player with the given hmsPlayerID does not exist in the disconnected players list.
     */
    private handlePlayerConnectionRestabilishedEvent(payload: PlayerConnectionRestabilishedPayload): void {
        const hmsPlayerID = payload.hsmPlayerID;

        // Check if the player with the given hmsPlayerID exists in the disconnected players list
        if (!this._disconnectedPlayers.has(hmsPlayerID)) {
            this.gameInstance.logger?.error(
                `Invalid hmsPlayerID ${hmsPlayerID} for received from instance on `
                + `${PlayerManagementEvents.ConnectionRestabilished} event.`
            );
            return;
        }

        // Retrieve the player's entry from the disconnected players list
        const entry = this._disconnectedPlayers.get(hmsPlayerID);

        // Update the player's status to 'Joined'
        this.changePlayerStatus(entry, PlayerEntryStatus.Joined);

        // Add the player to the joined players list
        this._joinedPlayers.set(hmsPlayerID, entry);

        // Remove the player from the disconnected players list
        this._disconnectedPlayers.delete(hmsPlayerID);
    }

    /**
     * Initializes the next hmsPlayerID for a new player.
     * This method loops through all the current hmsPlayerID's and sets the next hmsPlayerID to the highest hmsPlayerID found + 1.
     * @returns The next hmsPlayerID.
     */
    private initializeNextHMSPlayerID(): number {
        let maxId = 0;
        // Loop through all the current hmsPlayerID's
        for (const playerId of this._joinedPlayers.keys()) {
            // Set the next hmsPlayerID to the highest hmsPlayerID found + 1
            maxId = Math.max(maxId, playerId);
        }
        // The next hmsPlayerID is the highest hmsPlayerID found + 1
        return maxId + 1;
    }

    /**
     * Generates a unique hmsPlayerID for a new player.
     * This is important because the hmsPlayerID is used to identify a player in the game.
     * The hmsPlayerID is incremented by 1 for each new player, and the existing hmsPlayerID's are checked to ensure the new hmsPlayerID is unique.
     * @returns A unique hmsPlayerID.
     */
    private generateUniqueNetworkId(): number {
        if (this._nextHMSPlayerID > Number.MAX_SAFE_INTEGER) {
            throw new Error("Reached maximum player limit.");
        }

        let newId: number;
        do {
            newId = this._nextHMSPlayerID++;
        } while (this._joinedPlayers.has(newId)); // Ensure ID is unique

        return newId;
    }

    /**
     * A bridge token is a unique string token used to identify a player during the join process.
     * It is used to correlate the player's attempt to join with the actual join event.
     *
     * @param hmsPlayerID The hmsPlayerID of the player to generate the bridge token for.
     * @returns A unique bridge token.
     */
    private generateBridgeToken(): string {
        const length = 12;
        const characters =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        const charactersLength = characters.length;
        let token = "";
        for (let i = 0; i < length; i++) {
            token += characters.charAt(Math.floor(Math.random() * charactersLength));
        }

        // Ensure the generated token is unique
        if (this._playersTryingToJoin.has(token)) {
            return this.generateBridgeToken();
        }

        return token;
    }

    private changePlayerStatus(player: PlayerEntry, newStatus: PlayerEntryStatus) {
        player.status = newStatus;
        this._playerStatusChanged$.next({
            hsmPlayerID: player.hmsUser.hmsPlayerID,
            newStatus: newStatus
        });
    }
}