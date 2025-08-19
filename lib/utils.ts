// ---------- file: lib/utils.ts ----------
export function slugify(input: string) {
return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}
export function toISO(dateLike?: string) {
if (!dateLike) return undefined;
const d = new Date(dateLike);
if (isNaN(d.getTime())) return undefined;
return d.toISOString();
}
export function unique<T>(arr: T[]): T[] { return Array.from(new Set(arr)); }
