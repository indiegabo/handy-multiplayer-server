// src/hms/modules/init/decorators.ts
import { InitStepOptions } from './types';

// Key used to store metadata about initialization steps on service classes.
const INIT_STEPS_METADATA_KEY = 'init:steps';

/**
 * Decorator to mark a method as an initialization step.
 * The InitService will discover and execute these methods during application startup.
 *
 * @param options - Configuration options for the initialization step.
 * @returns A MethodDecorator function.
 */
export function InitStep(options: InitStepOptions): MethodDecorator {
    return (target, propertyKey, descriptor) => {
        // Ensure the decorator is applied to a function.
        if (typeof descriptor.value !== 'function') {
            throw new Error(`@InitStep can only be applied to methods. '${String(propertyKey)}' in '${target.constructor.name}' is not a method.`);
        }

        // Retrieve existing steps metadata or initialize an empty array.
        const existingSteps = Reflect.getMetadata(INIT_STEPS_METADATA_KEY, target.constructor) || [];

        // Add the current method's details to the steps metadata.
        existingSteps.push({
            ...options,
            methodName: propertyKey, // Store the method name for InitService to look up.
        });

        // Define or update the metadata on the target class's constructor.
        Reflect.defineMetadata(
            INIT_STEPS_METADATA_KEY,
            existingSteps,
            target.constructor
        );

        // Return the original descriptor without modification, as the metadata is handled.
        return descriptor;
    };
}