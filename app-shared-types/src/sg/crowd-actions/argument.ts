import { ArgumentType } from "./argument-type";

/**
 * Interface representing the pure data structure of an Argument entity.
 * Suitable for DTOs, business logic, and any persistence layer.
 *
 * @property {string} name - Unique name of the argument.
 * @property {ArgumentType} type - Data type of the argument.
 * @property {boolean} required - Indicates if the argument is mandatory.
 * @property {any} defaultValue - Default value assigned to the argument.
 */
export interface Argument {
    /**
     * Unique name of the argument.
     */
    key: string;

    /**
     * Data type of the argument.
     */
    type: ArgumentType;

    /**
     * Indicates if the argument is mandatory.
     */
    required: boolean;

    /**
     * Default value assigned to the argument.
     */
    defaultValue?: any;
}