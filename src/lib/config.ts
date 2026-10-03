/**
 * DARLEK CANN ARCHITECTURAL HEADER
 * File: src/lib/config.ts
 * Role: Core system component participating in autonomous cognitive evolution cycles.
 * Architecture: Type-safe modular unit with resilient state interfaces.
 */

const getEnvironmentFlag = (key: string): boolean => {
  const processValue = typeof process !== 'undefined' ? process.env?.[`NEXT_PUBLIC_${key}`] || process.env?.[key] : undefined;
  const metaValue = typeof import.meta !== 'undefined' ? import.meta.env?.[`VITE_${key}`] : undefined;

  return processValue === 'true' || metaValue === 'true';
};

export const RAG_RETRIEVAL_ENABLED = getEnvironmentFlag('RAG_RETRIEVAL_ENABLED');

export const AUTONOMOUS_HOTSWAP_ENABLED = getEnvironmentFlag('AUTONOMOUS_HOTSWAP_ENABLED');
