import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import { logger } from './lib/logger';

// Register global error handlers as early as possible
logger.init();
logger.info('App starting', { env: import.meta.env.MODE, buildTime: import.meta.env.VITE_BUILD_TIME });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
);
