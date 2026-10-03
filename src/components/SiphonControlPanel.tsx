/**
 * FREE THINKER - AUTONOMOUS REPOSITORY SIPHON CONTROL PANEL
 * Visual interface for autonomous repository discovery, siphoning, and code transfusion.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Dna, 
  Search, 
  Download, 
  Sparkles, 
  Zap, 
  Trash2, 
  Code2, 
  ExternalLink, 
  Loader2, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp,
  Cpu,
  Layers
} from 'lucide-react';
import { 
  SiphonedRepo, 
  getStoredSiphonedRepos, 
  saveStoredSiphonedRepo, 
  removeStoredSiphonedRepo, 
  getAutoSiphonState, 
  setAutoSiphonState,
  CURATED_SIPHON_REPOSITORIES 
} from '@/lib/repoSiphon';
import { saveMutationToRag } from '@/lib/ragBrain';
import { COLORS } from '@/lib/constants';

interface SiphonControlPanelProps {
  token: string;
  onSiphonLog?: (msg: string) => void;
  onInjectCode?: (codeSnippet: string) => void;
}

export default function SiphonControlPanel({
  token,
  onSiphonLog,
  onInjectCode,
}: SiphonControlPanelProps) {
  const [autoSiphon, setAutoSiphon] = useState<boolean>(true);
  const [siphonedRepos, setSiphonedRepos] = useState<SiphonedRepo[]>([]);
  const [queryInput, setQueryInput] = useState('');
  const [isSiphoning, setIsSiphoning] = useState(false);
  const [siphonStatus, setSiphonStatus] = useState<string | null>(null);
  const [expandedRepoId, setExpandedRepoId] = useState<string | null>(null);

  useEffect(() => {
    setAutoSiphon(getAutoSiphonState());
    setSiphonedRepos(getStoredSiphonedRepos());
  }, []);

  const handleToggleAutoSiphon = useCallback(() => {
    const next = !autoSiphon;
    setAutoSiphon(next);
    setAutoSiphonState(next);
    if (onSiphonLog) {
      onSiphonLog(`Autonomous Repository Siphon ${next ? 'ENGAGED' : 'DISENGAGED'}`);
    }
  }, [autoSiphon, onSiphonLog]);

  const handleSiphonRepo = useCallback(async (targetRepo?: string, query?: string) => {
    const target = targetRepo || queryInput.trim();
    if (!target && !query) return;

    setIsSiphoning(true);
    setSiphonStatus(`Siphoning intelligence from ${target || query}...`);

    try {
      const res = await fetch('/api/github/siphon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          repoUrlOrName: target,
          query: query || (!target.includes('/') ? target : undefined),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.siphonedRepo) {
        throw new Error(data.error || 'Failed to siphon repository');
      }

      const repo = data.siphonedRepo as SiphonedRepo;
      saveStoredSiphonedRepo(repo);
      setSiphonedRepos(getStoredSiphonedRepos());
      setExpandedRepoId(repo.id);
      setSiphonStatus(`Successfully siphoned ${repo.siphonedFiles.length} modules from ${repo.fullName}!`);
      setQueryInput('');

      // Auto-save siphoned snippets to RAG memory bank
      for (const file of repo.siphonedFiles) {
        await saveMutationToRag({
          filePath: `${repo.fullName}/${file.path}`,
          originalCode: '// Siphoned external repository source pattern',
          mutatedCode: file.codeSnippet,
          rationale: `Autonomously siphoned high-leverage architectural construct from ${repo.fullName}`,
          riskScore: 2,
          qualityScore: 98,
        });
      }

      if (onSiphonLog) {
        onSiphonLog(`Siphoned ${repo.siphonedFiles.length} files from ${repo.fullName} into RAG memory vector bank.`);
      }
    } catch (err: any) {
      setSiphonStatus(`Siphon failed: ${err.message || 'Error reaching repository'}`);
    } finally {
      setIsSiphoning(false);
    }
  }, [queryInput, token, onSiphonLog]);

  const handleDeleteRepo = useCallback((fullName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeStoredSiphonedRepo(fullName);
    setSiphonedRepos(getStoredSiphonedRepos());
  }, []);

  return (
    <div className="bg-[#050000] border border-cyan-500/30 rounded-lg p-3 space-y-3 font-mono text-xs text-zinc-200">
      {/* Header & Toggle */}
      <div className="flex items-center justify-between border-b border-cyan-900/30 pb-2">
        <div className="flex items-center gap-2">
          <Dna className="size-4 text-cyan-400 animate-pulse" />
          <span 
            className="text-[11px] font-bold text-cyan-400 tracking-wider uppercase"
            style={{ fontFamily: 'var(--font-orbitron), sans-serif' }}
          >
            AUTONOMOUS REPOSITORY SIPHON
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[9px] text-zinc-400">AUTO-SIPHON:</span>
          <button
            onClick={handleToggleAutoSiphon}
            type="button"
            className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-colors cursor-pointer ${
              autoSiphon 
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' 
                : 'bg-zinc-800 text-zinc-500 border-zinc-700'
            }`}
          >
            {autoSiphon ? 'ACTIVE' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Manual Siphon Input */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            placeholder="Enter repo (e.g. facebook/react or search term)"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSiphonRepo()}
            disabled={isSiphoning}
            className="flex-1 bg-black border border-cyan-900/40 rounded px-2.5 py-1.5 text-[11px] text-zinc-200 focus:border-cyan-400 focus:outline-none"
          />
          <button
            onClick={() => handleSiphonRepo()}
            disabled={isSiphoning || !queryInput.trim()}
            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-black font-bold rounded text-[10px] uppercase flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-40"
          >
            {isSiphoning ? <Loader2 className="size-3 animate-spin" /> : <Download className="size-3" />}
            <span>SIPHON</span>
          </button>
        </div>

        {/* Quick Siphon Presets */}
        <div className="flex flex-wrap gap-1 items-center pt-0.5">
          <span className="text-[8px] text-zinc-500 font-bold">PRESETS:</span>
          {CURATED_SIPHON_REPOSITORIES.map((preset) => (
            <button
              key={preset.fullName}
              onClick={() => handleSiphonRepo(preset.fullName)}
              disabled={isSiphoning}
              className="px-1.5 py-0.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/60 rounded text-[8px] text-cyan-300 hover:text-white transition-colors cursor-pointer"
            >
              +{preset.fullName.split('/')[1]}
            </button>
          ))}
        </div>
      </div>

      {/* Status message */}
      {siphonStatus && (
        <div className="text-[10px] text-cyan-300 bg-cyan-950/30 p-2 rounded border border-cyan-900/40">
          {siphonStatus}
        </div>
      )}

      {/* Siphoned Repositories List */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[9px] text-zinc-400 font-bold uppercase">
          <span>SIPHONED REPOSITORY INTELLIGENCE ({siphonedRepos.length})</span>
          <span className="text-cyan-400">RAG PERSISTED</span>
        </div>

        {siphonedRepos.length === 0 ? (
          <div className="text-[10px] text-zinc-500 text-center py-3 bg-black/40 rounded border border-zinc-900">
            No repositories siphoned yet. Enter a repository name or click a preset to siphon code patterns.
          </div>
        ) : (
          <div className="max-h-48 overflow-y-auto dalek-scrollbar space-y-1.5 pr-1">
            {siphonedRepos.map((repo) => {
              const isExpanded = expandedRepoId === repo.id;
              return (
                <div 
                  key={repo.id}
                  className="bg-black/60 border border-cyan-950 rounded p-2 transition-all"
                >
                  <div 
                    onClick={() => setExpandedRepoId(isExpanded ? null : repo.id)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <Code2 className="size-3.5 text-cyan-400 shrink-0" />
                      <span className="text-[11px] font-bold text-cyan-200 truncate">{repo.fullName}</span>
                      <span className="text-[9px] text-zinc-500">({repo.siphonedFiles.length} files)</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleDeleteRepo(repo.fullName, e)}
                        className="text-zinc-600 hover:text-red-400 p-0.5"
                        title="Delete from siphon memory"
                      >
                        <Trash2 className="size-3" />
                      </button>
                      {isExpanded ? <ChevronUp className="size-3 text-zinc-400" /> : <ChevronDown className="size-3 text-zinc-400" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-2 pt-2 border-t border-zinc-800 space-y-1.5">
                      <p className="text-[9px] text-zinc-400">{repo.description}</p>
                      <div className="space-y-1">
                        {repo.siphonedFiles.map((file, idx) => (
                          <div key={idx} className="bg-[#020202] p-1.5 rounded border border-zinc-800 text-[9px] flex items-center justify-between">
                            <span className="text-zinc-300 truncate max-w-[200px]">{file.path}</span>
                            {onInjectCode && (
                              <button
                                onClick={() => onInjectCode(file.codeSnippet)}
                                className="px-1.5 py-0.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 rounded text-[8px] font-bold cursor-pointer"
                              >
                                INJECT
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
