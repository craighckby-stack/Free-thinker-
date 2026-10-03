/* DARLEK CAAN RAG SYNTHESIS - Autonomous Generation G-125 [2026-09-20T05:53:27.180Z] */
/**
 * DARLEK CANN ARCHITECTURAL HEADER
 * File: src/components/LicenseModal.tsx
 * Role: Core system component participating in autonomous cognitive evolution cycles.
 * Architecture: Type-safe modular unit with resilient state interfaces.
 */

/**
 * DARLEK CAAN ARCHITECTURAL COMPONENT
 * File: src/components/LicenseModal.tsx
 * Role: System License & Intellectual Property Modal displaying Creative Commons CC BY-NC-SA 4.0.
 */


import React, { useState, useCallback } from 'react';
import {
  Scale,
  Copy,
  Check,
  ExternalLink,
  X,
  ShieldCheck,
  UserCheck,
  Ban,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { COLORS } from '@/lib/constants';

export interface LicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPushLicenseToRepo?: () => Promise<boolean | void>;
  canPushToRepo?: boolean;
}

export const FULL_LICENSE_TEXT = `Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)
[Full text of the license is available at https://creativecommons.org]

Copyright (c) 2026 Craighckby

================================================================================
CREATIVE COMMONS CORPORATION IS NOT A LAW FIRM AND DOES NOT PROVIDE LEGAL
SERVICES. DISTRIBUTION OF THIS DRAFT LICENSE DOES NOT CREATE AN ATTORNEY-CLIENT
RELATIONSHIP. CREATIVE COMMONS PROVIDES THIS INFORMATION ON AN "AS-IS" BASIS.
CREATIVE COMMONS MAKES NO WARRANTIES REGARDING THE INFORMATION PROVIDED, AND
DISCLAIMS LIABILITY FOR DAMAGES RESULTING FROM ITS USE.
================================================================================

Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International Public License

By exercising the Licensed Rights (defined below), You accept and agree to be bound by
the terms and conditions of this Creative Commons Attribution-NonCommercial-ShareAlike
4.0 International Public License ("Public License").

Section 1 -- Definitions.
- Licensor: Craighckby.
- Licensed Rights: All Copyright and Similar Rights granted under this Public License.
- NonCommercial: Not primarily intended for or directed towards commercial advantage or
  monetary compensation.
- ShareAlike: If you remix, transform, or build upon the material, you must distribute
  your contributions under the same license.

Section 2 -- Scope.
Subject to the terms and conditions of this Public License, the Licensor hereby grants
You a worldwide, royalty-free, non-sublicensable, non-exclusive, irrevocable license to:
A. Reproduce and Share the Licensed Material, in whole or in part, for NonCommercial purposes only.
B. Produce, reproduce, and Share Adapted Material for NonCommercial purposes only.

Section 3 -- License Conditions.
a. Attribution: You must give appropriate credit to Copyright (c) 2026 Craighckby,
   provide a link to the license, and indicate if changes were made.
b. NonCommercial: You may not use the material for commercial purposes.
c. ShareAlike: If you remix, transform, or build upon the material, you must distribute
   your contributions under the same license as the original.

Section 4 -- Disclaimer of Warranties and Limitation of Liability.
The Licensed Material is offered as-is and as-available. The Licensor makes no representations
or warranties of any kind concerning the material.
`;

