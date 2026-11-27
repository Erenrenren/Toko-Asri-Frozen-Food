import { ROLES, type Role } from "@/types/domain";

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

export function isAdmin(role: Role): boolean {
  return role === "admin";
}

export function isStaffOrAdmin(role: Role): boolean {
  return role === "admin" || role === "staff";
}

export function hasRole(role: Role, allowed: readonly Role[]): boolean {
  return allowed.includes(role);
}

export function canManageProducts(role: Role): boolean {
  return isStaffOrAdmin(role);
}

export function canManageUsers(role: Role): boolean {
  return isAdmin(role);
}

export function canViewFinance(role: Role): boolean {
  return isStaffOrAdmin(role);
}

export function defaultRouteForRole(role: Role): string {
  return role === "customer" ? "/portal" : "/dashboard";
}
