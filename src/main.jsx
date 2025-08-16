import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(<App />);

// Register service worker for PWA installation/offline
if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		const swUrl = `${import.meta.env?.BASE_URL || '/'}sw.js`;
		navigator.serviceWorker.register(swUrl).catch(() => {});
	});
}
