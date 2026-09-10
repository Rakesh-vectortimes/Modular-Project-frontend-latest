import { PageRead } from '../models';

const AUTH_PAGE_NAMES = new Set([
  'login',
  'signup',
  'sign up',
  'sign-up',
  'register',
  'initial page',
  'initial',
]);

/** Pick the page to show after sign-in when no explicit target is configured. */
export function resolvePostLoginPageId(
  pages: PageRead[],
  options?: { excludePageId?: string },
): string | undefined {
  if (!pages.length) {
    return undefined;
  }

  const excludeId = options?.excludePageId?.trim();
  const byName = (name: string) =>
    pages.find((p) => p.name.trim().toLowerCase() === name.toLowerCase());

  const home = byName('home');
  if (home && home.id !== excludeId) {
    return home.id;
  }

  const nonAuth = pages.find((p) => {
    if (excludeId && p.id === excludeId) {
      return false;
    }
    return !AUTH_PAGE_NAMES.has(p.name.trim().toLowerCase());
  });
  if (nonAuth) {
    return nonAuth.id;
  }

  const nonDefault = pages.find((p) => !p.is_default && p.id !== excludeId);
  if (nonDefault) {
    return nonDefault.id;
  }

  return pages.find((p) => p.id !== excludeId)?.id ?? pages[0]?.id;
}
