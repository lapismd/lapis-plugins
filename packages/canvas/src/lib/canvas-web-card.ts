export function describeCanvasWebsite(value: string): { href: string; host: string; title: string } | null {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
    let part = url.pathname.split('/').filter(Boolean).at(-1) ?? '';
    try { part = decodeURIComponent(part); } catch { /* Keep malformed escapes readable. */ }
    part = part.replace(/\.[a-z0-9]{1,5}$/i, '').replace(/[-_]+/g, ' ').trim();
    return { href: url.href, host: url.host, title: part ? part[0].toUpperCase() + part.slice(1) : url.hostname };
  } catch { return null; }
}
