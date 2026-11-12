import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/ibm-plex-sans/latin-400.css';
import '@fontsource/ibm-plex-sans/latin-600.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/componentes.css';
import './styles/animaciones.css';
import './styles/impresion.css';
import { App } from './App';

const raiz = document.getElementById('root');
if (!raiz) throw new Error('Falta el elemento #root en index.html');

createRoot(raiz).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
