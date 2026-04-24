import { IsEmail, IsNotEmpty, IsString, IsStrongPassword, Length, registerDecorator, Validate, ValidationArguments, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";
import { BasePasswordLoginPayload } from "./auth.payload";

export class LoginAdminPayload {
    @IsEmail()
    @IsNotEmpty()
    email: string;
}

export class VerifyAdminLoginCodePayload {
    @IsString()
    @IsNotEmpty()
    @Length(32, 32)
    code: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;
}

export class AdminPasswordLoginPayload extends BasePasswordLoginPayload {
    @IsEmail()
    email: string;
}

export class AdminCreationBasePayload {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    @IsStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
    }, {
        message: 'Password must be at least 8 characters long, with 1 uppercase, 1 lowercase, 1 number and 1 symbol'
    })
    password: string;

    @IsString()
    @IsNotEmpty()
    @Validate(IsPasswordMatching, ['password'])
    password_confirmation: string;

    @IsString()
    @IsNotEmpty()
    twofa_token: string;

    @IsString()
    @IsNotEmpty()
    twofa_code: string;
}

export class AdminCreationFromInvitePayload extends AdminCreationBasePayload {
    @IsString()
    @IsNotEmpty()
    invite_token: string;
}

export class StartAdminAccountCreationPayload {
    @IsString()
    @IsNotEmpty()
    invite_token: string;
}

// Validador para confirmar senha (mantido como estava)
@ValidatorConstraint({ name: 'IsPasswordMatching', async: false })
export class IsPasswordMatchingConstraint implements ValidatorConstraintInterface {
    validate(value: any, args: ValidationArguments) {
        const [relatedPropertyName] = args.constraints;
        const relatedValue = (args.object as any)[relatedPropertyName];
        return value === relatedValue;
    }

    defaultMessage(args: ValidationArguments) {
        return 'Password and confirmation do not match';
    }
}

export function IsPasswordMatching(property: string, validationOptions?: ValidationOptions) {
    return function (object: any, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [property],
            validator: IsPasswordMatchingConstraint,
        });
    };
}