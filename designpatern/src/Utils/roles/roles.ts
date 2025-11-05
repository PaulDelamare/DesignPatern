import { Role } from '@prisma/client';

export const ROLE_VALUES = Object.values(Role) as Role[];
export type RoleValue = Role;
export const DEFAULT_ROLE: RoleValue = Role.USER;

export { Role };
