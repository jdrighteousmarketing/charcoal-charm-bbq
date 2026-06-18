import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { useDarkMode } from './hooks/useDarkMode';

function Root() {
  useDarkMode();
  return <App />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <Root />
);