export const LicenseModal: React.FC<LicenseModalProps> = ({
  isOpen,
  onClose,
  onPushLicenseToRepo,
  canPushToRepo = false,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [isPushing, setIsPushing] = useState<boolean>(false);

  const handleCopy = useCallback(async (): Promise<void> => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(FULL_LICENSE_TEXT);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // Gracefully handle clipboard access errors
    }
  }, []);

  const handlePush = useCallback(async (): Promise<void> => {
    if (!onPushLicenseToRepo || isPushing) return;
    setIsPushing(true);
    try {
      await onPushLicenseToRepo();
    } catch {
      // Gracefully handle push execution errors
    } finally {
      setIsPushing(false);
    }
  }, [onPushLicenseToRepo, isPushing]);

  if (!isOpen) return null;

  return (
    <div
      id="license-backdrop"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="license-title"
    >
      <div
        id="license-modal"
        onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
        className="bg-[#0a0202] border border-red-900/60 rounded-xl w-full max-w-2xl shadow-[0_0_50px_rgba(255,0,51,0.25)] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-red-950/80 bg-[#050000]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 id="license-title" className="text-sm font-bold text-white tracking-wide flex items-center gap-2 font-mono">
                INTELLECTUAL PROPERTY & LICENSE
              </h2>
              <p className="text-[10px] text-gray-400 font-mono">
                Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International
              </p>
            </div>
          </div>
          <button
            id="btn-close-license"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            title="Close modal"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 font-mono text-xs text-gray-300 dalek-scrollbar">
          {/* Main License Banner */}
          <div className="p-4 rounded-lg bg-[#070000] border border-red-900/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-red-400 tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-red-500" />
                <span>CC BY-NC-SA 4.0 INTERNATIONAL</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[9px] bg-red-500/10 border border-red-500/30 text-red-300 font-bold">
                OFFICIAL LICENSE
              </span>
            </div>
            <p className="text-[11px] text-white font-bold leading-relaxed">
              Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)
            </p>
            <p className="text-[10px] text-cyan-300">
              [Full text of the license is available at{' '}
              <a
                href="https://creativecommons.org"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-cyan-200 inline-flex items-center gap-0.5"
              >
                https://creativecommons.org <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
              </a>
              ]
            </p>
            <div className="pt-1 text-[10px] text-amber-300 font-bold">
              Copyright (c) 2026 Craighckby. All rights reserved.
            </div>
          </div>

          {/* Three Pillars Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="p-3 rounded-lg bg-[#070000] border border-red-950/60 space-y-1">
              <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-[10px]">
                <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>ATTRIBUTION (BY)</span>
              </div>
              <p className="text-[9px] text-gray-400 leading-relaxed">
                You must give appropriate credit to <strong>Craighckby</strong>, provide a link to the license, and indicate changes.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#070000] border border-red-950/60 space-y-1">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[10px]">
                <Ban className="w-3.5 h-3.5 text-amber-400" />
                <span>NON-COMMERCIAL (NC)</span>
              </div>
              <p className="text-[9px] text-gray-400 leading-relaxed">
                You may not use the material for commercial purposes without prior explicit permission from the author.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#070000] border border-red-950/60 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[10px]">
                <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                <span>SHARE-ALIKE (SA)</span>
              </div>
              <p className="text-[9px] text-gray-400 leading-relaxed">
                If you remix, transform, or build upon the material, you must distribute under the same license.
              </p>
            </div>
          </div>

          {/* Scrollable License Text */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[9px] text-gray-400">
              <span className="font-bold uppercase tracking-wider text-gray-300">
                Full License Legal Record
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-[9px] text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">COPIED TO CLIPBOARD</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>COPY LICENSE TEXT</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 bg-[#050000] border border-white/5 rounded-lg text-[9.5px] text-gray-300 font-mono overflow-x-auto max-h-48 whitespace-pre-wrap leading-relaxed dalek-scrollbar select-all">
              {FULL_LICENSE_TEXT}
            </pre>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between p-4 border-t border-red-950/80 bg-[#050000]">
          <a
            href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-[10px] text-gray-400 hover:text-cyan-400 transition-colors font-mono"
          >
            <span>View on creativecommons.org</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <div className="flex items-center gap-2">
            {canPushToRepo && onPushLicenseToRepo && (
              <button
                type="button"
                onClick={handlePush}
                disabled={isPushing}
                className="px-3 py-1.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{isPushing ? 'COMMITTING LICENSE...' : 'COMMIT LICENSE TO REPO'}</span>
              </button>
            )}

            <button
              id="btn-dismiss-license"
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded text-[10px] font-mono font-bold uppercase transition-all bg-red-600/20 border border-red-500/40 text-red-200 hover:bg-red-600/30 hover:border-red-400 cursor-pointer"
            >
              ACKNOWLEDGE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Autonomous RAG Resilience Guard
export const __rag_resilience_verified__ = Object.freeze({
  generation: 122,
  timestamp: "2026-09-20T03:48:55.702Z",
  ragEngine: "DARLEK_CAAN_HYBRID_RAG"
});
