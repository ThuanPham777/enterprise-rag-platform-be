/**
 * User status enumeration
 * Defines all possible statuses a user can have
 */
export enum UserStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE'
}

/**
 * Array of all user status values
 * Useful for validation and Swagger documentation
 */
export const USER_STATUS_VALUES = Object.values(UserStatus) as string[];

/**
 * Default user status when creating a new user
 */
export const DEFAULT_USER_STATUS = UserStatus.ACTIVE;

