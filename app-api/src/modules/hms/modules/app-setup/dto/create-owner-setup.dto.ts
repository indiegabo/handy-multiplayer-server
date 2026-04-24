import {
    IsEmail,
    IsNotEmpty,
    IsString,
    Validate,
    Matches,
    IsStrongPassword,
    registerDecorator,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
    ValidationArguments,
    IsNumberString,
} from "class-validator";

export class StartOwnerCreationDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;
}