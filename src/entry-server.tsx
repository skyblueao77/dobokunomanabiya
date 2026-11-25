import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import App from './App.tsx';

export function renderRouteToHtml(pathname: string): string {
  return renderToString(
    <StrictMode>
      <App initialLocation={{ pathname, search: '', hash: '' }} />
    </StrictMode>
  );
}
