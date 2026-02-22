import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Core Web Vitals — GA4'e raporla
import('web-vitals').then(({ onCLS, onINP, onLCP }) => {
  const sendToGA4 = (metric: { name: string; value: number; id: string }) => {
    if (typeof window.gtag === 'function') {
      window.gtag('event', metric.name, {
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        event_label: metric.id,
        non_interaction: true,
      });
    }
  };
  onCLS(sendToGA4);
  onINP(sendToGA4);
  onLCP(sendToGA4);
}).catch(() => {
  // web-vitals yüklenemezse sessizce devam et
});