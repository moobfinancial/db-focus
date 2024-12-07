import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const container = document.getElementById('root');
const root = createRoot(container!);

function render() {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

render();

// Handle hot module replacement
if (import.meta.hot) {
  import.meta.hot.accept('./App', () => {
    console.log('HMR: Updating App component');
    render();
  });
}