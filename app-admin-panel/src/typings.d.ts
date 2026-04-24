// Minimal ambient declaration to satisfy browser TypeScript build when
// shared-types references Node `Buffer` type. This avoids modifying
// external packages or tsconfig for a quick local fix.

declare type Buffer = any;

export { };
