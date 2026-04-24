// is-username-available.query.ts
import { IsString, Matches } from 'class-validator';
import { USERNAME_PATTERN } from '@hms/shared-types/hms';

export class IsUsernameAvailableQuery {
    @IsString()
    @Matches(USERNAME_PATTERN, {
        message:
            'username must be 4-25 chars, lowercase letters/numbers/underscore',
    })
    username!: string;
}
