import { SemanticVersion } from "./semantic-version";
import { VersionUpdateType } from "./version-update-type";
import * as semver from "semver";

/**
 * Creates a SemVer object from a version string.
 * @param {string} version - The version string (e.g., "1.2.3-beta").
 * @returns {SemanticVersion} Parsed SemVer object.
 * @throws {Error} If the version string is invalid.
 */
export function parseSemVer(version: string): SemanticVersion {
    if (!semver.valid(version)) {
        throw new Error("Invalid semver version");
    }
    const parsed = semver.parse(version);
    if (!parsed) {
        throw new Error("Failed to parse semver version");
    }
    return {
        raw: version,
        major: parsed.major,
        minor: parsed.minor,
        patch: parsed.patch,
        prerelease: parsed.prerelease.length > 0
            ? parsed.prerelease.join(".")
            : undefined,
    };
}

/**
 * Converts a SemVer object to a version string.
 * @param {SemanticVersion} semverObj - The SemVer object.
 * @returns {string} The version string.
 */
export function semVerToString(semverObj: SemanticVersion): string {
    let version = `${semverObj.major}.${semverObj.minor}.${semverObj.patch}`;
    if (semverObj.prerelease) {
        version += `-${semverObj.prerelease}`;
    }
    return version;
}

/**
 * Increments a SemVer object according to the update type.
 * @param {SemanticVersion} semverObj - The SemVer object.
 * @param {VersionUpdateType} type - The type of increment.
 * @returns {SemanticVersion} The incremented SemVer object.
 */
export function incrementSemVer(
    semverObj: SemanticVersion,
    type: VersionUpdateType
): SemanticVersion {
    let { major, minor, patch } = semverObj;
    switch (type) {
        case "patch":
            patch++;
            break;
        case "minor":
            minor++;
            patch = 0;
            break;
        case "major":
            major++;
            minor = 0;
            patch = 0;
            break;
        default:
            throw new Error(`Invalid version update type: ${type}`);
    }
    return {
        raw: `${major}.${minor}.${patch}`,
        major,
        minor,
        patch,
    };
}