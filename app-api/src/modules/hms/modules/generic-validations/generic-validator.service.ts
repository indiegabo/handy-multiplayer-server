import { Injectable } from '@nestjs/common';

import { BetterLogger } from '../better-logger/better-logger.service';
import { ValidatorMethod } from './generic-validator.interface';

@Injectable()
export class GenericValidatorService {
    private validators = new Map<string, ValidatorMethod>();

    constructor(
        private logger: BetterLogger,
    ) {
        this.logger.setContext(GenericValidatorService.name);
    }

    registerValidator(validatorName: string, validator: ValidatorMethod) {
        if (this.validators.has(validatorName)) {
            throw new Error(`Validator with name ${validatorName} already registered`);
        }
        this.validators.set(validatorName, validator);
    }

    /**
     * Validate the given subject with the validator of the given name.
     *
     * If no validator with the given name is found, this method will return true.
     * This allows for optional validation, where the absence of a validator does not
     * cause the validation to fail.
     *
     * @param validatorName The name of the validator to use.
     * @param subject The subject to validate.
     * @returns A promise that resolves to true if the subject is valid, false otherwise.
     */
    async validate(validatorName: string, subject: any): Promise<boolean> {
        const validator = this.validators.get(validatorName);
        if (!validator) {
            return true; // No validator found, assume valid
        }
        return await validator(subject);
    }
}