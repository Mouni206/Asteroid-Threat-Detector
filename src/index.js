// src/index.js
// Standard React 18 entry point.
// ReactDOM.createRoot() is the React 18 concurrent mode API.
// It replaces the older ReactDOM.render() for better performance.
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
