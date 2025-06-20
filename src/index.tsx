import React from 'react';
import ReactDOM from 'react-dom/client';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Create rtl cache
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
});

// Check if RTL should be enabled (can be enhanced with user preference)
const isRTL = document.documentElement.dir === 'rtl' || 
              localStorage.getItem('language') === 'he';

if (isRTL) {
  document.documentElement.dir = 'rtl';
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    {isRTL ? (
      <CacheProvider value={cacheRtl}>
        <App />
      </CacheProvider>
    ) : (
      <App />
    )}
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
