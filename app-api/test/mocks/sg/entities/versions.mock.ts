import { GameVersionState } from "@hms/shared-types";
import { Version } from "@src/modules/sg/core/entities/version.entity";

// Mock versions

export const VERSIONS_MOCK: Version[] = [
    {
        id: 'version-1',
        entity_type: 'game',
        entity_id: 'game-1',
        semver: '1.0.0',
        state: GameVersionState.Ready,
        is_current: true,
        is_prerelease: false,
        notes: 'Initial release',
        builds: [],
        game: null,
        created_at: new Date(),
        updated_at: new Date(),
    },
    {
        id: 'version-2',
        entity_type: 'game',
        entity_id: 'game-1',
        semver: '1.1.0',
        state: GameVersionState.Preparation,
        is_current: false,
        is_prerelease: true,
        notes: 'Beta release with new features',
        builds: [],
        game: null,
        created_at: new Date(),
        updated_at: new Date(),
    }
];
