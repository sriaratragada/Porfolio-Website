const RETURN_FLAG_KEY = 'portfolio:return-from-resume';
const PROGRESS_KEY = 'portfolio:saved-progress';

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

export function savePortfolioProgress(progress: number) {
  if (!canUseStorage()) return;
  window.sessionStorage.setItem(PROGRESS_KEY, String(progress));
}

export function markPortfolioShouldRestore() {
  if (!canUseStorage()) return;
  window.sessionStorage.setItem(RETURN_FLAG_KEY, '1');
}

export function consumeSavedPortfolioProgress(): number | null {
  if (!canUseStorage()) return null;

  const shouldRestore = window.sessionStorage.getItem(RETURN_FLAG_KEY) === '1';
  const rawProgress = window.sessionStorage.getItem(PROGRESS_KEY);

  window.sessionStorage.removeItem(RETURN_FLAG_KEY);
  window.sessionStorage.removeItem(PROGRESS_KEY);

  if (!shouldRestore || rawProgress === null) return null;

  const progress = Number(rawProgress);
  if (!Number.isFinite(progress)) return null;

  return Math.min(1, Math.max(0, progress));
}

export function clearSavedPortfolioProgress() {
  if (!canUseStorage()) return;
  window.sessionStorage.removeItem(RETURN_FLAG_KEY);
  window.sessionStorage.removeItem(PROGRESS_KEY);
}
