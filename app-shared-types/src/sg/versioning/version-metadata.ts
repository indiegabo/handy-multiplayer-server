/**
 * Metadata structure for version lifecycle management.
 * Stored in the `meta` JSONB field of sg_versions table.
 * 
 * Important: Developers authenticate via game management tokens, not user accounts.
 * Therefore, metadata focuses on version states and progress rather than "who did what".
 */

/**
 * Status of development work for a version.
 */
export enum DevelopmentStatus {
    NotStarted = 'not_started',
    InProgress = 'in_progress',
    Completed = 'completed',
    OnHold = 'on_hold',
    Blocked = 'blocked',
}

/**
 * Priority level for version development.
 */
export enum DevelopmentPriority {
    Low = 'low',
    Medium = 'medium',
    High = 'high',
    Critical = 'critical',
}

/**
 * Testing phase for a version.
 */
export enum TestingPhase {
    Internal = 'internal',
    Alpha = 'alpha',
    Beta = 'beta',
    ReleaseCandidate = 'release_candidate',
}

/**
 * Status of testing phase for a version.
 */
export enum TestingStatus {
    NotStarted = 'not_started',
    InProgress = 'in_progress',
    Passed = 'passed',
    Failed = 'failed',
}

/**
 * Acknowledgment information for a version.
 * Tracks when the development team acknowledged and started working on the version.
 * Note: Accessed via development token, not by individual users.
 */
export interface VersionAcknowledgment {
    /**
     * Whether the version has been acknowledged by the development team.
     */
    acknowledged: boolean;

    /**
     * ISO 8601 timestamp when the version was acknowledged.
     */
    acknowledgedAt?: string;

    /**
     * Optional notes about the acknowledgment or development plans.
     */
    notes?: string;
}

/**
 * Development progress information for a version.
 * Managed by developers via game management token.
 */
export interface VersionDevelopmentInfo {
    /**
     * Current status of development work.
     */
    status: DevelopmentStatus;

    /**
     * ISO 8601 timestamp when development started.
     */
    startedAt?: string;

    /**
     * ISO 8601 timestamp when development was completed.
     */
    completedAt?: string;

    /**
     * Priority level for this version development.
     */
    priority?: DevelopmentPriority;

    /**
     * ISO 8601 timestamp for estimated completion.
     */
    estimatedCompletion?: string;

    /**
     * Percentage of completion (0-100).
     */
    progressPercentage?: number;

    /**
     * Notes about development progress, blockers, or changes.
     */
    notes?: string;
}

/**
 * Testing information for a version.
 * Tracks testing progress and results.
 */
export interface VersionTestingInfo {
    /**
     * Current status of testing phase.
     */
    status: TestingStatus;

    /**
     * Current testing phase (internal, alpha, beta, etc).
     */
    phase?: TestingPhase;

    /**
     * Number of tests completed.
     */
    testsCompleted?: number;

    /**
     * Total number of tests planned.
     */
    testsTotal?: number;

    /**
     * Number of critical issues found.
     */
    criticalIssuesFound?: number;

    /**
     * ISO 8601 timestamp when testing started.
     */
    startedAt?: string;

    /**
     * ISO 8601 timestamp when testing was completed.
     */
    completedAt?: string;

    /**
     * Notes about testing results, issues found, or test coverage.
     */
    notes?: string;
}

/**
 * Additional metadata for a version.
 * Flexible structure for tracking external references and custom data.
 */
export interface VersionAdditionalMetadata {
    /**
     * Array of tags for categorization or filtering.
     * Example: ["hotfix", "breaking-change", "feature-update"]
     */
    tags?: string[];

    /**
     * Array of linked issue IDs (JIRA, GitHub, Trello, etc).
     * Example: ["JIRA-123", "GH-456"]
     */
    linkedIssues?: string[];

    /**
     * Build or commit information.
     */
    buildInfo?: {
        commitHash?: string;
        branch?: string;
        buildNumber?: string;
    };

    /**
     * Arbitrary custom fields for project-specific extensibility.
     */
    customFields?: Record<string, any>;
}

/**
 * Complete version metadata structure.
 * This is the shape of the `meta` JSONB field in sg_versions table.
 * 
 * Design principles:
 * - Focus on version states and progress, not individual actors
 * - Developers interact via game management tokens
 * - Admins manage via backoffice with user context
 * - Flexible enough for different workflow needs
 */
import { CrowdAction } from '../crowd-actions/crowd-action';
import { CrowdActionMapping } from '../crowd-actions/crowd-action-mapping';
import { ConnectionPlatform } from '../games/connection-platform';

/**
 * Metadata associated with a runtime init settings page.
 */
export interface VersionInitSettingsPageMetadata {
    /**
     * Stable page identifier.
     */
    id: string;

    /**
     * Suggested page display order.
     */
    order: number;

    /**
     * Optional display label for UI rendering.
     */
    display_name?: string | null;

    /**
     * Optional i18n key for display label translation.
     */
    display_name_i18n?: string | null;

    /**
     * Additional metadata fields for future extensibility.
     */
    [key: string]: unknown;
}

/**
 * Runtime init settings page with metadata and fields payload.
 */
export interface VersionInitSettingsPage {
    /**
     * Page metadata.
     */
    metadata: VersionInitSettingsPageMetadata;

    /**
     * Arbitrary key-value settings for the page.
     */
    fields: Record<string, unknown>;
}

/**
 * Metadata used during development workflows for a version.
 * Replaces previous `meta` root and contains acknowledgment, development
 * and testing information.
 */
export interface VersionDevelopmentMetadata {
    /**
     * Acknowledgment information - when dev team accepted the version.
     */
    acknowledgment?: VersionAcknowledgment;

    /**
     * Development progress and status tracking.
     */
    development?: VersionDevelopmentInfo;

    /**
     * Testing progress, results, and quality metrics.
     */
    testing?: VersionTestingInfo;

    /**
     * Optional additional development metadata (tags, linked issues, etc).
     */
    // (intentionally left no free-form additional field)
}


/**
 * Metadata used at runtime for a specific version. This contains the
 * crowd actions configuration and supported platforms for the running
 * game version.
 */
export interface VersionRuntimeMetadata {
    /**
     * Crowd actions and mappings available at runtime.
     */
    crowd?: {
        actions: CrowdAction[];
        mappings: CrowdActionMapping[];
    };

    /**
     * Supported connection platforms for this version (array of ConnectionPlatform values).
     */
    platforms?: ConnectionPlatform[];

    /**
     * Runtime initialization settings pages with metadata and fields.
     */
    init_settings?: VersionInitSettingsPage[];
}

/**
 * Backwards-compatible alias for previous `VersionMetadata` type.
 * Many tests and older modules still import `VersionMetadata` — this
 * alias maps to the development metadata shape which was the primary
 * consumer of the old `meta` payload in tests and controllers.
 */
export type VersionMetadata = VersionDevelopmentMetadata;
