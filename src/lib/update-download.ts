import { useSyncExternalStore } from 'react';
import { File, Paths } from 'expo-file-system';
import { startActivityAsync } from 'expo-intent-launcher';

import type { AppUpdate } from '@/lib/app-version';

/**
 * The in-app update download: the APK is fetched by the app itself (progress on the Home banner) and handed to
 * Android's installer when done. It used to open the browser, which on a farm connection could hang at the end
 * of a 130 MB download with nothing to show for it.
 *
 * One module-level state, so the banner keeps its progress across screens and re-renders.
 * ponytail: the download runs in the app's process. Android can stop it if the app is left in the background
 * for long; the banner then offers to try again. A foreground service is the upgrade if that bites.
 */
export type DownloadState =
  | { phase: 'idle' }
  /** progress is 0..1, or null when the server sent no size. */
  | { phase: 'downloading'; version: string; progress: number | null; bytes: number }
  | { phase: 'ready'; version: string }
  | { phase: 'failed'; version: string };

let state: DownloadState = { phase: 'idle' };
const listeners = new Set<() => void>();
const setState = (next: DownloadState) => {
  state = next;
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useUpdateDownload(): DownloadState {
  return useSyncExternalStore(subscribe, () => state);
}

const apkFile = (version: string) => new File(Paths.cache, `ZFarm-v${version}.apk`);

/** A file of the right size from an earlier download (the app was closed after it finished): skip straight to install. */
export function checkDownloaded(update: AppUpdate): void {
  if (state.phase !== 'idle') return;
  const file = apkFile(update.version);
  if (update.size > 0 && file.exists && file.size === update.size) setState({ phase: 'ready', version: update.version });
}

export async function startDownload(update: AppUpdate): Promise<void> {
  if (state.phase === 'downloading') return;
  const file = apkFile(update.version);
  // A file left by an interrupted try is incomplete: start again rather than install half an APK.
  if (file.exists) file.delete();

  setState({ phase: 'downloading', version: update.version, progress: 0, bytes: 0 });
  let shown = 0;
  try {
    await File.downloadFileAsync(update.url, file, {
      idempotent: true,
      onProgress: ({ bytesWritten, totalBytes }) => {
        const total = totalBytes > 0 ? totalBytes : update.size;
        const progress = total > 0 ? Math.min(1, bytesWritten / total) : null;
        // Every whole percent is plenty; a re-render per network chunk is not.
        if (progress !== null && progress - shown < 0.01 && progress < 1) return;
        shown = progress ?? 0;
        setState({ phase: 'downloading', version: update.version, progress, bytes: bytesWritten });
      },
    });
    if (update.size > 0 && file.size !== update.size) throw new Error('Incomplete download');
    setState({ phase: 'ready', version: update.version });
    await install(update.version);
  } catch {
    if (file.exists) file.delete();
    setState({ phase: 'failed', version: update.version });
  }
}

/** Opens Android's installer on the downloaded APK. The first time, Android asks to allow installs from this
 *  app; after that the person comes back and taps the banner again. */
export async function install(version: string): Promise<void> {
  await startActivityAsync('android.intent.action.VIEW', {
    data: apkFile(version).contentUri,
    type: 'application/vnd.android.package-archive',
    flags: 1, // FLAG_GRANT_READ_URI_PERMISSION: the installer reads the file through the app's FileProvider
  }).catch(() => undefined);
}
