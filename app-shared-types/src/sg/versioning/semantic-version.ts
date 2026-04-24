/**
 * Represents a semantic version following the SemVer specification.
 * Used to identify and compare software versions in a structured way.
 *
 * @interface SemVer
 */
export interface SemanticVersion {
    /**
     * The original version string (e.g., "1.2.3-beta").
     */
    raw: string;
    /**
     * Major version number (breaking changes).
     */
    major: number;
    /**
     * Minor version number (backwards-compatible features).
     */
    minor: number;
    /**
     * Patch version number (backwards-compatible bug fixes).
     */

    patch: number;

    /**
     * Optional prerelease identifier (e.g., "alpha", "beta").
     */
    prerelease?: string;
}

