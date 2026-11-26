/** Run: `bun src/lib/app-version.test.ts`. */

import assert from 'node:assert/strict';

import { isNewer, pickUpdate } from './app-version';

assert.equal(isNewer('v1.0.1', '1.0.0'), true);
assert.equal(isNewer('1.1.0', '1.0.9'), true);
assert.equal(isNewer('v1.10.0', '1.9.0'), true); // numeric, not string, comparison
assert.equal(isNewer('v1.0.0', '1.0.0'), false);
assert.equal(isNewer('v1.0.0', '1.0.1'), false); // never offer a downgrade
assert.equal(isNewer('v1.0', '1.0.0'), false); // missing segments count as 0
assert.equal(isNewer('v2', '1.9.9'), true);

const apk = { name: 'ZFarm-v1.0.1.apk', browser_download_url: 'https://example.test/ZFarm-v1.0.1.apk', size: 52_000_000 };
const notes = { name: 'notes.txt', browser_download_url: 'https://example.test/notes.txt' };

assert.deepEqual(pickUpdate({ tag_name: 'v1.0.1', assets: [notes, apk] }, '1.0.0'), {
  version: '1.0.1',
  url: apk.browser_download_url,
  size: 52_000_000,
});
assert.equal(pickUpdate({ tag_name: 'v1.0.0', assets: [apk] }, '1.0.0'), null); // up to date
assert.equal(pickUpdate({ tag_name: 'v1.0.1', assets: [notes] }, '1.0.0'), null); // release has no APK yet

// A release asset without a size still offers the update, with size 0 (unknown).
assert.equal(pickUpdate({ tag_name: 'v1.0.1', assets: [{ ...apk, size: undefined }] }, '1.0.0')?.size, 0);
