import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Polyfill for Promise.withResolvers (Missing in some environments, required by pdfjs v4+)
if (typeof (Promise as any).withResolvers === "undefined") {
  (Promise as any).withResolvers = function () {
    let resolve, reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

// Polyfill for Promise.try
if (typeof (Promise as any).try === "undefined") {
  (Promise as any).try = function (callback: () => any) {
    return new Promise((resolve, reject) => {
      try {
        resolve(callback());
      } catch (err) {
        reject(err);
      }
    });
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
