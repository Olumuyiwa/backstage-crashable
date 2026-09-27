import '@backstage/cli/asset-types';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@backstage/ui/css/styles.css';
import { v4 as uuidv4 } from 'uuid';

if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = {};
}

if (typeof globalThis.crypto.randomUUID !== 'function') {
  globalThis.crypto.randomUUID = () => uuidv4() as `${string}-${string}-${string}-${string}-${string}`;
}

ReactDOM.createRoot(document.getElementById('root')!).render(App.createRoot());

