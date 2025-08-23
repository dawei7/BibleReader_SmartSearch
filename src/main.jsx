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

			// Listen for waiting worker and surface a custom event instead of auto reloading
			const checkWaiting = () => {
				if (reg.waiting) {
					// Notify app UI that an update is ready
					try { window.dispatchEvent(new CustomEvent('br_update_available', { detail: { registration: reg } })); } catch {}
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

		// Reload only if user explicitly approved update
		navigator.serviceWorker.addEventListener('controllerchange', () => {
			if (window.__br_userInitiatedUpdate && !window.__reloadedForSW) {
				window.__reloadedForSW = true;
				window.location.reload();
			}
		});
	});
}
