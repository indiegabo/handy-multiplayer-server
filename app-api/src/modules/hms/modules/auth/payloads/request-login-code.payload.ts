import {
    IsNotEmpty,
    IsString,
    Validate,
    ValidatorConstraint,
    ValidatorConstraintInterface,
    isEmail,
} from 'class-validator';
import { USERNAME_PATTERN } from '@hms/shared-types/hms';

@ValidatorConstraint({ name: 'IsEmailOrUsername' })
export class IsEmailOrUsernameConstraint
    implements ValidatorConstraintInterface {
    validate(value: unknown): boolean {
        if (typeof value !== 'string') {
            return false;
        }

        const term = value.trim().toLowerCase();
        if (!term.length) {
            return false;
        }

        if (isEmail(term)) {
            return true;
        }

        return USERNAME_PATTERN.test(term);
    }

    defaultMessage(): string {
        return 'term must be a valid email or username (4-25 chars, lowercase letters/numbers/underscore)';
    }
}

export class RequestLoginCodePayload {
    @IsString()
    @IsNotEmpty()
    @Validate(IsEmailOrUsernameConstraint)
    term: string;
}
