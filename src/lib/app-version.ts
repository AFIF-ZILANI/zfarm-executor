/** The bits of a GitHub release the update check reads. */
export type Release = {
  tag_name: string;
  assets: { name: string; browser_download_url: string; size?: number }[];
};

/** An APK to offer: its version, where to fetch it, and its size in bytes (0 when unknown). */
export type AppUpdate = { version: string; url: string; size: number };

const parts = (v: string) =>
  v
    .trim()
    .replace(/^v/i, '')
    .split('.')
    .map((n) => Number.parseInt(n, 10) || 0);

/** True when `latest` ("v1.2.0" or "1.2.0") is a higher version than `current`. */
export function isNewer(latest: string, current: string): boolean {
  const a = parts(latest);
  const b = parts(current);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const d = (a[i] ?? 0) - (b[i] ?? 0);
    if (d !== 0) return d > 0;
  }
  return false;
}

/** The update to offer, or null when the release isn't newer or carries no APK. */
export function pickUpdate(release: Release, current: string): AppUpdate | null {
  if (!isNewer(release.tag_name, current)) return null;
  const apk = release.assets.find((a) => a.name.toLowerCase().endsWith('.apk'));
  return apk
    ? { version: release.tag_name.replace(/^v/i, ''), url: apk.browser_download_url, size: apk.size ?? 0 }
    : null;
}
