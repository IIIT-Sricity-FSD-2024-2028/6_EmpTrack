import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
// Global styles, in the same order the original pages loaded them.
import './styles/variables.css';
import './styles/global.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/views.css';
import './styles/calendar.css';
import './styles/foundation.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
