/**
 * Metadata conditions types used to query media by metadata fields.
 *
 * Code and docs in English. Keep vertical-friendly formatting.
 */

export type MetadataConditionValue = string | number | Array<string | number>;

export type MetadataConditions = Record<string, MetadataConditionValue>;

