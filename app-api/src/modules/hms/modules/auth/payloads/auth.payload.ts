import {
    IsString,
    IsEmail,
    IsOptional,
    IsBoolean,
    ValidatorConstraint,
    ValidatorConstraintInterface,
    ValidationArguments,
    Validate,
    IsNotEmpty,
    Matches
} from 'class-validator';
import { USERNAME_PATTERN } from '@hms/shared-types/hms';

@ValidatorConstraint({ name: 'IsConditionalEmail' })
export class IsConditionalEmail implements ValidatorConstraintInterface {
    validate(value: any, args: ValidationArguments) {
        const object = args.object as EndUserPasswordLoginPayload;
        if (object.emailOnly === true) {
            return typeof value === 'string' && /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value); // Basic email regex
        }
        return true;
    }

    defaultMessage(args: ValidationArguments) {
        return 'emailOrUsername must be a valid email address when emailOnly is true';
    }
}

export class BasePasswordLoginPayload {
    @IsString()
    password: string;
}

export class EndUserPasswordLoginPayload extends BasePasswordLoginPayload {
    @Validate(IsConditionalEmail)
    emailOrUsername: string;

    @IsBoolean()
    @IsOptional()
    emailOnly?: boolean;
}

/**
 * This payload is used for the first step of the login process when the
 * user has not yet chosen a 2FA method. This is NOT a 2FA step.
 * 
 * Example: The user logged in through a social media provider like google,
 * or twitch. The system used the Ott strategy to allow a device to be logged
 * in after the social media auth provider has authenticated the user. After
 * the client device uses the Ott to login in, we might still need a 2FA step
 * to recognize the user in our system.
 */
export class OttLoginPayload {
    @IsString()
    token: string;
}

/**
 * Regardless of the login method, whenever the user needs or choose to
 * use 2FA, this is the payload that will be sent to the server as the second
 * step.
 */
export class SecondStepLoginPayload {
    @IsString()
    @IsNotEmpty()
    second_step_token: string;

    @IsString()
    @IsNotEmpty()
    code: string
}

/**
 * Payload for the logout endpoint.
 */
export class LogoutPayload {
    /**
     * The refresh token of the user to logout.
     */
    @IsString()
    refresh_token: string;
}


export class RefreshTokenPayload {
    @IsString()
    refresh_token: string;
}

export class ClaimUsernamePayload {
    @IsString()
    @Matches(USERNAME_PATTERN, {
        message:
            'username must be 4-25 chars, lowercase letters/numbers/underscore',
    })
    username: string;
}