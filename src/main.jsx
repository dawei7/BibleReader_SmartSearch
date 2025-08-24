import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(<App />);

// Service worker handling:
// In development, an already-installed production SW (from prior preview or Pages visit)
// can hijack / and cause a blank screen or stale assets. We therefore unregister all
// service workers when Vite dev (import.meta.env.DEV) and only register in production builds.
if ('serviceWorker' in navigator) {
	if (import.meta.env.DEV) {
		// Unregister any existing SWs to avoid caching interference while developing
		navigator.serviceWorker.getRegistrations().then(regs => {
			for (const r of regs) {
				try { r.unregister(); } catch {}
			}
		});
	} else {
		window.addEventListener('load', () => {
			const base = (import.meta.env && import.meta.env.BASE_URL) || '/';
			const swUrl = `${base}sw.js`;
			navigator.serviceWorker.register(swUrl, { scope: base }).then(reg => {
				// Force periodic update check on load
				try { reg.update(); } catch {}
				const checkWaiting = () => {
					if (reg.waiting) {
						try { window.dispatchEvent(new CustomEvent('br_update_available', { detail: { registration: reg } })); } catch {}
					}
				};
				reg.addEventListener('updatefound', () => {
					const inst = reg.installing;
					if (inst) {
						inst.addEventListener('statechange', () => { if (inst.state === 'installed') checkWaiting(); });
					}
				});
				checkWaiting();
			}).catch(() => {});
			navigator.serviceWorker.addEventListener('controllerchange', () => {
				if (window.__br_userInitiatedUpdate && !window.__reloadedForSW) {
					window.__reloadedForSW = true;
					window.location.reload();
				}
			});
		});
	}
}
