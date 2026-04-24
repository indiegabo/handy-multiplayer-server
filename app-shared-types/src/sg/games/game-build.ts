import { GameBuildPlatform } from "./game-build-platform";

/**
 * Represents a game build for a specific platform.
 */
export type GameBuild = {

    /**
     * Unique identifier for the game build.
     */
    id: string;

    /**
     * Associated game version ID.
     */
    version_id: string;

    /**
     * Platform for the game build.
     */
    platform: GameBuildPlatform;

    /**
     * Download size in bytes.
     */
    download_size: number;

    /**
     * Installed size in bytes.
     */
    installed_size: number;

    /**
     * Name of the executable file.
     */
    executable_name: string;

    /**
     * Name of the build file.
     */
    filename: string;

    /**
     * Source URL or path for the build.
     */
    src: string;
};