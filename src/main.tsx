import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializeAuthPageSession } from './api/axiosclient';

const resolveInitialTheme = () => {
  const stored = localStorage.getItem('admin-theme');
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

document.documentElement.classList.toggle('dark', resolveInitialTheme() === 'dark');

initializeAuthPageSession();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>, 
);
