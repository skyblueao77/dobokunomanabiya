import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { normalizePathname } from './utils/router';
import { initChunkErrorRecovery } from './utils/pwaUpdater';

initChunkErrorRecovery();

// MANDATORY: Feature-detect native popover support before loading polyfill
if (typeof HTMLElement !== 'undefined' && !Object.hasOwn(HTMLElement.prototype, 'popover')) {
  import('@oddbird/popover-polyfill');
}

const rootEl = document.getElementById('root')!;
const appElement = (
  <StrictMode>
    <App />
  </StrictMode>
);

const ssrPath = rootEl.dataset.ssrPath;
if (
  ssrPath &&
  normalizePathname(window.location.pathname) === ssrPath &&
  !window.location.hash.startsWith('#/')
) {
  hydrateRoot(rootEl, appElement);
} else {
  createRoot(rootEl).render(appElement);
}
