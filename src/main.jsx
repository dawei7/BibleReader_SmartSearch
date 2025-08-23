import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(<App />);

// Register service worker for PWA installation/offline
if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		const base = (import.meta.env && import.meta.env.BASE_URL) || '/';
		const swUrl = `${base}sw.js`;
		navigator.serviceWorker.register(swUrl, { scope: base }).then(reg => {
			// Force periodic update check on load
			try { reg.update(); } catch {}

			// Listen for waiting worker
			const checkWaiting = () => {
				if (reg.waiting) {
					// In this app we auto-activate immediately
					try { reg.waiting.postMessage('SKIP_WAITING'); } catch {}
				}
			};
			reg.addEventListener('updatefound', () => {
				const inst = reg.installing;
				if (inst) {
					inst.addEventListener('statechange', () => {
						if (inst.state === 'installed') checkWaiting();
					});
				}
			});
			// Initial check if already waiting (edge cases)
			checkWaiting();
		}).catch(() => {});

		// Reload when new controller takes over
		navigator.serviceWorker.addEventListener('controllerchange', () => {
			// Avoid infinite loop: only reload once per activation
			if (!window.__reloadedForSW) {
				window.__reloadedForSW = true;
				window.location.reload();
			}
		});
	});
}
