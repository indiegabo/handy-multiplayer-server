// src/hms/modules/init/init-step-registry.ts
import { InitStepOptions, StepResult } from './types';

// Define a type for a callable initialization step
export type InitializableStep = {
    method: () => Promise<StepResult>;
    options: InitStepOptions;
};

// Global array to store all registered steps.
// This is a simplified approach. For larger apps, consider a more structured solution
// like a dedicated NestJS provider for this registry.
const registeredInitSteps: InitializableStep[] = [];

export const InitStepRegistry = {
    /**
     * Registers an executable initialization step.
     * @param method The bound method that returns a Promise<StepResult>.
     * @param options Options for the initialization step (name, priority).
     */
    addStep(method: () => Promise<StepResult>, options: InitStepOptions): void {
        registeredInitSteps.push({ method, options });
    },

    /**
     * Retrieves all registered initialization steps, sorted by priority.
     * @returns An array of InitializableStep objects.
     */
    getSteps(): InitializableStep[] {
        // Sort by priority (highest first)
        return registeredInitSteps.sort((a, b) => b.options.priority - a.options.priority);
    },

    /**
     * Clears all registered steps. Useful for testing or hot-reloading scenarios.
     */
    clearSteps(): void {
        registeredInitSteps.length = 0;
    },
};