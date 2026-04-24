import { CrowdAction } from './crowd-action';
import { CrowdActionMapping } from './crowd-action-mapping';

/**
 * Data transfer object for version crowd actions response.
 * Contains the actions and mappings configured for a specific version.
 */
export interface VersionCrowdActionsDTO {
    /**
     * Version identifier.
     */
    version_id: string;

    /**
     * Array of crowd actions available for this version.
     */
    actions: CrowdAction[];

    /**
     * Array of crowd action mappings for this version.
     */
    mappings: CrowdActionMapping[];
}
