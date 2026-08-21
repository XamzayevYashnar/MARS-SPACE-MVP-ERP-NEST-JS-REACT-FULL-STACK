/** Uzbek mobile number in canonical form, e.g. +998901234567 (§6.4.6). */
export const UZ_PHONE_REGEX = /^\+998\d{9}$/;

/** Lowercase latin slug: letters, digits and single hyphens. */
export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** 24-hour clock, used by group schedules. */
export const TIME_HH_MM_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** #RGB or #RRGGBB colour used by category badges. */
export const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/** Prisma `cuid()` identifier. */
export const CUID_REGEX = /^c[a-z0-9]{20,32}$/;
