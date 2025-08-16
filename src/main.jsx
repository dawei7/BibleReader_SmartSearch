import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(<App />);

// Register service worker for PWA installation/offline
if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		// Vite injects BASE_URL at build time. It equals '/' in dev and '/BibleReader_SmartSearch/' on GH Pages.
		const base = (import.meta.env && import.meta.env.BASE_URL) || '/';
		const swUrl = `${base}sw.js`;
		navigator.serviceWorker.register(swUrl).catch(() => {});
	});
}
