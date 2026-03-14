// Stub for $app/navigation in vitest browser mode
export const goto = async (_url: string, _opts?: object) => {};
export const beforeNavigate = (_cb: () => void) => {};
export const afterNavigate = (_cb: () => void) => {};
export const onNavigate = (_cb: () => void) => {};
export const pushState = (_url: string, _state: object) => {};
export const replaceState = (_url: string, _state: object) => {};
export const preloadCode = async (..._urls: string[]) => {};
export const preloadData = async (_url: string) => {};
export const invalidate = async (_url: string) => {};
export const invalidateAll = async () => {};
