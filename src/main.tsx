import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Optional privacy-friendly analytics (Plausible). Set VITE_PLAUSIBLE_DOMAIN=yourdomain.dev at build time.
const analyticsDomain = import.meta.env.VITE_PLAUSIBLE_DOMAIN as string | undefined;
if (analyticsDomain) {
  const script = document.createElement('script');
  script.defer = true;
  script.dataset.domain = analyticsDomain;
  script.src = 'https://plausible.io/js/script.js';
  document.head.appendChild(script);
}
