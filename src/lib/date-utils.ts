/**
 * Formats a date to YYYY/MM/DD consistently for SSR and Client Hydration.
 */
export function formatDate(date: Date | string | number): string {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';

    const Y = d.getFullYear();
    const M = d.getMonth() + 1;
    const D = d.getDate();

    return `${Y}/${M}/${D}`;
}

/**
 * Formats a date to YYYY/MM/DD HH:mm consistently.
 */
export function formatDateTime(date: Date | string | number): string {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';

    const Y = d.getFullYear();
    const M = d.getMonth() + 1;
    const D = d.getDate();
    const H = String(d.getHours()).padStart(2, "0");
    const m = String(d.getMinutes()).padStart(2, "0");

    return `${Y}/${M}/${D} ${H}:${m}`;
}
