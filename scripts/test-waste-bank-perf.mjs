import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('--- [Test 1] Static Code Audit for Performance & Standards ---');

const filesToCheck = [
  'src/services/waste-bank-showcase.service.ts',
  'src/pages/WasteBankResults.tsx',
  'src/pages/WasteBank.tsx',
  'src/components/admin/waste-bank/WasteBankShowcaseManagement.tsx',
  'src/components/admin/waste-bank/QuickStudentPicker.tsx',
  'src/components/admin/waste-bank/WasteStudentSummaryTab.tsx',
  'src/components/admin/waste-bank/WasteBankManagement.tsx',
  'src/components/admin/waste-bank/RewardsManagement.tsx',
  'src/components/admin/waste-bank/ClaimsApproval.tsx',
  'src/components/admin/waste-bank/ClaimQRScanner.tsx',
  'src/components/admin/waste-bank/TermBanner.tsx',
];

for (const relPath of filesToCheck) {
  const fullPath = path.resolve(process.cwd(), relPath);
  assert(fs.existsSync(fullPath), `File must exist: ${relPath}`);
  const content = fs.readFileSync(fullPath, 'utf8');

  // Verify no dark: class in modified files
  const darkMatches = content.match(/dark:[a-zA-Z0-9_-]+/g);
  assert(
    !darkMatches,
    `Found dark: classes in ${relPath}: ${darkMatches ? darkMatches.join(', ') : ''}`,
  );

  // In WasteBank.tsx, check no hex color in style or class
  if (relPath.endsWith('WasteBank.tsx')) {
    const hexMatches = content.match(/#[0-9a-fA-F]{3,6}/g);
    assert(
      !hexMatches,
      `Found hardcoded hex colors in WasteBank.tsx: ${hexMatches ? hexMatches.join(', ') : ''}`,
    );
  }
}
console.log('✓ All 10 files have zero dark: classes and no hardcoded hex colors');

console.log('--- [Test 2] WasteBank.tsx Count-up Isolation & PersonAvatar Check ---');
const wasteBankContent = fs.readFileSync('src/pages/WasteBank.tsx', 'utf8');
assert(
  wasteBankContent.includes('const AnimatedStatsSection = memo('),
  'AnimatedStatsSection must be memoized in WasteBank.tsx',
);
assert(
  !wasteBankContent.includes('function StudentAvatar('),
  'Legacy StudentAvatar must be replaced in WasteBank.tsx',
);
assert(
  wasteBankContent.includes('<PersonAvatar'),
  'PersonAvatar must be used in WasteBank.tsx',
);
const wasteBankBody = wasteBankContent.slice(wasteBankContent.indexOf('const WasteBank = () => {'));
assert(
  !wasteBankBody.includes('displayStats'),
  'displayStats must not be in root WasteBank component body',
);
console.log('✓ WasteBank.tsx has isolated AnimatedStatsSection and uses PersonAvatar');

console.log('--- [Test 3] WasteBankShowcaseManagement Optimistic Reordering Check ---');
const showcaseMgmtContent = fs.readFileSync(
  'src/components/admin/waste-bank/WasteBankShowcaseManagement.tsx',
  'utf8',
);
assert(
  showcaseMgmtContent.includes('queryClient.setQueryData<WasteShowcasePhotoWithUrl[]>'),
  'Optimistic update via setQueryData must be present in WasteBankShowcaseManagement',
);
assert(
  showcaseMgmtContent.includes('queryClient.setQueryData(photosQueryKey, previousPhotos)') ||
  showcaseMgmtContent.includes('queryClient.setQueryData(photosQueryKey, baseline)'),
  'Rollback on failure must be present in WasteBankShowcaseManagement',
);
assert(
  !showcaseMgmtContent.includes("invalidateQueries({ queryKey: ['waste-bank-showcase'] })"),
  'Global cache-busting invalidateQueries([waste-bank-showcase]) must be removed',
);
console.log('✓ WasteBankShowcaseManagement implements optimistic reordering with rollback');

console.log('--- [Test 4] QuickStudentPicker & WasteBankManagement Memoization Check ---');
const pickerContent = fs.readFileSync('src/components/admin/waste-bank/QuickStudentPicker.tsx', 'utf8');
assert(
  pickerContent.includes('const StudentCard = memo('),
  'StudentCard must be memoized in QuickStudentPicker',
);
assert(
  pickerContent.includes('export const QuickStudentPicker = memo('),
  'QuickStudentPicker must be memoized',
);
const wasteBankMgmtContent = fs.readFileSync(
  'src/components/admin/waste-bank/WasteBankManagement.tsx',
  'utf8',
);
assert(
  wasteBankMgmtContent.includes('const handleClassChange = useCallback('),
  'handleClassChange must be wrapped in useCallback',
);
assert(
  wasteBankMgmtContent.includes('const handleStudentSelect = useCallback('),
  'handleStudentSelect must be wrapped in useCallback',
);
console.log('✓ QuickStudentPicker and WasteBankManagement properly memoized');

console.log('--- [Test 5] WasteStudentSummaryTab Deferred Search & Memoized Rows Check ---');
const summaryTabContent = fs.readFileSync(
  'src/components/admin/waste-bank/WasteStudentSummaryTab.tsx',
  'utf8',
);
assert(
  summaryTabContent.includes('const deferredSearch = useDeferredValue(search)'),
  'useDeferredValue must be used for search in WasteStudentSummaryTab',
);
assert(
  summaryTabContent.includes('const SummaryTableRow = memo('),
  'SummaryTableRow must be memoized',
);
assert(
  summaryTabContent.includes('const SummaryGridCard = memo('),
  'SummaryGridCard must be memoized',
);
console.log('✓ WasteStudentSummaryTab implements deferred search and memoized row components');

console.log('--- [Test 6] Image Smooth Scrolling & Hardware Acceleration Check ---');
const filesWithImages = [
  'src/pages/WasteBankResults.tsx',
  'src/components/admin/waste-bank/WasteBankShowcaseManagement.tsx',
  'src/components/admin/waste-bank/RewardsManagement.tsx',
  'src/components/admin/waste-bank/ClaimsApproval.tsx',
  'src/components/admin/waste-bank/ClaimQRScanner.tsx',
];
for (const relPath of filesWithImages) {
  const content = fs.readFileSync(relPath, 'utf8');
  assert(
    content.includes('decoding="async"'),
    `${relPath} must include decoding="async" for images`,
  );
  assert(
    content.includes('transform-gpu'),
    `${relPath} must include transform-gpu on animated elements`,
  );
}
console.log('✓ Image tags have decoding="async" and cards use transform-gpu');

console.log('--- [Test 7] Dynamic Signed URL In-Memory Cache Simulation (including null item.path & eviction) ---');
const SIGNED_URL_SECONDS = 3600;
const CACHE_BUFFER_MS = 5 * 60 * 1000;
const signedUrlCache = new Map();

let apiCallCount = 0;
let requestedPaths = [];

async function mockCreateSignedUrls(paths) {
  apiCallCount++;
  requestedPaths.push(...paths);
  // Simulate Supabase Storage returning path: null or omitted path for some items
  return {
    data: paths.map((p, idx) => ({
      path: idx === 1 ? null : p,
      signedUrl: `https://mock-storage.supabase.co/signed/${p}?token=${Math.random()}`,
    })),
    error: null,
  };
}

async function withSignedUrls(photos, now = Date.now()) {
  if (photos.length === 0) return [];
  const missingPaths = [];
  const pathSet = new Set();

  for (const photo of photos) {
    if (!photo.storage_path || !photo.storage_path.trim()) continue;
    const cached = signedUrlCache.get(photo.storage_path);
    if (cached && cached.expiresAt <= now) {
      signedUrlCache.delete(photo.storage_path);
    }
    if (!cached || cached.expiresAt - now < CACHE_BUFFER_MS) {
      if (!pathSet.has(photo.storage_path)) {
        pathSet.add(photo.storage_path);
        missingPaths.push(photo.storage_path);
      }
    }
  }

  if (missingPaths.length > 0) {
    const { data, error } = await mockCreateSignedUrls(missingPaths);
    if (error) throw error;
    if (data) {
      const expiresAt = now + SIGNED_URL_SECONDS * 1000;
      data.forEach((item, index) => {
        const reqPath = missingPaths[index];
        if (item?.signedUrl) {
          if (reqPath) {
            signedUrlCache.set(reqPath, {
              signedUrl: item.signedUrl,
              expiresAt,
            });
          }
          if (item.path && item.path !== reqPath) {
            signedUrlCache.set(item.path, {
              signedUrl: item.signedUrl,
              expiresAt,
            });
          }
        }
      });
    }
  }

  return photos.map((photo) => ({
    ...photo,
    signed_url: signedUrlCache.get(photo.storage_path)?.signedUrl ?? null,
  }));
}

const mockPhotos = [
  { id: '1', report_id: 'r1', storage_path: 'r1/img-1.jpg', caption: 'photo 1' },
  { id: '2', report_id: 'r1', storage_path: 'r1/img-2.jpg', caption: 'photo 2' },
  { id: '3', report_id: 'r1', storage_path: '   ', caption: 'photo empty' },
];

const now = Date.now();
const res1 = await withSignedUrls(mockPhotos, now);
assert.strictEqual(apiCallCount, 1);
const originalUrl1 = res1[0].signed_url;
const originalUrl2 = res1[1].signed_url;

// Both paths must have valid signed URLs even though item.path was null for item 2
assert(originalUrl1 !== null, 'Item 1 signed URL must not be null');
assert(originalUrl2 !== null, 'Item 2 signed URL must not be null even with null item.path');
assert.strictEqual(res1[2].signed_url, null, 'Empty path must safely resolve to null');

// Reordering must NOT call API again
const res2 = await withSignedUrls([mockPhotos[1], mockPhotos[0]], now + 1000);
assert.strictEqual(apiCallCount, 1);
assert.strictEqual(res2[1].signed_url, originalUrl1);
assert.strictEqual(res2[0].signed_url, originalUrl2);

// Eviction on expired entry
const future = now + SIGNED_URL_SECONDS * 1000 + 1000;
await withSignedUrls([mockPhotos[0]], future);
assert.strictEqual(apiCallCount, 2, 'Expired item must trigger new signed URL request');

// Manual eviction on delete
signedUrlCache.delete('r1/img-1.jpg');
assert.strictEqual(signedUrlCache.has('r1/img-1.jpg'), false);
console.log('✓ Cache hit with null item.path fallback, empty path filter, and expiration eviction verified');

console.log('--- [Test 8] WasteBankResults Dialog activePhoto & Fresh URL Sync Check ---');
const resultsContent = fs.readFileSync('src/pages/WasteBankResults.tsx', 'utf8');
assert(
  resultsContent.includes('const activePhoto = useMemo('),
  'WasteBankResults must derive activePhoto to avoid stale/expired URLs in dialog',
);
assert(
  resultsContent.includes('activePhoto?.signed_url'),
  'Dialog must render activePhoto?.signed_url',
);
console.log('✓ WasteBankResults uses activePhoto for dialog modal');

console.log('--- [Test 9] WasteBank.tsx Search Table PersonAvatar Check (DESIGN.md Rule 14.13) ---');
const wasteBankFileContent = fs.readFileSync('src/pages/WasteBank.tsx', 'utf8');
const searchResultsSection = wasteBankFileContent.slice(
  wasteBankFileContent.indexOf('searchResults.map((s, idx)'),
  wasteBankFileContent.indexOf('searchResults.length > 1'),
);
assert(
  searchResultsSection.includes('<PersonAvatar'),
  'searchResults table row must display <PersonAvatar> alongside student name',
);
console.log('✓ WasteBank.tsx search results table includes PersonAvatar');

console.log('--- [Test 10] WasteBankManagement Async Race Condition Guard, QR Preservation & Invalidation Check ---');
const wbMgmtFileContent = fs.readFileSync('src/components/admin/waste-bank/WasteBankManagement.tsx', 'utf8');
assert(
  wbMgmtFileContent.includes('let cancelled = false;'),
  'WasteBankManagement student fetch must have cancellation flag',
);
assert(
  wbMgmtFileContent.includes('cancelled = true;'),
  'WasteBankManagement student fetch must clean up cancellation flag',
);
const classEffectSection = wbMgmtFileContent.slice(
  wbMgmtFileContent.indexOf('// Fetch students when class changes'),
  wbMgmtFileContent.indexOf('const fetchCategories = async'),
);
assert(
  !classEffectSection.includes("setForm(prev => ({ ...prev, student_name: '' }))"),
  'Class effect must not erase student_name so QR scanned student is preserved',
);
assert(
  wbMgmtFileContent.includes('<Select value={form.student_class} onValueChange={handleClassChange}>'),
  'Fallback class select must use handleClassChange',
);
assert(
  wbMgmtFileContent.includes("queryClient.invalidateQueries({ queryKey: ['waste-bank-showcase', 'public-results'] })"),
  'WasteBankManagement must invalidate public-results on transaction changes',
);
const studentOptionsIndex = wbMgmtFileContent.indexOf('studentOptions.map((s) => (');
const fallbackSelectSection = wbMgmtFileContent.slice(
  studentOptionsIndex,
  wbMgmtFileContent.indexOf('</SelectContent>', studentOptionsIndex),
);
assert(
  fallbackSelectSection.includes('<PersonAvatar'),
  'Fallback student dropdown select must use <PersonAvatar> (DESIGN.md Rule 14.13)',
);
assert(
  !fallbackSelectSection.includes('<img'),
  'Fallback student dropdown select must not use raw <img>',
);
console.log('✓ WasteBankManagement has cancellation guard, preserves QR scanned students, and invalidates public-results');

console.log('--- [Test 11] WasteBankShowcaseManagement Fluent Reordering & Robust Coordinator Check ---');
const showcaseFileContent = fs.readFileSync('src/components/admin/waste-bank/WasteBankShowcaseManagement.tsx', 'utf8');
assert(
  !showcaseFileContent.includes('disabled={index === 0 || isReordering}'),
  'ArrowUp button must not be disabled on isReordering to allow rapid 0ms clicking',
);
assert(
  showcaseFileContent.includes('const movePhoto = async (photoId: string,'),
  'movePhoto must accept photoId to prevent stale closure index swap bugs',
);
assert(
  showcaseFileContent.includes('const flushReorder = async () => {'),
  'flushReorder must be present to persist pending reorders before unmount/delete/mutations',
);
assert(
  showcaseFileContent.includes('hadPendingReorder'),
  'deletePhoto must sync pending reorder when deleting photos',
);
const uploadPhotosSection = showcaseFileContent.slice(
  showcaseFileContent.indexOf('const uploadPhotos = useMutation({'),
  showcaseFileContent.indexOf('const updatePhoto = useMutation({'),
);
assert(
  uploadPhotosSection.includes('await flushReorder();'),
  'uploadPhotos must flush pending reorders on mutate before upload',
);
console.log('✓ WasteBankShowcaseManagement has fluent reordering with photoId lookup and mutation flush');

console.log('--- [Test 12] ClaimQRScanner PersonAvatar & Async Image Check (DESIGN.md Rule 14.13) ---');
const claimQrContent = fs.readFileSync('src/components/admin/waste-bank/ClaimQRScanner.tsx', 'utf8');
assert(
  claimQrContent.includes('import { PersonAvatar }'),
  'ClaimQRScanner must import PersonAvatar',
);
assert(
  claimQrContent.includes('<PersonAvatar'),
  'ClaimQRScanner must render PersonAvatar for student',
);
assert(
  !claimQrContent.includes('claim.students?.photo_url ? ('),
  'ClaimQRScanner must not render raw student <img> / fallback div',
);
assert(
  claimQrContent.includes('decoding="async"'),
  'ClaimQRScanner reward image must have decoding="async"',
);
console.log('✓ ClaimQRScanner complies with PersonAvatar and async decoding');

console.log('--- [Test 13] ClaimsApproval Async Image & Callback Stability Check ---');
const claimsApprContent = fs.readFileSync('src/components/admin/waste-bank/ClaimsApproval.tsx', 'utf8');
assert(
  claimsApprContent.includes('decoding="async"'),
  'ClaimsApproval reward image must have decoding="async"',
);
assert(
  claimsApprContent.includes('const fetchAll = useCallback('),
  'ClaimsApproval fetchAll must be wrapped in useCallback',
);
assert(
  claimsApprContent.includes("queryClient.invalidateQueries({ queryKey: ['waste-bank-showcase', 'public-results'] })"),
  'ClaimsApproval must invalidate public-results on claim actions',
);
console.log('✓ ClaimsApproval has async decoding, stable useCallback, and invalidates public results');

console.log('--- [Test 14] RewardsManagement Query Invalidation Check ---');
const rewardsMgmtContent = fs.readFileSync('src/components/admin/waste-bank/RewardsManagement.tsx', 'utf8');
assert(
  rewardsMgmtContent.includes('useQueryClient'),
  'RewardsManagement must import useQueryClient',
);
assert(
  rewardsMgmtContent.includes("queryClient.invalidateQueries({ queryKey: ['rewards'] })"),
  'RewardsManagement must invalidate rewards query on mutation',
);
assert(
  rewardsMgmtContent.includes("queryClient.invalidateQueries({ queryKey: ['rewards-stock-drift'] })"),
  'RewardsManagement must invalidate rewards-stock-drift query on mutation',
);
const stockResetSection = rewardsMgmtContent.slice(
  rewardsMgmtContent.indexOf('<StockResetPopover'),
  rewardsMgmtContent.indexOf('/>', rewardsMgmtContent.indexOf('<StockResetPopover')),
);
assert(
  stockResetSection.includes("queryClient.invalidateQueries({ queryKey: ['rewards'] })"),
  'StockResetPopover onSaved must invalidate rewards query',
);
console.log('✓ RewardsManagement invalidates active rewards and stock drift queries');

console.log('--- [Test 15] Service Storage Path Validation & Eviction Check ---');
const serviceContent = fs.readFileSync('src/services/waste-bank-showcase.service.ts', 'utf8');
assert(
  serviceContent.includes('if (!photo.storage_path || !photo.storage_path.trim()) continue;'),
  'withSignedUrls must guard against null/empty/whitespace storage_path',
);
assert(
  serviceContent.includes('if (cached && cached.expiresAt <= now)'),
  'withSignedUrls must evict expired items from cache',
);
console.log('✓ waste-bank-showcase.service validates paths and evicts expired items');

console.log('\nAll 15 verification checks passed successfully!');
