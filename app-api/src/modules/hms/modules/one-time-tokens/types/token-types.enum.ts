export enum TokenType {
    NUMERIC = 'numeric',
    ALPHANUMERIC = 'alphanumeric',
    HEXADECIMAL = 'hexadecimal',
    CUSTOM = 'custom'
}

export interface TokenGenerationOptions {
    type: TokenType;
    length: number;
    customChars?: string;
}