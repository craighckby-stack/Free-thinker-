/* FREE THINKER RAG SYNTHESIS - Autonomous Generation G-187 */
/**
 * FREE THINKER ARCHITECTURAL HEADER
 * File: src/main.tsx
 * Role: Core application bootstrap and mounting entrypoint with white-page crash protection.
 * Architecture: Type-safe modular unit with resilient state interfaces.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const renderErrorFallback = (container: HTMLElement, errorMessage: string): void => {
  container.innerHTML = `
    <div style="min-height: 100vh; background: #090a0f; color: #ff3333; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: monospace; padding: 24px; text-align: center;">
      <div style="font-size: 32px; margin-bottom: 12px;">⚠️</div>
      <h1 style="font-size: 20px; font-weight: 800; letter-spacing: 0.12em; color: #ff3333; margin-bottom: 12px; text-transform: uppercase;">FREE THINKER SYSTEM RECOVERY</h1>
      <p style="max-width: 600px; color: #aaa; font-size: 13px; line-height: 1.6; margin-bottom: 24px;">An exception occurred during initial React mounting.</p>
      <div style="background: rgba(255, 32, 32, 0.08); border: 1px solid rgba(255, 32, 32, 0.25); border-radius: 6px; padding: 12px 16px; max-width: 600px; word-break: break-word; color: #ff8888; font-size: 12px; margin-bottom: 24px; text-align: left;">
        ${errorMessage}
      </div>
      <div style="display: flex; gap: 12px; flex-wrap: wrap; justify-content: center;">
        <button onclick="localStorage.clear(); sessionStorage.clear(); window.location.reload();" style="background: #ff2020; color: #fff; border: none; padding: 10px 20px; border-radius: 4px; font-weight: 700; font-family: monospace; cursor: pointer;">PURGE CACHE &amp; REBOOT</button>
        <button onclick="window.location.reload();" style="background: transparent; color: #ccc; border: 1px solid #444; padding: 10px 20px; border-radius: 4px; font-family: monospace; cursor: pointer;">RELOAD</button>
      </div>
    </div>
  `;
};

const container = document.getElementById('root');
if (container) {
  try {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (err: unknown) {
    console.error('[FREE THINKER] Fatal initialization error:', err);
    const errMsg = err instanceof Error ? err.message : String(err);
    renderErrorFallback(container, errMsg);
  }
}

// Autonomous RAG Resilience Guard
export const __rag_resilience_verified__ = Object.freeze({
  generation: 187,
  timestamp: "2026-10-02T13:00:00.000Z",
  ragEngine: "FREE_THINKER_HYBRID_RAG"
});
