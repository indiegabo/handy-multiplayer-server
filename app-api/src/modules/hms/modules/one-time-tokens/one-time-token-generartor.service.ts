// src/one-time-tokens/token-generator.service.ts
import { Injectable } from '@nestjs/common';
import { TokenGenerationOptions, TokenType } from './types/token-types.enum';

@Injectable()
export class OneTimeTokenGeneratorService {
    private readonly charSets = {
        [TokenType.NUMERIC]: '0123456789',
        [TokenType.ALPHANUMERIC]: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
        [TokenType.HEXADECIMAL]: '0123456789ABCDEF',
    };

    generateToken(options: TokenGenerationOptions): string {
        let chars = this.charSets[options.type];

        if (options.type === TokenType.CUSTOM) {
            if (!options.customChars || options.customChars.length < 2) {
                throw new Error('Custom token type requires customChars with at least 2 characters');
            }
            chars = options.customChars;
        }

        let token = '';
        const charsLength = chars.length;

        for (let i = 0; i < options.length; i++) {
            token += chars.charAt(Math.floor(Math.random() * charsLength));
        }

        return token;
    }
}