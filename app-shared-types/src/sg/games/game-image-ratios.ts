/**
 * Canonical image aspect ratios used by the SG game images feature.
 * Exported as constants to avoid scattering literal strings.
 */

export const GameImageRatios = {
    WIDE_16_9: '16:9',
    PORTRAIT_2_3: '2:3',
} as const;

export type GameImageRatio = typeof GameImageRatios[keyof typeof GameImageRatios];

export default GameImageRatios;
