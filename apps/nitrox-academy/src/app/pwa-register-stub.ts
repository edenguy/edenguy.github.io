/**
 * Stand-in for `virtual:pwa-register/react`, used by preview builds made without the PWA
 * plugin (a host that cannot serve a service worker). The real module is supplied by
 * vite-plugin-pwa in the normal build.
 */
export function useRegisterSW() {
  return {
    needRefresh: [false, () => {}] as [boolean, (v: boolean) => void],
    offlineReady: [false, () => {}] as [boolean, (v: boolean) => void],
    updateServiceWorker: async (_reload?: boolean) => {},
  };
}
