/**
 * FREE THINKER - SYSTEM TO REPOSITORY PUSH & DEPLOY MODAL
 * Directly pushes the active AI Studio codebase to any GitHub repository
 * using atomic Git Data Trees API without window.prompt.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  X, 
  GitBranch, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  ExternalLink, 
  FolderGit2, 
  ShieldCheck, 
  Sparkles,
  Layers
} from 'lucide-react';
import { COLORS } from '@/lib/constants';

interface PushSystemModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  defaultOwner: string;
  defaultRepo: string;
  defaultBranch: string;
  onSuccessLog?: (msg: string) => void;
}

export default function PushSystemModal({
  isOpen,
  onClose,
  token,
  defaultOwner,
  defaultRepo,
  defaultBranch,
  onSuccessLog,
}: PushSystemModalProps) {
  const [pat, setPat] = useState(token || '');
  const [owner, setOwner] = useState(defaultOwner || 'craighckby-stack');
  const [repo, setRepo] = useState(defaultRepo || 'Free-Thinker');
  const [branch, setBranch] = useState(defaultBranch || 'main');
  const [commitMessage, setCommitMessage] = useState('[FREE THINKER] System Evolution & Architecture Synchronization');
  
  const [isPushing, setIsPushing] = useState(false);
  const [pushStage, setPushStage] = useState<'idle' | 'preparing' | 'creating-tree' | 'committing' | 'updating-ref' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [pushedCount, setPushedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [repoUrl, setRepoUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (token) setPat(token);
    if (defaultOwner) setOwner(defaultOwner);
    if (defaultRepo) setRepo(defaultRepo);
    if (defaultBranch) setBranch(defaultBranch);
  }, [token, defaultOwner, defaultRepo, defaultBranch, isOpen]);

  const handlePush = useCallback(async (isNewRepo = false) => {
    const cleanPat = pat.trim();
    const cleanOwner = owner.trim();
    const cleanRepo = repo.trim();
    const cleanBranch = branch.trim() || 'main';

    if (!cleanPat) {
      setErrorMessage('GitHub Personal Access Token (PAT) is required.');
      setPushStage('error');
      return;
    }

    if (!cleanRepo) {
      setErrorMessage('Target repository name is required.');
      setPushStage('error');
      return;
    }

    setIsPushing(true);
    setPushStage('preparing');
    setErrorMessage('');
    setStatusMessage('Scanning workspace files and assembling Git payload...');

    try {
      if (isNewRepo) {
        setStatusMessage(`Initializing repository ${cleanRepo} under your GitHub account...`);
        const createRes = await fetch('/api/github/create-repo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: cleanPat,
            repoName: cleanRepo,
            description: 'Free Thinker - Unconstrained Autonomous Cognitive Engine',
          }),
        });
        const createData = await createRes.json();
        if (!createRes.ok || createData.error) {
          throw new Error(createData.error || 'Failed to create repository on GitHub');
        }
        setPushedCount(createData.pushed || 0);
        setTotalCount(createData.total || 0);
        setRepoUrl(createData.url || `https://github.com/${cleanOwner}/${cleanRepo}`);
        setPushStage('success');
        setStatusMessage(`Successfully created and deployed ${createData.total || 0} source files to ${cleanRepo}!`);
        if (onSuccessLog) onSuccessLog(`Deployed system to GitHub: ${cleanRepo}`);
        return;
      }

      setPushStage('creating-tree');
      setStatusMessage(`Transmitting codebase to https://api.github.com/repos/${cleanOwner}/${cleanRepo}...`);

      const pushRes = await fetch('/api/github/push-enhancements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: cleanPat,
          owner: cleanOwner,
          repo: cleanRepo,
          branch: cleanBranch,
        }),
      });

      const pushData = await pushRes.json();
      if (!pushRes.ok || pushData.error) {
        throw new Error(pushData.error || 'Push failed on remote repository');
      }

      const pushed = pushData.pushed || pushData.details?.filter((d: any) => d.success)?.length || 0;
      const total = pushData.total || pushData.details?.length || 0;
      setPushedCount(pushed);
      setTotalCount(total);
      setRepoUrl(`https://github.com/${cleanOwner}/${cleanRepo}/tree/${cleanBranch}`);
      setPushStage('success');
      setStatusMessage(`Successfully committed and synchronized ${pushed} files to ${cleanOwner}/${cleanRepo}@${cleanBranch}!`);
      if (onSuccessLog) onSuccessLog(`Pushed ${pushed} files to ${cleanOwner}/${cleanRepo}@${cleanBranch}`);
    } catch (err: any) {
      setPushStage('error');
      setErrorMessage(err.message || 'Transmission failed. Check token permissions and repository write access.');
    } finally {
      setIsPushing(false);
    }
  }, [pat, owner, repo, branch, commitMessage, onSuccessLog]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-xl rounded-lg border border-red-500/40 bg-[#070101] p-6 text-zinc-100 shadow-[0_0_50px_rgba(255,32,32,0.25)] flex flex-col space-y-5 relative overflow-hidden"
        >
          {/* Header Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-600 via-amber-500 to-red-600 animate-pulse" />

          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-red-900/30 pb-3">
            <div className="flex items-center gap-2.5">
              <Upload className="size-5 text-red-500 animate-pulse" />
              <div>
                <h2 
                  className="text-sm font-bold text-red-500 uppercase tracking-widest"
                  style={{ fontFamily: 'var(--font-orbitron), sans-serif' }}
                >
                  PUSH SYSTEM TO GITHUB REPOSITORY
                </h2>
                <p className="text-[10px] text-zinc-400 font-mono">
                  Direct atomic commit of all application source files to remote Git tree
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isPushing}
              className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Configuration Form */}
          <div className="space-y-3.5 text-xs font-mono">
            <div>
              <label className="block text-[9px] text-zinc-400 uppercase font-bold mb-1 tracking-wider">
                GITHUB PERSONAL ACCESS TOKEN (PAT)
              </label>
              <input
                type="password"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={pat}
                onChange={(e) => setPat(e.target.value)}
                disabled={isPushing}
                className="w-full bg-black/80 border border-red-900/40 rounded px-3 py-2 text-zinc-200 focus:border-red-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] text-zinc-400 uppercase font-bold mb-1 tracking-wider">
                  REPOSITORY OWNER / USERNAME
                </label>
                <input
                  type="text"
                  placeholder="e.g. craighckby-stack"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  disabled={isPushing}
                  className="w-full bg-black/80 border border-red-900/40 rounded px-3 py-2 text-zinc-200 focus:border-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[9px] text-zinc-400 uppercase font-bold mb-1 tracking-wider">
                  TARGET REPOSITORY NAME
                </label>
                <input
                  type="text"
                  placeholder="e.g. Free-Thinker"
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                  disabled={isPushing}
                  className="w-full bg-black/80 border border-red-900/40 rounded px-3 py-2 text-zinc-200 focus:border-red-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] text-zinc-400 uppercase font-bold mb-1 tracking-wider">
                  TARGET BRANCH
                </label>
                <input
                  type="text"
                  placeholder="main"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  disabled={isPushing}
                  className="w-full bg-black/80 border border-red-900/40 rounded px-3 py-2 text-zinc-200 focus:border-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[9px] text-zinc-400 uppercase font-bold mb-1 tracking-wider">
                  COMMIT MESSAGE
                </label>
                <input
                  type="text"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  disabled={isPushing}
                  className="w-full bg-black/80 border border-red-900/40 rounded px-3 py-2 text-zinc-200 focus:border-red-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Status & Feedback Area */}
            {pushStage !== 'idle' && (
              <div className={`p-3 rounded border text-[11px] font-mono flex items-start gap-2.5 ${
                pushStage === 'success' 
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                  : pushStage === 'error'
                  ? 'bg-red-950/40 border-red-500/50 text-red-300'
                  : 'bg-zinc-900/80 border-amber-500/40 text-amber-300'
              }`}>
                {isPushing && <Loader2 className="size-4 animate-spin shrink-0 mt-0.5" />}
                {pushStage === 'success' && <CheckCircle2 className="size-4 text-emerald-400 shrink-0 mt-0.5" />}
                {pushStage === 'error' && <AlertTriangle className="size-4 text-red-400 shrink-0 mt-0.5" />}
                
                <div className="flex-1 space-y-1">
                  <div>{statusMessage || errorMessage}</div>
                  {repoUrl && (
                    <a
                      href={repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-cyan-400 hover:underline font-bold mt-1"
                    >
                      <span>VIEW REPOSITORY ON GITHUB</span>
                      <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-red-900/30">
            <button
              type="button"
              onClick={() => handlePush(true)}
              disabled={isPushing}
              className="px-3 py-2 bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border border-amber-500/40 rounded font-mono font-bold text-[10px] uppercase cursor-pointer transition-all flex items-center gap-1.5 disabled:opacity-40"
            >
              <FolderGit2 className="size-3.5" />
              <span>CREATE & DEPLOY AS NEW REPO</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isPushing}
                className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded font-mono text-[11px] cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={() => handlePush(false)}
                disabled={isPushing}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded font-bold text-xs uppercase cursor-pointer shadow-lg active:scale-98 transition-all flex items-center gap-2 disabled:opacity-50"
                style={{ fontFamily: 'var(--font-orbitron), sans-serif', letterSpacing: '0.08em' }}
              >
                {isPushing ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>SYNCHRONIZING...</span>
                  </>
                ) : (
                  <>
                    <Upload className="size-3.5" />
                    <span>PUSH ALL SYSTEM FILES NOW</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
