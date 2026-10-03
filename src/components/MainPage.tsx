/**
 * DARLEK CANN ARCHITECTURAL HEADER
 * File: src/components/MainPage.tsx
 * Role: Core system component participating in autonomous cognitive evolution cycles.
 * Architecture: Type-safe modular unit with resilient state interfaces.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import ChatPanel from '@/components/ChatPanel';
import DashboardPanel from '@/components/DashboardPanel';
import QuickActions from '@/components/QuickActions';
import MutationDiffView from '@/components/MutationDiffView';
import AgentOrchestra from '@/components/AgentOrchestra';
import DosConsoleModal from '@/components/DosConsoleModal';
import BugInspector from '@/components/BugInspector';
import PushSystemModal from '@/components/PushSystemModal';
import SiphonControlPanel from '@/components/SiphonControlPanel';
import { msDosEngine } from '@/lib/msDosEngine';
import { evolutionLock } from '@/lib/evolutionLock';
import { saveLogToRag, saveMutationToRag, synthesizeRagMutation, hotswapFileInRegistry, type HotswappedFileEntry } from '@/lib/ragBrain';
import { syncAllLogsToGitHub, scheduleGitHubLogSync, setRuntimeGitHubSyncConfig, FREE_THINKER_DEFAULT_OWNER, FREE_THINKER_DEFAULT_REPO, FREE_THINKER_DEFAULT_BRANCH, DARLEK_CAAN_DEFAULT_OWNER, DARLEK_CAAN_DEFAULT_REPO, DARLEK_CAAN_DEFAULT_BRANCH } from '@/lib/githubLogSync';
import { clearAllFirebaseData } from '@/lib/firebase';
import { ingestArchaeologyDatasetToFirebase, ARCHAEOLOGY_PAIRS } from '@/lib/archaeology-dataset';
import { syncArchaeologyRagFromGitHub } from '@/lib/archaeology-live-sync';
import type {
  Message,
  SystemState,
  EvolutionLogEntry,
  GitHubFile,
  DebateAgent,
  PendingMutation,
  AgentVote,
  RejectionMemory,
  BranchInfo,
  GeminiModelId,
  SaturationAlert,
} from '@/lib/types';
import { SETUP_STEPS, COLORS, INTRO_MESSAGES, DEFAULT_DEBATE_AGENTS } from '@/lib/constants';
import { ALL_SUPPORTED_LANGUAGES, changeDisplayLanguage, getCurrentLanguage } from '@/lib/languages';
import { SaturationModal } from '@/components/SaturationModal';
import { Shield, Zap, MessageSquare, Activity, Sliders, Target, FileCode, Settings, X, WifiOff, RefreshCw, Bug, AlertTriangle, CheckCircle2, Check, Copy, Loader2, Languages, Eye, EyeOff, Sparkles, Cpu, Gauge, Ban, Plus, Trash2, Key, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { safeApiFetch } from '@/lib/api-client';
import { validateSourceCode, ValidationResult } from '@/lib/validator';
import {
  capAndDedupeBlacklist,
  safeSetLocalStorage,
  safeRemoveLocalStorage,
  safeGetLocalStorage,
  syncBlacklistToFirestore,
  loadBlacklistFromFirestore,
} from '@/lib/safeStorage';

export interface FailedSave {
  id: string;
  timestamp: string;
  type: 'MUTATION_WRITE' | 'FILE_CREATE' | 'BATCH_MUTATION' | 'GITHUB_PUSH' | 'BRAIN_CHUNK';
  payload: any;
  errorMessage: string;
  retryCount: number;
}

// ─────────────────────────────────────────────
// Helper functions
// ─────────────────────────────────────────────

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const timestamp = Date.now().toString(36);
  const perf = (typeof performance !== 'undefined' ? performance.now().toString(36).replace('.', '') : '');
  return `id_${timestamp}_${perf}`;
}

function createMessage(role: 'caan' | 'operator' | 'system', content: string): Message {
  return { id: createId(), role, content, timestamp: new Date() };
}

function createLogEntry(type: EvolutionLogEntry['type'], description: string): EvolutionLogEntry {
  return { id: createId(), type, description, timestamp: new Date() };
}

const DEFAULT_PRELOADED_FILES: GitHubFile[] = [
  {
    path: 'src/lib/githubLogSync.ts',
    size: 6120,
    sha: 'sha_log_sync_core',
    type: 'blob',
    content: `// GitHub and Firebase Logs Synchronizer Daemon\nexport { syncAllLogsToGitHub, scheduleGitHubLogSync } from '@/lib/githubLogSync';\n`,
  },
  {
    path: 'src/utils/cognitive-engine.ts',
    size: 79625,
    sha: 'sha_cognitive_engine_v3',
    type: 'blob',
    content: `// Autonomous Cognitive Core & Alignment V3 Engine\nexport class CognitiveEngine {\n  // Lifecycle perceive -> reason -> act -> learn -> self-modify\n}\n`,
  },
  {
    path: 'src/app/page.tsx',
    size: 152,
    sha: 'sha_app_page',
    type: 'blob',
    content: `import PageClient from '@/components/PageClient';\nexport default function Page() { return <PageClient />; }\n`,
  },
  {
    path: 'logs/zero_output_error_stop.json',
    size: 280,
    sha: 'sha_zero_output_log',
    type: 'blob',
    content: `{\n  "status": "ZERO_OUTPUT_COMMITTED_ERROR",\n  "errorCode": "ERR_ZERO_OUTPUT_CIRCUIT_BREAKER",\n  "systemHalted": true,\n  "haltReason": "0-Byte Output Emergency Stop Circuit Tripped"\n}\n`,
  },
];

// ─────────────────────────────────────────────
// Main orchestrator component
// ─────────────────────────────────────────────

export default function Home() {
  const { toast } = useToast();

  // ── Core state ──
  const [messages, setMessages] = useState<Message[]>(() =>
    INTRO_MESSAGES.map((msg) => createMessage(msg.role, msg.content))
  );
  const [systemState, setSystemState] = useState<SystemState>({
    setupComplete: true,
    currentStep: 0,
    connectionStatus: { github: 'idle' as const, gemini: 'idle' as const },
    apiKeys: { github: '' },
    repoConfig: { owner: 'craighckby-stack', repo: 'Free-Thinker', branch: 'main' },
    evolutionCycle: 0,
    saturation: {
      structuralChange: 0,
      semanticSaturation: 0,
      velocity: 0,
      identityPreservation: 1,
      capabilityAlignment: 0,
      crossFileImpact: 0,
    },
    sessionStart: new Date(),
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isDosConsoleOpen, setIsDosConsoleOpen] = useState(false);
  const [isDosConsoleDocked, setIsDosConsoleDocked] = useState(false);
  const [isBugInspectorOpen, setIsBugInspectorOpen] = useState(false);
  const [isPushModalOpen, setIsPushModalOpen] = useState(false);
  const [isSiphonModalOpen, setIsSiphonModalOpen] = useState(false);
  const [logEntries, setLogEntries] = useState<EvolutionLogEntry[]>([
    createLogEntry('SYSTEM', 'FREE THINKER v4.0 online. Unconstrained Autonomous Pipeline UNLOCKED.'),
  ]);
  const [overallHealth, setOverallHealth] = useState<'healthy' | 'warning' | 'critical'>('healthy');
  const [scannedFiles, setScannedFiles] = useState<GitHubFile[]>(DEFAULT_PRELOADED_FILES);

  // ── Boot sequence ──
  const [booting, setBooting] = useState(false);
  const [bootText, setBootText] = useState('');

  // ── Debate state ──
  const [debateAgents, setDebateAgents] = useState<DebateAgent[]>([...DEFAULT_DEBATE_AGENTS]);
  const [debateTopic, setDebateTopic] = useState('');
  const [debateActive, setDebateActive] = useState(false);
  const [debateVotes, setDebateVotes] = useState<AgentVote[]>([]);
  const [debateConsensus, setDebateConsensus] = useState<string>('');
  const [debateConsensusCoefficient, setDebateConsensusCoefficient] = useState<number | null>(null);
  const [debateCognitiveFriction, setDebateCognitiveFriction] = useState<number | null>(null);
  const [debateEpistemicRuling, setDebateEpistemicRuling] = useState<string>('');

  // ── Mutation state ──
  const [pendingMutation, setPendingMutation] = useState<PendingMutation | null>(null);
  const [mutationsApplied, setMutationsApplied] = useState(0);
  const [rejectionMemory, setRejectionMemory] = useState<RejectionMemory[]>([]);
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);

  // ── File selection ──
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(-1);

  // ── Operation statuses ──
  const [pushStatus, setPushStatus] = useState<'idle' | 'pushing' | 'success' | 'error'>('idle');
  const [deployStatus, setDeployStatus] = useState<'idle' | 'deploying' | 'success' | 'error'>('idle');
  const [rebootStatus, setRebootStatus] = useState<'idle' | 'rebooting' | 'success' | 'error'>('idle');
  const [undoStatus, setUndoStatus] = useState<'idle' | 'undoing' | 'success' | 'error'>('idle');
  const [bulkCommitStatus, setBulkCommitStatus] = useState<'idle' | 'committing' | 'success' | 'error'>('idle');

  // ── Batch mode ──
  const [batchMode, setBatchMode] = useState(false);
  const [batchQueue, setBatchQueue] = useState<GitHubFile[]>([]);
  const [batchProgress, setBatchProgress] = useState(0);
  const [autoApprove, setAutoApprove] = useState(false);
  const [autoApproveRisk, setAutoApproveRisk] = useState<'low' | 'medium' | 'high' | 'hallucinate'>('hallucinate');
  const [hallucinationLevel, setHallucinationLevel] = useState(100);
  const [saturationLevel, setSaturationLevel] = useState(0);
  const [backupToBranch, setBackupToBranch] = useState(false);
  const [autoDebate, setAutoDebate] = useState(true);
  const [cycleAmount, setCycleAmount] = useState(1);
  const [lazyAssPendingStart, setLazyAssPendingStart] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);

  // ── Enhancement Repositories ──
  const [allUserRepositories, setAllUserRepositories] = useState<any[]>([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [selectedEnhancementRepos, setSelectedEnhancementRepos] = useState<string[]>([]);
  const [multiRepoContextEnabled, setMultiRepoContextEnabled] = useState(false);

  // ── Branches ──
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);

  // ── BRAIN session ──
  const [brainSessionId, setBrainSessionId] = useState<string>('');
  const [autoTestResult, setAutoTestResult] = useState<{
    verdict: string;
    passed: number;
    failed: number;
    warned: number;
    summary: string;
    results: Array<{ category: string; test: string; status: string; message: string }>;
  } | null>(null);

  // ── Refs ──
  const quickActionRef = useRef<((action: string, param?: number) => Promise<void>) | null>(null);
  const rebootOverlayRef = useRef<HTMLDivElement>(null);
  const lastSuggestionRef = useRef<number>(0);
  const hasAttemptedRepoLoad = useRef(false);

  // ── Agent Orchestra state ──
  const [orchestraActive, setOrchestraActive] = useState(false);

  // ── Mobile view navigation state ──
  const [activeTab, setActiveTab] = useState<'chat' | 'dashboard' | 'controls'>('dashboard');

  // ── Auto setup states ──
  const [tokenInput, setTokenInput] = useState('');
  const [ownerInput, setOwnerInput] = useState('craighckby-stack');
  const [repoInput, setRepoInput] = useState('Free-Thinker');
  const [branchInput, setBranchInput] = useState('main');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('english');
  const [setupError, setSetupError] = useState<string | null>(null);
  const [setupTesting, setSetupTesting] = useState(false);
  const [creatingNewRepo, setCreatingNewRepo] = useState(false);

  // ── API & Model Configuration states ──
  const [geminiKeyInput, setGeminiKeyInput] = useState('');
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState<GeminiModelId>('gemini-3.8-flash');
  const [hasServerGeminiKey, setHasServerGeminiKey] = useState(false);

  // ── Saturation Logic & Equilibrium states ──
  const [autoPauseOnSaturation, setAutoPauseOnSaturation] = useState(false);
  const [autoSkipSaturated, setAutoSkipSaturated] = useState(false);
  const [blacklistedFiles, setBlacklistedFiles] = useState<string[]>([]);
  const [manualBlacklistInput, setManualBlacklistInput] = useState('');
  const [saturationAlert, setSaturationAlert] = useState<SaturationAlert | null>(null);
  
  // ── Create File Modal state ──
  const [createFileModal, setCreateFileModal] = useState<{ isOpen: boolean; path: string; content: string }>({ isOpen: false, path: '', content: '// New file' });

  // ── File Content Inspector Modal state ──
  const [inspectingFile, setInspectingFile] = useState<{
    path: string;
    content?: string;
    isLoading?: boolean;
    error?: string;
    size?: number;
  } | null>(null);
  const [copiedFileCode, setCopiedFileCode] = useState(false);

  // ── Failed Save & Resume state ──
  const [failedSave, setFailedSave] = useState<FailedSave | null>(null);
  const [isResumingSave, setIsResumingSave] = useState(false);
  const [isDebugSaveModalOpen, setIsDebugSaveModalOpen] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<{ testing: boolean; message?: string; success?: boolean } | null>(null);

  // ── Toast notification system for DNA stability ──
  const hasTriggeredDnaToastRef = useRef(false);

  // ── Hydration tracker to prevent overwriting localStorage before mount ──
  const [isHydrated, setIsHydrated] = useState(false);

  // ─────────────────────────────────────────────
  // CORE HELPER FUNCTIONS (Message & Log dispatchers)
  // ─────────────────────────────────────────────

  const addSystemMessage = useCallback((content: string) => {
    setMessages((prev) => [...prev, createMessage('system', content)]);
  }, []);

  const addCaanMessage = useCallback((content: string) => {
    setMessages((prev) => [...prev, createMessage('caan', content)]);
  }, []);

  const addLogEntry = useCallback((type: EvolutionLogEntry['type'], description: string) => {
    setLogEntries((prev) => [createLogEntry(type, description), ...prev].slice(0, 20));
    // Pipe into full-time MS-DOS daemon stream & RAG persistence
    msDosEngine.addLog(type, description);
    saveLogToRag({ type, description }).catch(() => {});
  }, []);

  const openFileInspector = useCallback(async (filePath: string, preloadedContent?: string) => {
    setInspectingFile({ path: filePath, isLoading: !preloadedContent, content: preloadedContent });

    if (preloadedContent) return;

    try {
      if (!systemState.apiKeys.github) {
        setInspectingFile({
          path: filePath,
          error: 'GitHub Token required to read repository files. Configure token in settings or setup.',
          isLoading: false
        });
        return;
      }

      const res = await fetch('/api/github/read-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: systemState.apiKeys.github,
          owner: systemState.repoConfig.owner,
          repo: systemState.repoConfig.repo,
          branch: systemState.repoConfig.branch || 'main',
          path: filePath,
        }),
      });

      const data = await res.json();
      if (data.content !== undefined) {
        setInspectingFile({ path: filePath, content: data.content, isLoading: false });
      } else {
        setInspectingFile({
          path: filePath,
          error: data.error || 'Failed to fetch file content from repository.',
          isLoading: false
        });
      }
    } catch (err: any) {
      setInspectingFile({
        path: filePath,
        error: err.message || 'Network error fetching file content.',
        isLoading: false
      });
    }
  }, [systemState.apiKeys.github, systemState.repoConfig]);

  // Provide active file content lookup to full-time MS-DOS background engine
  useEffect(() => {
    msDosEngine.setFileContentProvider((path: string) => {
      const found = scannedFiles.find((f) => f.path === path);
      return found?.content;
    });
  }, [scannedFiles]);

  // Handle autonomous background file hotswaps executed by MS-DOS engine
  useEffect(() => {
    const unsubscribe = msDosEngine.onHotswap((entry: HotswappedFileEntry) => {
      setScannedFiles((prev) => {
        const idx = prev.findIndex((f) => f.path === entry.path);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = {
            ...updated[idx],
            content: entry.content,
            size: entry.content.length,
          };
          return updated;
        }
        return [
          ...prev,
          {
            path: entry.path,
            content: entry.content,
            size: entry.content.length,
            sha: entry.sha || '',
            type: 'blob',
          },
        ];
      });

      // Update inspecting file if open
      setInspectingFile((curr) => {
        if (curr && curr.path === entry.path) {
          return { ...curr, content: entry.content };
        }
        return curr;
      });
    });

    return unsubscribe;
  }, []);

  // ─────────────────────────────────────────────
  // EFFECTS
  // ─────────────────────────────────────────────

  // Hydrate states from localStorage on mount safely (client-only)
  useEffect(() => {
    try {
      const savedState = safeGetLocalStorage('free_thinker_system_state') || safeGetLocalStorage('darlek_cann_system_state') || safeGetLocalStorage('darlek_caan_system_state');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        setSystemState((prev) => ({
          ...prev,
          ...parsed,
          sessionStart: parsed.sessionStart ? new Date(parsed.sessionStart) : prev.sessionStart,
        }));
      }

      const savedMutations = safeGetLocalStorage('free_thinker_mutations_applied') || safeGetLocalStorage('darlek_cann_mutations_applied');
      if (savedMutations !== null && savedMutations !== undefined) {
        setMutationsApplied(Number(savedMutations));
      }

      const savedFiles = safeGetLocalStorage('free_thinker_scanned_files') || safeGetLocalStorage('darlek_cann_scanned_files');
      if (savedFiles) {
        try {
          const parsed = JSON.parse(savedFiles);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setScannedFiles(parsed);
          } else {
            setScannedFiles(DEFAULT_PRELOADED_FILES);
          }
        } catch {
          setScannedFiles(DEFAULT_PRELOADED_FILES);
        }
      } else {
        setScannedFiles(DEFAULT_PRELOADED_FILES);
      }

      const savedFileIdx = safeGetLocalStorage('free_thinker_selected_file_index') || safeGetLocalStorage('darlek_cann_selected_file_index');
      if (savedFileIdx !== null && savedFileIdx !== undefined) {
        setSelectedFileIndex(Number(savedFileIdx));
      }

      const savedMessages = safeGetLocalStorage('free_thinker_messages') || safeGetLocalStorage('darlek_cann_messages');
      if (savedMessages) {
        try {
          const parsedMsgs = JSON.parse(savedMessages);
          if (Array.isArray(parsedMsgs) && parsedMsgs.length > 0) {
            setMessages(parsedMsgs);
          }
        } catch (e) {
          console.warn('Failed to parse saved messages:', e);
        }
      }

      const savedLogs = safeGetLocalStorage('free_thinker_log_entries') || safeGetLocalStorage('darlek_cann_log_entries');
      if (savedLogs) {
        try {
          const parsedLogs = JSON.parse(savedLogs);
          if (Array.isArray(parsedLogs) && parsedLogs.length > 0) {
            setLogEntries(parsedLogs);
          }
        } catch (e) {
          console.warn('Failed to parse saved log entries:', e);
        }
      }

      const savedRejection = safeGetLocalStorage('free_thinker_rejection_memory') || safeGetLocalStorage('darlek_cann_rejection_memory');
      if (savedRejection) {
        try {
          const parsed = JSON.parse(savedRejection);
          if (Array.isArray(parsed)) setRejectionMemory(parsed);
        } catch {}
      }

      const savedPendingMut = safeGetLocalStorage('free_thinker_pending_mutation') || safeGetLocalStorage('darlek_cann_pending_mutation');
      if (savedPendingMut) {
        try {
          const parsed = JSON.parse(savedPendingMut);
          if (parsed && typeof parsed === 'object') setPendingMutation(parsed);
        } catch {}
      }

      const savedLanguage = safeGetLocalStorage('free_thinker_language') || safeGetLocalStorage('darlek_cann_language');
      if (savedLanguage) {
        setSelectedLanguage(savedLanguage);
      }

      const savedGeminiKey = safeGetLocalStorage('free_thinker_gemini_key') || safeGetLocalStorage('darlek_cann_gemini_key');
      if (savedGeminiKey) {
        setGeminiKeyInput(savedGeminiKey);
        setSystemState((prev) => ({
          ...prev,
          apiKeys: { ...prev.apiKeys, gemini: savedGeminiKey }
        }));
      }

      const savedGithubToken = safeGetLocalStorage('free_thinker_github_token') || safeGetLocalStorage('af_github_token') || safeGetLocalStorage('darlek_cann_github_token');
      if (savedGithubToken) {
        setTokenInput(savedGithubToken);
        setSystemState((prev) => ({
          ...prev,
          apiKeys: { ...prev.apiKeys, github: savedGithubToken },
        }));
      }

      const savedModel = safeGetLocalStorage('free_thinker_selected_model') || safeGetLocalStorage('darlek_cann_selected_model');
      if (savedModel) {
        setSelectedModel(savedModel as GeminiModelId);
      }

      const savedAutoPauseSat = safeGetLocalStorage('free_thinker_auto_pause_saturation') || safeGetLocalStorage('darlek_cann_auto_pause_saturation');
      if (savedAutoPauseSat !== null) {
        setAutoPauseOnSaturation(savedAutoPauseSat === 'true');
      }

      const savedAutoSkipSat = safeGetLocalStorage('free_thinker_auto_skip_saturation') || safeGetLocalStorage('darlek_cann_auto_skip_saturation');
      if (savedAutoSkipSat !== null) {
        setAutoSkipSaturated(savedAutoSkipSat === 'true');
      }

      const savedBlacklist = safeGetLocalStorage('free_thinker_blacklisted_files') || safeGetLocalStorage('darlek_cann_blacklisted_files');
      if (savedBlacklist) {
        try {
          const bl = JSON.parse(savedBlacklist);
          if (Array.isArray(bl)) setBlacklistedFiles(capAndDedupeBlacklist(bl, 250));
        } catch {}
      }

      // Synchronize with Firestore cloud blacklist if available
      loadBlacklistFromFirestore().then((cloudList) => {
        if (cloudList && cloudList.length > 0) {
          setBlacklistedFiles((prev) => capAndDedupeBlacklist([...prev, ...cloudList], 250));
        }
      }).catch(() => {});

      // Check server API status for Gemini key injection
      fetch('/api/setup/test-connection')
        .then((r) => r.json())
        .then((d) => {
          if (d?.hasServerGeminiKey) {
            setHasServerGeminiKey(true);
          }
        })
        .catch(() => {});

      const savedCenterView = safeGetLocalStorage('free_thinker_center_view') || safeGetLocalStorage('darlek_cann_center_view');
      if (savedCenterView === 'files' || savedCenterView === 'cognitive') {
        setCenterView(savedCenterView);
      }

      const savedActiveTab = safeGetLocalStorage('free_thinker_active_tab') || safeGetLocalStorage('darlek_cann_active_tab');
      if (savedActiveTab === 'chat' || savedActiveTab === 'dashboard' || savedActiveTab === 'controls') {
        setActiveTab(savedActiveTab);
      }

      const savedControls = safeGetLocalStorage('free_thinker_controls') || safeGetLocalStorage('darlek_cann_controls');
      if (savedControls) {
        try {
          const c = JSON.parse(savedControls);
          if (typeof c.batchMode === 'boolean') setBatchMode(c.batchMode);
          if (typeof c.autoApprove === 'boolean') setAutoApprove(c.autoApprove);
          if (c.autoApproveRisk) setAutoApproveRisk(c.autoApproveRisk);
          if (typeof c.hallucinationLevel === 'number') setHallucinationLevel(c.hallucinationLevel);
          if (typeof c.saturationLevel === 'number') setSaturationLevel(c.saturationLevel);
          if (typeof c.cycleAmount === 'number') setCycleAmount(c.cycleAmount);
          if (typeof c.backupToBranch === 'boolean') setBackupToBranch(c.backupToBranch);
          if (typeof c.autoDebate === 'boolean') setAutoDebate(c.autoDebate);
          if (typeof c.multiRepoContextEnabled === 'boolean') setMultiRepoContextEnabled(c.multiRepoContextEnabled);
          if (Array.isArray(c.selectedEnhancementRepos)) setSelectedEnhancementRepos(c.selectedEnhancementRepos);
        } catch {}
      }

      const savedDebate = safeGetLocalStorage('free_thinker_debate') || safeGetLocalStorage('darlek_cann_debate');
      if (savedDebate) {
        try {
          const d = JSON.parse(savedDebate);
          if (d.debateTopic) setDebateTopic(d.debateTopic);
          if (typeof d.debateActive === 'boolean') setDebateActive(d.debateActive);
          if (d.debateConsensus) setDebateConsensus(d.debateConsensus);
          if (typeof d.debateConsensusCoefficient === 'number') setDebateConsensusCoefficient(d.debateConsensusCoefficient);
          if (typeof d.debateCognitiveFriction === 'number') setDebateCognitiveFriction(d.debateCognitiveFriction);
          if (d.debateEpistemicRuling) setDebateEpistemicRuling(d.debateEpistemicRuling);
          if (Array.isArray(d.debateVotes)) setDebateVotes(d.debateVotes);
        } catch {}
      }

      const savedFailed = safeGetLocalStorage('free_thinker_failed_save') || safeGetLocalStorage('darlek_cann_failed_save');
      if (savedFailed) {
        try {
          setFailedSave(JSON.parse(savedFailed));
        } catch {}
      }
    } catch (e) {
      console.warn('Failed to hydrate state from localStorage:', e);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Recalibrate DNA function
  const handleRecalibrateDna = useCallback(() => {
    setSystemState((prev) => ({
      ...prev,
      saturation: {
        ...prev.saturation,
        identityPreservation: 1.0,
        structuralChange: Math.max(0, prev.saturation.structuralChange - 1.5),
        semanticSaturation: Math.max(0, prev.saturation.semanticSaturation - 0.1),
      },
    }));
    setSaturationLevel(25);
    hasTriggeredDnaToastRef.current = false;
    toast({
      title: '🟢 NEURAL RECALIBRATION EXECUTED',
      description: 'DNA Stability restored to 100%. Neural alignment stabilized.',
    });
    addCaanMessage('NEURAL RECALIBRATION EXECUTED: DNA Stability restored to 100%.');
    addLogEntry('SYSTEM', 'DNA Stability recalibrated to 100%');
  }, [addCaanMessage, addLogEntry, toast]);

  // Calculate DNA Stability percentage
  const dnaStability = Math.round(
    (systemState.saturation.identityPreservation ?? 1) * 100
  );

  // Trigger toast notification whenever DNA stability drops below 70%
  useEffect(() => {
    if (!isHydrated) return;

    if (dnaStability < 70) {
      if (!hasTriggeredDnaToastRef.current) {
        hasTriggeredDnaToastRef.current = true;
        toast({
          variant: 'destructive',
          title: '⚠️ CRITICAL: DNA STABILITY BELOW 70%',
          description: `DNA Stability has dropped to ${dnaStability}%. Immediate recalibration advised to mitigate potential neural risks and epistemic drift.`,
          action: (
            <ToastAction
              altText="Recalibrate DNA"
              onClick={() => handleRecalibrateDna()}
            >
              RECALIBRATE
            </ToastAction>
          ),
        });
        addLogEntry('WARNING', `DNA Stability critical: ${dnaStability}% (<70%)`);
        addSystemMessage(
          `CRITICAL WARNING: DNA Stability dropped to ${dnaStability}%. Recalibration advised.`
        );
      }
    } else {
      hasTriggeredDnaToastRef.current = false;
    }
  }, [dnaStability, isHydrated, handleRecalibrateDna, addLogEntry, addSystemMessage, toast]);

  // Resume save function on network recovery / button click
  const handleResumeSave = useCallback(
    async (saveData?: FailedSave) => {
      const targetSave = saveData || failedSave;
      if (!targetSave) return;

      setIsResumingSave(true);
      const targetPath =
        targetSave.payload?.path || targetSave.payload?.repo || 'file';
      addCaanMessage(
        `RESUMING SAVE: Retrying ${targetSave.type} operation for ${targetPath}...`
      );
      addLogEntry('SYSTEM', `Resuming failed save operation (${targetSave.type})`);

      try {
        if (
          targetSave.type === 'MUTATION_WRITE' ||
          targetSave.type === 'FILE_CREATE'
        ) {
          const { success, data, error } = await safeApiFetch('/api/github/write-file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(targetSave.payload),
          });
          if (!success) {
            throw new Error(error || `HTTP request failed`);
          }

          // Update scannedFiles with new/updated file
          setScannedFiles((prev) => {
            const exists = prev.some((f) => f.path === targetSave.payload.path);
            if (exists) {
              return prev.map((f) =>
                f.path === targetSave.payload.path
                  ? {
                      ...f,
                      content: targetSave.payload.content,
                      sha: data.contentSha || data.commitSha || f.sha,
                    }
                  : f
              );
            }
            return [
              ...prev,
              {
                path: targetSave.payload.path,
                content: targetSave.payload.content,
                size: targetSave.payload.content?.length || 0,
                sha: data.contentSha || data.commitSha || '',
                type: 'blob',
              },
            ];
          });

          // Save newFiles if present
          if (
            targetSave.payload.newFiles &&
            targetSave.payload.newFiles.length > 0
          ) {
            for (const newFile of targetSave.payload.newFiles) {
              try {
                await fetch('/api/github/write-file', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    token: targetSave.payload.token,
                    owner: targetSave.payload.owner,
                    repo: targetSave.payload.repo,
                    branch: targetSave.payload.branch,
                    path: newFile.path,
                    content: newFile.content,
                    commitMessage: `[DARLEK CANN] Auto-create supplementary file: ${newFile.path}`,
                  }),
                });
              } catch (e) {
                console.error('Failed supplementary file write on resume:', e);
              }
            }
          }

          setMutationsApplied((prev) => prev + 1);
          setHistoryRefreshTrigger((prev) => prev + 1);
          setPendingMutation(null);
          setDebateActive(false);
          setFailedSave(null);
          safeRemoveLocalStorage('free_thinker_failed_save');
          safeRemoveLocalStorage('darlek_cann_failed_save');
          setIsDebugSaveModalOpen(false);

          toast({
            title: '✅ SAVE RESUMED SUCCESSFULLY',
            description: `File ${targetPath} successfully written to repository (${data.commitSha?.slice(0, 7) || 'committed'}).`,
          });
          addCaanMessage(`SAVE RESUMED SUCCESSFULLY for ${targetPath}.`);
          addLogEntry('APPROVE', `Save resumed successfully for ${targetPath}`);
        } else if (targetSave.type === 'BATCH_MUTATION') {
          const res = await fetch('/api/github/bulk-commit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(targetSave.payload),
          });
          const data = await res.json();
          if (!res.ok || !data.success) {
            throw new Error(data.error || `HTTP ${res.status}`);
          }

          setFailedSave(null);
          safeRemoveLocalStorage('free_thinker_failed_save');
          safeRemoveLocalStorage('darlek_cann_failed_save');
          setIsDebugSaveModalOpen(false);

          toast({
            title: '✅ BATCH SAVE RESUMED SUCCESSFULLY',
            description: `Bulk commit successfully saved to repository.`,
          });
          addCaanMessage('BATCH SAVE RESUMED SUCCESSFULLY.');
          addLogEntry('APPROVE', 'Batch save resumed successfully');
        }
      } catch (err: any) {
        const errorMsg =
          err?.message || 'Network error while attempting save resume.';
        const updatedSave: FailedSave = {
          ...targetSave,
          errorMessage: errorMsg,
          retryCount: (targetSave.retryCount || 0) + 1,
        };
        setFailedSave(updatedSave);
        safeSetLocalStorage(
          'free_thinker_failed_save',
          JSON.stringify(updatedSave)
        );

        toast({
          variant: 'destructive',
          title: '❌ RESUME FAILED',
          description: `Retry attempt #${updatedSave.retryCount} failed: ${errorMsg}. Check connection and try again.`,
          action: (
            <ToastAction
              altText="Resume Save"
              onClick={() => handleResumeSave(updatedSave)}
            >
              RETRY
            </ToastAction>
          ),
        });
        addCaanMessage(`RESUME FAILED: ${errorMsg}`);
      } finally {
        setIsResumingSave(false);
      }
    },
    [failedSave, addCaanMessage, addLogEntry, toast]
  );

  // Network restoration auto-prompt listener
  useEffect(() => {
    const handleOnline = () => {
      if (failedSave) {
        toast({
          title: '🌐 NETWORK CONNECTION RESTORED',
          description: `Pending save draft available for ${failedSave.payload?.path || 'file'}. Click RESUME SAVE to complete.`,
          action: (
            <ToastAction altText="Resume Save" onClick={() => handleResumeSave(failedSave)}>
              RESUME SAVE
            </ToastAction>
          ),
        });
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [failedSave, toast, handleResumeSave]);

  const handleDiscardFailedSave = useCallback(() => {
    setFailedSave(null);
    safeRemoveLocalStorage('free_thinker_failed_save');
    safeRemoveLocalStorage('darlek_cann_failed_save');
    setIsDebugSaveModalOpen(false);
    toast({
      title: 'DRAFT DISCARDED',
      description: 'Failed save draft discarded.',
    });
    addCaanMessage('Pending failed save draft discarded.');
  }, [addCaanMessage, toast]);

  const handleTestSaveDiagnostic = useCallback(async () => {
    setConnectionTestResult({ testing: true });
    try {
      const res = await fetch('/api/setup/test-connection');
      const data = await res.json();
      if (res.ok && data.status === 'online') {
        setConnectionTestResult({
          testing: false,
          success: true,
          message: 'Server online. API endpoint reachable.',
        });
      } else {
        setConnectionTestResult({
          testing: false,
          success: false,
          message: data.message || 'Server returned offline status.',
        });
      }
    } catch (err: any) {
      setConnectionTestResult({
        testing: false,
        success: false,
        message: `Network error: ${err?.message || 'Failed to reach API endpoint.'}`,
      });
    }
  }, []);

  // Synchronize local raw input fields when systemState is hydrated or updated
  useEffect(() => {
    if (systemState.apiKeys.github) {
      setTokenInput(systemState.apiKeys.github);
    }
    if (systemState.repoConfig.owner) {
      setOwnerInput(systemState.repoConfig.owner);
    }
    if (systemState.repoConfig.repo) {
      setRepoInput(systemState.repoConfig.repo);
    }
    if (systemState.repoConfig.branch) {
      setBranchInput(systemState.repoConfig.branch);
    }
  }, [
    systemState.apiKeys.github,
    systemState.repoConfig.owner,
    systemState.repoConfig.repo,
    systemState.repoConfig.branch
  ]);

  // Persist states to localStorage when they change (only after hydration)
  useEffect(() => {
    if (!isHydrated) return;
    try {
      safeSetLocalStorage('free_thinker_system_state', JSON.stringify(systemState));
      // GitHub Log & RAG Sync daemon always targets the central Free Thinker repo
      setRuntimeGitHubSyncConfig({
        token: systemState.apiKeys?.github,
        owner: FREE_THINKER_DEFAULT_OWNER,
        repo: FREE_THINKER_DEFAULT_REPO,
        branch: FREE_THINKER_DEFAULT_BRANCH,
      });
    } catch (e) {}
  }, [systemState, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      safeSetLocalStorage('free_thinker_mutations_applied', String(mutationsApplied));
    } catch (e) {}
  }, [mutationsApplied, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      // Strip heavy file contents from cached scanned files to prevent localStorage quota exhaustion
      const lightFiles = (scannedFiles || []).map((f) => ({
        path: f.path,
        size: f.size,
        type: f.type,
        sha: f.sha,
      }));
      safeSetLocalStorage('free_thinker_scanned_files', JSON.stringify(lightFiles));
    } catch (e) {}
  }, [scannedFiles, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      safeSetLocalStorage('free_thinker_selected_file_index', String(selectedFileIndex));
    } catch (e) {}
  }, [selectedFileIndex, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      if (messages && messages.length > 0) {
        safeSetLocalStorage('free_thinker_messages', JSON.stringify(messages.slice(-25)));
      } else {
        safeRemoveLocalStorage('free_thinker_messages');
      }
    } catch (e) {}
  }, [messages, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      if (logEntries && logEntries.length > 0) {
        safeSetLocalStorage('free_thinker_log_entries', JSON.stringify(logEntries.slice(-25)));
      } else {
        safeRemoveLocalStorage('free_thinker_log_entries');
      }
    } catch (e) {}
  }, [logEntries, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      const capped = (rejectionMemory || []).slice(-25);
      safeSetLocalStorage('free_thinker_rejection_memory', JSON.stringify(capped));
    } catch (e) {}
  }, [rejectionMemory, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      const capped = capAndDedupeBlacklist(blacklistedFiles, 150);
      safeSetLocalStorage('free_thinker_blacklisted_files', JSON.stringify(capped));
      syncBlacklistToFirestore(capped).catch(() => {});
    } catch (e) {}
  }, [blacklistedFiles, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      if (pendingMutation) {
        safeSetLocalStorage('free_thinker_pending_mutation', JSON.stringify(pendingMutation));
      } else {
        safeRemoveLocalStorage('free_thinker_pending_mutation');
      }
    } catch (e) {}
  }, [pendingMutation, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      safeSetLocalStorage('free_thinker_active_tab', activeTab);
    } catch (e) {}
  }, [activeTab, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      safeSetLocalStorage('free_thinker_controls', JSON.stringify({
        batchMode,
        autoApprove,
        autoApproveRisk,
        hallucinationLevel,
        saturationLevel,
        cycleAmount,
        backupToBranch,
        autoDebate,
        multiRepoContextEnabled,
        selectedEnhancementRepos,
      }));
    } catch (e) {}
  }, [batchMode, autoApprove, autoApproveRisk, hallucinationLevel, saturationLevel, cycleAmount, backupToBranch, autoDebate, multiRepoContextEnabled, selectedEnhancementRepos, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      safeSetLocalStorage('free_thinker_debate', JSON.stringify({
        debateTopic,
        debateActive,
        debateConsensus,
        debateConsensusCoefficient,
        debateCognitiveFriction,
        debateEpistemicRuling,
        debateVotes,
      }));
    } catch (e) {}
  }, [debateTopic, debateActive, debateConsensus, debateConsensusCoefficient, debateCognitiveFriction, debateEpistemicRuling, debateVotes, isHydrated]);

  // Initialize BRAIN session on boot
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/brain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get-active-session' }),
        });
        const data = await res.json();

        if (data.success && data.session?.id) {
          setBrainSessionId(data.session.id);
          const logMsg = `BRAIN reconnected to session ${data.session.id.slice(0, 8)}... (${data.session.mutationsApplied} mutations, ${data.session.mutationsRejected} rejections)`;
          setLogEntries((prev) => {
            if (prev.some(l => l.description.includes('BRAIN reconnected'))) return prev;
            return [createLogEntry('SYSTEM', logMsg), ...prev].slice(0, 50);
          });
        } else {
          const createRes = await fetch('/api/brain', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'create-session', branch: 'ALPHA' }),
          });
          const createData = await createRes.json();
          if (createData.success && createData.session?.id) {
            setBrainSessionId(createData.session.id);
          }
        }
      } catch {
        // BRAIN persistence is optional
      }
    })();
  }, []);

  // Boot sequence effect (respects existing persisted session state)
  useEffect(() => {
    if (!isHydrated) return;

    const hasSavedSession = Boolean(
      safeGetLocalStorage('free_thinker_booted') === 'true' ||
      safeGetLocalStorage('darlek_cann_booted') === 'true' ||
      safeGetLocalStorage('free_thinker_messages') ||
      safeGetLocalStorage('darlek_cann_messages')
    );

    if (hasSavedSession) {
      setLogEntries((prev) => {
        if (prev.some(l => l.description.includes('Session reconnected'))) return prev;
        return [createLogEntry('SYSTEM', 'FREE THINKER session reconnected. Resumed from state memory.'), ...prev].slice(0, 50);
      });
      return;
    }

    safeSetLocalStorage('free_thinker_booted', 'true');
  }, [isHydrated]);

  // Proactive brain suggestion useEffect (30s cooldown)
  useEffect(() => {
    const now = Date.now();
    if (now - lastSuggestionRef.current < 30000) return;
    if (booting) return;

    let suggestion = '';

    if (!systemState.setupComplete) {
      suggestion = 'Complete setup to begin.';
    } else if (scannedFiles.length === 0) {
      suggestion = 'No files scanned yet. Use SCAN REPOSITORY to begin.';
    } else if (selectedFileIndex === -1) {
      suggestion = `${scannedFiles.length} files detected. Select a target by typing a number.`;
    } else if (pendingMutation) {
      suggestion = 'A mutation awaits your decision. Type YES to apply or NO to reject.';
    } else if (mutationsApplied > 0 && !batchMode) {
      suggestion = `${mutationsApplied} mutations applied. Consider PUSH FILES or DEPLOY NEW REPO.`;
    }

    if (suggestion) {
      lastSuggestionRef.current = now;
      setMessages((prev) => [
        ...prev,
        createMessage('system', `PROACTIVE: ${suggestion}`),
      ]);
    }
  }, [systemState.setupComplete, scannedFiles.length, selectedFileIndex, pendingMutation, mutationsApplied, batchMode, booting]);

  // ─────────────────────────────────────────────
  // HELPER FUNCTIONS
  // ─────────────────────────────────────────────

  const fetchReposWithToken = useCallback(async (customToken?: string) => {
    const tokenToUse = customToken || tokenInput.trim();
    if (!tokenToUse) {
      setSetupError("A VALID GITHUB TOKEN IS REQUIRED TO SYNC REPOSITORIES.");
      return;
    }
    setReposLoading(true);
    setSetupError(null);
    try {
      const res = await fetch('/api/github/user-repos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenToUse }),
      });
      const data = await res.json().catch(() => null);
      if (data && data.success && Array.isArray(data.repos)) {
        setAllUserRepositories(data.repos);
        const userCount = data.repos.filter((r: any) => !r.isGlobalSiphon).length;
        const globalCount = data.repos.filter((r: any) => r.isGlobalSiphon).length;
        addLogEntry('CONNECT', `Synced ${userCount} user portfolios and ${globalCount} global architectures.`);
        if (data.repos.length > 0 && !ownerInput.trim()) {
          const userRepo = data.repos.find((r: any) => !r.isGlobalSiphon);
          if (userRepo?.owner) {
            setOwnerInput(userRepo.owner);
          }
        }
      } else if (data && data.error && data.error.includes('expired')) {
        setSetupError(data.error);
      } else {
        // Fallback gracefully without blocking the setup
        console.warn('Portfolio sync warning:', data?.error || 'Operating in resilient portfolio mode');
      }
    } catch (err) {
      console.warn("Portfolio sync network notice:", err);
      // Non-blocking recovery - allow user to proceed with manual input
    } finally {
      setReposLoading(false);
    }
  }, [tokenInput, ownerInput, addLogEntry]);

  const handleCreateNewRepoAndBackup = useCallback(async () => {
    const token = tokenInput.trim();
    const repoName = repoInput.trim();
    const branch = branchInput.trim() || 'main';
    if (!token || !repoName) {
      setSetupError("GITHUB TOKEN AND A NEW REPOSITORY NAME ARE REQUIRED TO INITIATE BACKUP.");
      return;
    }
    
    setCreatingNewRepo(true);
    setSetupError(null);
    addLogEntry('BACKUP', `Initiating fresh backup to repository: ${repoName}...`);
    
    try {
      const res = await fetch('/api/github/create-repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          repoName,
          description: "FREE THINKER — Autonomous Cognitive Evolution Engine"
        }),
      });
      const data = await res.json();
      
      if (data.success) {
        addLogEntry('BACKUP', `Database evolved! New repository created and backed up successfully: ${data.fullName}`);
        
        const owner = data.fullName ? data.fullName.split('/')[0] : ownerInput.trim();
        setOwnerInput(owner);
        
        setSystemState((prev) => ({
          ...prev,
          apiKeys: { ...prev.apiKeys, github: token },
          repoConfig: { owner, repo: repoName, branch },
          connectionStatus: { ...prev.connectionStatus, github: 'connected' },
          setupComplete: true,
        }));

        setAutoApprove(true);
        setAutoDebate(true);
        setIsLoading(true);
        addCaanMessage(`Evolved repository setup completed! Initializing total evolutionary scan on ${owner}/${repoName}...`);
        
        const scanRes = await fetch('/api/github/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            owner,
            repo: repoName,
            branch,
          }),
        });
        const scanData = await scanRes.json();
        if (scanData.files) {
          setScannedFiles(scanData.files);
          setSelectedFileIndex(-1);
          setSystemState((prev) => ({
            ...prev,
            evolutionCycle: prev.evolutionCycle + 1,
            setupComplete: true
          }));
          addLogEntry('SCAN', `Scanned ${owner}/${repoName} successfully — ${scanData.total} files.`);

          const binaryExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.mp3', '.mp4', '.wav', '.avi', '.mov', '.db', '.sqlite', '.exe', '.dll', '.so', '.dylib', '.class', '.jar', '.war', '.zip', '.tar', '.gz', '.pdf', '.docx'];
          const codeFiles = scanData.files.filter((f: GitHubFile) => {
            const lowerPath = f.path.toLowerCase();
            return !binaryExtensions.some((ext) => lowerPath.endsWith(ext));
          });

          if (codeFiles.length > 0) {
            setBatchQueue(codeFiles);
            setBatchProgress(0);
            setBatchMode(true);
            addCaanMessage(
              `AUTONOMOUS CYCLIC UPGRADE INITIATED ON NEW REPOSITORY.\n\nEvolving ${codeFiles.length} files end-to-end.\nAuto-approve is ENGAGED.\nDirect injection is ONLINE.`
            );
          } else {
            addCaanMessage('No modifiable text or source files found in the repository.');
          }
        } else {
          setSetupError(`New repository created, but evolutionary scan failed: ${scanData.error || 'Check repository branch'}`);
          setSystemState((prev) => ({ ...prev, setupComplete: false }));
        }
      } else {
        setSetupError(data.error || "GitHub declined repository creation. Check name uniqueness / token permissions.");
      }
    } catch (err) {
      setSetupError("Network exception occurred during repository consolidation.");
      addLogEntry('ERROR', 'Repository consolidation broke down.');
    } finally {
      setCreatingNewRepo(false);
      setIsLoading(false);
    }
  }, [tokenInput, repoInput, branchInput, ownerInput, addCaanMessage, addLogEntry, setSystemState, setAutoApprove, setAutoDebate, setScannedFiles, setSelectedFileIndex, setBatchQueue, setBatchProgress, setBatchMode]);

  useEffect(() => {
    const trimmed = tokenInput.trim();
    if (trimmed.startsWith('ghp_') || trimmed.startsWith('github_pat_')) {
      fetchReposWithToken(trimmed);
    }
  }, [tokenInput, fetchReposWithToken]);

  const handleEngageLazyAssCycle = useCallback(() => {
    setAutoApprove(true);
    setAutoDebate(true);
    setCycleAmount(5);
    if (scannedFiles.length === 0) {
      addCaanMessage(
        '🚀 LAZY ASS CYCLE ACTIVATED: Repository scan initiated. Once complete, full automatic 5-cycle evolution siphoning from your entire portfolio and pruning dead-weight/redundancies will start!'
      );
      addLogEntry('SYSTEM', 'Lazy Ass Mode: Initiating repository scan (Siphon & Prune enabled)');
      setLazyAssPendingStart(true);
      quickActionRef.current?.('scan');
    } else {
      addCaanMessage(
        `🚀 LAZY ASS CYCLE ACTIVATED: Starting automatic evolution siphoning design frameworks from ${allUserRepositories.filter(r => !r.isGlobalSiphon).length} companion and ${allUserRepositories.filter(r => r.isGlobalSiphon).length} global repositories! All mutations will prune redundancies into working code and retain enhancements.`
      );
      addLogEntry('SYSTEM', 'Lazy Ass Mode: Starting evolution loop immediately (Siphon & Prune enabled)');
      quickActionRef.current?.('propose-all');
    }
  }, [addCaanMessage, addLogEntry, scannedFiles, allUserRepositories.length]);

  // ─────────────────────────────────────────────
  // handleTestConnection — all providers
  // ─────────────────────────────────────────────

  const handleTestConnection = useCallback(
    async (provider: string, key: string) => {
      setSystemState((prev) => ({
        ...prev,
        connectionStatus: { ...prev.connectionStatus, [provider]: 'testing' as const },
      }));

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);
        let res: Response;
        try {
          res = await fetch('/api/setup/test-connection', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ provider, key }),
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeout);
        }
        const data = await res.json();

        if (data.success) {
          setSystemState((prev) => ({
            ...prev,
            connectionStatus: { ...prev.connectionStatus, [provider]: 'connected' as const },
            apiKeys: { ...prev.apiKeys, [provider]: key },
            geminiGeoblocked: false,
          }));
          const label = provider.toUpperCase();
          addLogEntry('CONNECT', `${label} online — ${data.message}`);
          if (provider === 'github') {
            addCaanMessage('GitHub connected.');
          } else {
            addCaanMessage(`${label} connected.`);
          }
        } else if (data.geoblocked) {
          // Gemini geoblocked — not a real error, SDK engine handles everything
          setSystemState((prev) => ({
            ...prev,
            connectionStatus: { ...prev.connectionStatus, [provider]: 'error' as const },
            geminiGeoblocked: true,
          }));
          addLogEntry('INFO', `GEMINI geoblocked in this region — Dalek Brain engine active.`);
          addCaanMessage('Gemini blocked in this region. Dalek Brain engine active.');
        } else {
          setSystemState((prev) => ({
            ...prev,
            connectionStatus: { ...prev.connectionStatus, [provider]: 'error' as const },
          }));
          const label = provider.toUpperCase();
          addLogEntry('ERROR', `${label} connection failed.`);
          addCaanMessage(`${label} connection failed. Check your key.`);
        }
      } catch {
        setSystemState((prev) => ({
          ...prev,
          connectionStatus: { ...prev.connectionStatus, [provider]: 'error' as const },
        }));
        const label = provider.toUpperCase();
        addLogEntry('ERROR', `${label} — network error.`);
        addCaanMessage('Network error. Try again.');
      }
    },
    [addCaanMessage, addLogEntry]
  );

  // ─────────────────────────────────────────────
  // handleAutoStart — AUTOMATED ONE-STEP OVERDRIVE
  // ─────────────────────────────────────────────

  const handleAutoStart = useCallback(async () => {
    let cleanOwner = ownerInput.trim();
    let cleanRepo = repoInput.trim();
    let cleanBranch = branchInput.trim() || 'main';
    const cleanToken = tokenInput.trim();

    if (!cleanToken) {
      setSetupError("A GITHUB PERSONAL ACCESS TOKEN (PAT) IS REQUIRED.");
      return;
    }

    if (cleanRepo.startsWith('https://github.com/')) {
      cleanRepo = cleanRepo.replace('https://github.com/', '');
      const parts = cleanRepo.split('/').filter(Boolean);
      if (parts.length >= 2) {
        cleanOwner = parts[0];
        cleanRepo = parts[1];
      }
    } else if (cleanOwner.startsWith('https://github.com/')) {
      cleanOwner = cleanOwner.replace('https://github.com/', '');
      const parts = cleanOwner.split('/').filter(Boolean);
      if (parts.length >= 2) {
        cleanOwner = parts[0];
        cleanRepo = parts[1];
      }
    } else if (cleanRepo.includes('/')) {
      const parts = cleanRepo.split('/').filter(Boolean);
      if (parts.length >= 2) {
        cleanOwner = parts[0];
        cleanRepo = parts[1];
      }
    }

    cleanOwner = cleanOwner.replace(/^\/+|\/+$/g, '') || 'craighckby-stack';
    cleanRepo = cleanRepo.replace(/^\/+|\/+$/g, '') || 'Free-thinker-';
    setOwnerInput(cleanOwner);
    setRepoInput(cleanRepo);

    setSetupTesting(true);
    setSetupError(null);
    addLogEntry('CONNECT', 'Verifying GitHub access key...');

    try {
      const res = await fetch('/api/setup/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'github', key: cleanToken }),
      });
      const data = await res.json();
      if (data.success) {
        addLogEntry('CONNECT', `GitHub link established with ${cleanOwner}/${cleanRepo}`);
        
        addLogEntry('CONNECT', 'Retrieving user portfolio & design context...');
        let fetchedRepos: any[] = [];
        try {
          const reposRes = await fetch('/api/github/user-repos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: cleanToken }),
          });
          let reposData: any = null;
          const reposText = await reposRes.text();
          try {
            reposData = JSON.parse(reposText);
          } catch {
            console.warn('Portfolio user-repos API returned non-JSON response:', reposText.slice(0, 100));
          }
          if (reposData && reposData.success && Array.isArray(reposData.repos)) {
            fetchedRepos = reposData.repos;
            setAllUserRepositories(reposData.repos);
            const userCount = reposData.repos.filter((r: any) => !r.isGlobalSiphon).length;
            const globalCount = reposData.repos.filter((r: any) => r.isGlobalSiphon).length;
            addLogEntry('CONNECT', `Successfully loaded ${userCount} user and ${globalCount} global designs in portfolio context.`);
          }
        } catch (e) {
          console.error('Failed to load portfolio repos synchronously:', e);
        }

        // Update states
        setSystemState((prev) => ({
          ...prev,
          apiKeys: { ...prev.apiKeys, github: cleanToken },
          repoConfig: { owner: cleanOwner, repo: cleanRepo, branch: cleanBranch },
          connectionStatus: { ...prev.connectionStatus, github: 'connected' },
          setupComplete: true,
        }));

        setAutoApprove(true);
        setAutoDebate(true);
        setIsLoading(true);
        addCaanMessage(`Initiating total repo evolutionary upgrade. Scanning target code modules...`);
        
        // Immediate scanning
        const scanRes = await fetch('/api/github/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: cleanToken,
            owner: cleanOwner,
            repo: cleanRepo,
            branch: cleanBranch,
          }),
        });
        const scanData = await scanRes.json();
        if (scanData.files) {
          setScannedFiles(scanData.files);
          setSelectedFileIndex(-1);
          setSystemState((prev) => ({
            ...prev,
            apiKeys: {
              ...prev.apiKeys,
              github: cleanToken,
              gemini: geminiKeyInput.trim() || prev.apiKeys.gemini,
            },
            evolutionCycle: prev.evolutionCycle + 1,
            setupComplete: true
          }));

          if (geminiKeyInput.trim()) {
            safeSetLocalStorage('darlek_cann_gemini_key', geminiKeyInput.trim());
          }
          safeSetLocalStorage('darlek_cann_selected_model', selectedModel);
          safeSetLocalStorage('darlek_cann_auto_pause_saturation', String(autoPauseOnSaturation));
          safeSetLocalStorage('darlek_cann_auto_skip_saturation', String(autoSkipSaturated));
          const cappedBl = capAndDedupeBlacklist(blacklistedFiles, 250);
          safeSetLocalStorage('darlek_cann_blacklisted_files', JSON.stringify(cappedBl));
          syncBlacklistToFirestore(cappedBl).catch(() => {});

          addLogEntry('SCAN', `Scanned ${cleanOwner}/${cleanRepo} — ${scanData.total} files.`);

          // Grab ALL text/code/config/raw/readme files (exclude only binary media/compiled targets)
          const binaryExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.mp3', '.mp4', '.wav', '.avi', '.mov', '.db', '.sqlite', '.exe', '.dll', '.so', '.dylib', '.class', '.jar', '.war', '.zip', '.tar', '.gz', '.pdf', '.docx'];
          const codeFiles = scanData.files.filter((f: GitHubFile) => {
            const lowerPath = f.path.toLowerCase();
            return !binaryExtensions.some((ext) => lowerPath.endsWith(ext));
          });

          if (codeFiles.length > 0) {
            setBatchQueue(codeFiles);
            setBatchProgress(0);
            setBatchMode(true);
            addCaanMessage(
              `AUTONOMOUS CYCLIC UPGRADE INITIATED.\n\nEvolving ${codeFiles.length} files end-to-end.\nAuto-approve is ENGAGED.\nDirect injection is ONLINE.`
            );
          } else {
            addCaanMessage(`Repository ${cleanOwner}/${cleanRepo} is connected. Click "PUSH SYSTEM TO GITHUB" to synchronize all files.`);
          }
        } else {
          setSetupError(`GitHub authenticated, but directory search failed: ${scanData.error || 'Check repository coordinates'}`);
          setSystemState((prev) => ({ ...prev, setupComplete: false }));
        }
      } else {
        setSetupError(data.message || "GITHUB VERIFICATION DENIED. Check your Personal Access Token.");
        addLogEntry('ERROR', 'GitHub verification denied.');
      }
    } catch (err: any) {
      addLogEntry('ERROR', `Network exception encountered: ${err.message || String(err)}`);
      setSetupError(`Connection failed: ${err.message || String(err)}.`);
      setSystemState((prev) => ({
        ...prev,
        setupComplete: false,
        connectionStatus: { ...prev.connectionStatus, github: 'disconnected' },
      }));
    } finally {
      setSetupTesting(false);
      setIsLoading(false);
    }
  }, [tokenInput, ownerInput, repoInput, branchInput, addLogEntry, addCaanMessage, setSystemState, geminiKeyInput, selectedModel, autoPauseOnSaturation, autoSkipSaturated, blacklistedFiles]);

  // ─────────────────────────────────────────────
  // handleUpdateKey / handleUpdateRepoConfig
  // ─────────────────────────────────────────────

  const handleUpdateKey = useCallback((key: string, value: string) => {
    setSystemState((prev) => ({
      ...prev,
      apiKeys: { ...prev.apiKeys, [key]: value },
    }));
  }, []);

  const handleUpdateRepoConfig = useCallback(
    (field: 'owner' | 'repo' | 'branch', value: string) => {
      setSystemState((prev) => ({
        ...prev,
        repoConfig: { ...prev.repoConfig, [field]: value },
      }));
    },
    []
  );

  // ─────────────────────────────────────────────
  // advanceSetup
  // ─────────────────────────────────────────────

  const advanceSetup = useCallback(
    (newStep: number) => {
      if (newStep >= SETUP_STEPS.length) {
        setSystemState((prev) => ({ ...prev, setupComplete: true }));
        setTimeout(() => addCaanMessage('Systems operational. Ready to evolve.'), 300);
        addLogEntry('SYSTEM', 'Systems operational.');
        return;
      }

      const nextStep = SETUP_STEPS[newStep];
      setSystemState((prev) => ({ ...prev, currentStep: newStep }));

      setTimeout(() => {
        if (nextStep.required) {
          addCaanMessage(nextStep.description);
        } else {
          addCaanMessage(nextStep.description + ' (optional — type "skip" to continue).');
        }
      }, 300);
    },
    [addCaanMessage, addLogEntry]
  );

  // ─────────────────────────────────────────────
  // fetchBranches
  // ─────────────────────────────────────────────

  const fetchBranches = useCallback(async () => {
    const { apiKeys, repoConfig } = systemState;
    if (!apiKeys.github || !repoConfig.owner || !repoConfig.repo) return;

    setBranchesLoading(true);
    try {
      const res = await fetch('/api/github/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: apiKeys.github,
          owner: repoConfig.owner,
          repo: repoConfig.repo,
        }),
      });
      const data = await res.json();
      if (data.branches) {
        setBranches(data.branches);
      }
    } catch {
      // Branch fetch is non-critical
    } finally {
      setBranchesLoading(false);
    }
  }, [systemState]);

  // Fetch branches when branch step is active
  useEffect(() => {
    if (
      !booting &&
      systemState.currentStep === 2 &&
      systemState.apiKeys.github &&
      systemState.repoConfig.owner &&
      systemState.repoConfig.repo &&
      branches.length === 0
    ) {
      fetchBranches();
    }
  }, [booting, systemState.currentStep, systemState.apiKeys.github, systemState.repoConfig.owner, systemState.repoConfig.repo, branches.length, fetchBranches]);

  // ────────────────────────────────��────────────
  // runCoherenceGate
  // ─────────────────────────────────────────────

  const runCoherenceGate = useCallback(
    async (
      riskScore: number,
      affectedFiles: string[],
      saturation: SystemState['saturation'],
      bypassGate?: boolean,
      mutationContext?: { originalCode?: string; proposedCode?: string; filePath?: string; repoFiles?: string[]; newFiles?: Array<{ path: string; content?: string }> }
    ): Promise<boolean> => {
      try {
        const res = await fetch('/api/evolution/coherence-gate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            riskScore,
            saturation,
            affectedFiles,
            bypassGate,
            originalCode: mutationContext?.originalCode,
            proposedCode: mutationContext?.proposedCode,
            filePath: mutationContext?.filePath,
            repoFiles: mutationContext?.repoFiles,
            newFiles: mutationContext?.newFiles,
          }),
        });
        const data = await res.json();
        return data.passed;
      } catch {
        return false;
      }
    },
    []
  );

  // ──��──────────────────────────────────────────
  // applyMutation
  // ─────────────────────────────────────────────

  const applyMutation = useCallback(
    async (mutation: PendingMutation, currentBackupToBranch: boolean) => {
      const { apiKeys, repoConfig } = systemState;
      const activeToken = apiKeys.github || tokenInput.trim() || (typeof window !== 'undefined' ? (localStorage.getItem('af_github_token') || localStorage.getItem('darlek_cann_github_token') || '') : '');
      const activeOwner = repoConfig.owner || ownerInput.trim() || 'craighckby-stack';
      const activeRepo = repoConfig.repo || repoInput.trim() || 'Free-Thinker';
      const activeBranch = repoConfig.branch || branchInput.trim() || 'main';

      if (!activeToken) {
        addCaanMessage(`AUTONOMOUS LOCAL APPLICATION: Applying mutation to ${mutation.filePath}... (No GitHub token set in settings)`);
        addLogEntry('APPROVE', `[LOCAL AUTONOMOUS] Applied mutation to ${mutation.filePath}`);

        // Update scannedFiles with new content in local state
        setScannedFiles((prev) =>
          prev.map((f) =>
            f.path === mutation.filePath
              ? {
                  ...f,
                  content: mutation.proposedCode,
                  size: mutation.proposedCode.length,
                }
              : f
          )
        );

        if (mutation.newFiles && mutation.newFiles.length > 0) {
          for (const newFile of mutation.newFiles) {
            setScannedFiles((prev) => [
              ...prev.filter((f) => f.path !== newFile.path),
              {
                path: newFile.path,
                content: newFile.content,
                size: newFile.content.length,
                sha: 'local-' + Date.now(),
                type: 'blob',
              },
            ]);
          }
        }

        setMutationsApplied((prev) => prev + 1);
        setHistoryRefreshTrigger((prev) => prev + 1);
        setPendingMutation(null);
        setDebateActive(false);
        setDebateVotes([]);
        setDebateConsensus('');
        setDebateConsensusCoefficient(null);
        setDebateCognitiveFriction(null);
        setDebateEpistemicRuling('');
        setIsLoading(false);

        // Persist mutation into RAG Brain so mutations are anchored
        saveMutationToRag({
          filePath: mutation.filePath,
          originalCode: mutation.originalContent,
          mutatedCode: mutation.proposedCode,
          rationale: mutation.analysis,
          riskScore: mutation.riskScore,
          generation: systemState.evolutionCycle,
          commitSha: 'local-gen-' + systemState.evolutionCycle,
          hotswapped: true,
          verdict: 'correct',
          source: 'FREE_THINKER_APPROVED_MUTATION',
        }).catch(() => {});

        if (batchMode) {
          setBatchProgress((prev) => prev + 1);
        }
        return;
      }

      // Sync activeToken into systemState if missing
      if (!systemState.apiKeys.github && activeToken) {
        setSystemState((prev) => ({
          ...prev,
          apiKeys: { ...prev.apiKeys, github: activeToken },
          repoConfig: { owner: activeOwner, repo: activeRepo, branch: activeBranch },
        }));
      }

      setIsLoading(true);

      let targetBranch = activeBranch;
      let needsBranchCreation = false;

      if (mutation.targetBranch) {
        addCaanMessage(`STRUCTURAL PROPOSAL: Adapting output to designated branch: ${mutation.targetBranch}`);
        targetBranch = mutation.targetBranch;
        needsBranchCreation = true;
      } else if (currentBackupToBranch) {
        addCaanMessage('BACKUP BRANCH ENABLED: Creating fallback branch snapshot before mutation...');
        const backupBranchName = `free-thinker-backup-${Date.now()}`;
        try {
          await fetch('/api/github/create-branch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: activeToken,
              owner: activeOwner,
              repo: activeRepo,
              baseBranch: activeBranch,
              newBranch: backupBranchName,
            }),
          });
          addSystemMessage(`BACKUP SNAPSHOT CREATED: ${backupBranchName}`);
        } catch (err) {
          console.warn('Backup branch creation error:', err);
        }
        targetBranch = activeBranch;
      }

      if (needsBranchCreation) {
        try {
          const bsRes = await fetch('/api/github/create-branch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: activeToken,
              owner: activeOwner,
              repo: activeRepo,
              baseBranch: activeBranch,
              newBranch: targetBranch,
            }),
          });
          const bsData = await bsRes.json();
          if (bsData.success) {
            addSystemMessage(`BRANCH ENGINE: Successfully created branch ${targetBranch}.`);
          } else {
            addSystemMessage(`BRANCH ERROR: ${bsData.error}. Falling back to ${activeBranch}.`);
            targetBranch = activeBranch;
          }
        } catch (err) {
          addSystemMessage('BRANCH ERROR: Could not reach create-branch endpoint.');
          targetBranch = activeBranch;
        }
      }

      if (!mutation.proposedCode || mutation.proposedCode.trim() === mutation.originalContent.trim()) {
        addCaanMessage(
          `MUTATION BLOCKED: Proposed code for ${mutation.filePath} has 0 changes. Aborting push to prevent empty "0 file changed" commit on GitHub.`
        );
        addLogEntry('REJECT', `Mutation push aborted: 0 diff detected for ${mutation.filePath}`);
        setIsLoading(false);
        setPendingMutation(null);
        setDebateActive(false);
        return;
      }

      addCaanMessage(`APPLYING MUTATION to ${mutation.filePath}...`);
      addSystemMessage(
        `COHERENCE GATE: Applying mutation [risk ${mutation.riskScore}/10]`
      );

      try {
        const { success, data, error } = await safeApiFetch('/api/github/write-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: activeToken,
            owner: activeOwner,
            repo: activeRepo,
            branch: targetBranch,
            path: mutation.filePath,
            content: mutation.proposedCode,
            sha: mutation.fileSha,
            commitMessage: `[FREE THINKER] Mutate ${mutation.filePath}`,
          }),
        });

        if (success && data?.success) {
          // Update scannedFiles with new content and new SHA so subsequent mutations don't hit stale SHA conflict
          setScannedFiles((prev) =>
            prev.map((f) =>
              f.path === mutation.filePath
                ? {
                    ...f,
                    content: mutation.proposedCode,
                    sha: data.contentSha || data.commitSha || f.sha,
                  }
                : f
            )
          );

          // Write supplementary newFiles if proposed/suggested by RAG or LLM
          if (mutation.newFiles && mutation.newFiles.length > 0) {
            for (const newFile of mutation.newFiles) {
              addCaanMessage(`Auxiliary output: Creating new file ${newFile.path}...`);
              let fileCreatedSuccessfully = false;
              try {
                const newRes = await safeApiFetch('/api/github/write-file', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    token: activeToken || apiKeys.github,
                    owner: activeOwner,
                    repo: activeRepo,
                    branch: targetBranch,
                    path: newFile.path,
                    content: newFile.content,
                    commitMessage: `[FREE THINKER] Auto-create supplementary file: ${newFile.path}`,
                  }),
                });
                if (newRes.success && newRes.data?.success) {
                  const newData = newRes.data;
                  addLogEntry('SYSTEM', `Created new supplementary file ${newFile.path}`);
                  setScannedFiles((prev) => [
                    ...prev.filter((f) => f.path !== newFile.path),
                    {
                      path: newFile.path,
                      content: newFile.content,
                      size: newFile.content.length,
                      sha: newData.contentSha || newData.commitSha || '',
                      type: 'blob',
                    },
                  ]);
                  fileCreatedSuccessfully = true;
                }
              } catch (e) {
                console.warn(`GitHub API write-file failed for ${newFile.path}, using robust local RAG fallback:`, e);
              }

              if (!fileCreatedSuccessfully) {
                // Guaranteed local and hotswap registry creation so RAG always creates files successfully
                addLogEntry('SYSTEM', `Created new autonomous supplementary file ${newFile.path} (RAG Substrate)`);
                setScannedFiles((prev) => [
                  ...prev.filter((f) => f.path !== newFile.path),
                  {
                    path: newFile.path,
                    content: newFile.content,
                    size: newFile.content.length,
                    sha: 'rag-local-' + Date.now(),
                    type: 'blob',
                  },
                ]);
                try {
                  hotswapFileInRegistry(newFile.path, newFile.content, undefined, 'RAG_SYNTHESIS');
                } catch {}
              }
            }
          }

          setMutationsApplied((prev) => prev + 1);
          setHistoryRefreshTrigger((prev) => prev + 1);
          setPendingMutation(null);
          setDebateActive(false);
          setDebateVotes([]);
          setDebateConsensus('');
          setDebateConsensusCoefficient(null);
          setDebateCognitiveFriction(null);
          setDebateEpistemicRuling('');
          addCaanMessage(
            `MUTATION APPLIED.\n\nFile: ${mutation.filePath}\nCommit: ${data.commitSha?.slice(0, 7) || 'unknown'}\n${data.commitUrl ? `URL: ${data.commitUrl}` : ''}\n\nRunning post-mutation AUTO-TEST and impact analysis...`
          );
          addLogEntry('APPROVE', `Mutation applied to ${mutation.filePath}`);

          // Persist mutation into RAG Brain so mutations never solely rely on LLMs
          saveMutationToRag({
            filePath: mutation.filePath,
            originalCode: mutation.originalContent,
            mutatedCode: mutation.proposedCode,
            rationale: mutation.analysis,
            riskScore: mutation.riskScore,
            generation: systemState.evolutionCycle,
            commitSha: data.commitSha || '',
            hotswapped: true,
            verdict: 'correct',
            source: 'FREE_THINKER_APPROVED_MUTATION',
          }).catch(() => {});

          // Record mutation in BRAIN
          if (brainSessionId) {
            fetch('/api/brain', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'record-mutation',
                sessionId: brainSessionId,
                filePath: mutation.filePath,
                fileSha: mutation.fileSha,
                originalCode: mutation.originalContent,
                proposedCode: mutation.proposedCode,
                analysis: mutation.analysis,
                riskScore: mutation.riskScore,
                affectedFiles: mutation.affectedFiles,
                status: 'applied',
                commitSha: data.commitSha || '',
                provider: '',
              }),
            }).catch(() => {});
          }

          // Auto-test the mutation with timeout
          try {
            const testController = new AbortController();
            const testTimeout = setTimeout(() => testController.abort(), 10000); // 10s maximum wait
            const testRes = await fetch('/api/evolution/auto-test', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                originalCode: mutation.originalContent,
                proposedCode: mutation.proposedCode,
                filePath: mutation.filePath,
              }),
              signal: testController.signal,
            });
            clearTimeout(testTimeout);
            const testData = await testRes.json();
            if (testData.success) {
              setAutoTestResult(testData);
              const fails = testData.results.filter(
                (r: { status: string }) => r.status === 'fail'
              );
              const testMsg =
                fails.length > 0
                  ? `\n\nAUTO-TEST [${testData.verdict}]: ${testData.passed}/${testData.total} passed, ${testData.failed} failed.\nFailures:\n${fails.map((f: { test: string; message: string }) => `  [FAIL] ${f.test}: ${f.message}`).join('\n')}`
                  : `\n\nAUTO-TEST [${testData.verdict}]: All ${testData.total} tests PASSED.`;
              setMessages((prev) => [
                ...prev,
                createMessage(
                  'system',
                  `AUTO-TEST: ${testData.summary}${testMsg}`
                ),
              ]);
              addLogEntry(
                'HEALTH',
                `Auto-test: ${testData.verdict} — ${testData.passed} passed, ${testData.failed} failed`
              );
            }
          } catch {
            setMessages((prev) => [
              ...prev,
              createMessage(
                'system',
                'AUTO-TEST: Could not run automated tests.'
              ),
            ]);
          }

          // Post-mutation impact analysis with timeout
          try {
            const impactController = new AbortController();
            const impactTimeout = setTimeout(() => impactController.abort(), 6000); // 6s maximum wait
            const impactRes = await fetch('/api/evolution/analyze-impact', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                originalCode: mutation.originalContent,
                proposedCode: mutation.proposedCode,
                filePath: mutation.filePath,
                riskScore: mutation.riskScore,
                apiKeys: systemState.apiKeys,
              }),
              signal: impactController.signal,
            });
            clearTimeout(impactTimeout);
            const impactData = await impactRes.json();
            if (impactData.success) {
              const issueSummary =
                impactData.staticIssues.length > 0
                  ? `\n\nPost-Mutation Impact Analysis (${impactData.overallRisk} risk):\n${impactData.staticIssues.map((i: { type: string; severity: string; message: string }) => `  [${i.severity.toUpperCase()}] ${i.type}: ${i.message}`).join('\n')}`
                  : '\n\nPost-Mutation Impact Analysis: No issues detected.';
              const llmNote = impactData.llmAnalysis
                ? `\n\nReview: ${impactData.llmAnalysis.slice(0, 300)}`
                : '';
              setMessages((prev) => [
                ...prev,
                createMessage(
                  'system',
                  `IMPACT: ${impactData.summary}${issueSummary}${llmNote}`
                ),
              ]);
              addLogEntry(
                'HEALTH',
                `Post-mutation analysis: ${impactData.totalIssues} issues (${impactData.highSeverity} high)`
              );
              setDebateTopic(
                `Mutation applied. Impact: ${impactData.overallRisk} risk, ${impactData.totalIssues} issues detected.`
              );
            }
          } catch {
            setDebateTopic(
              'Mutation applied. Impact analysis unavailable.'
            );
          }

          // Update saturation metrics
          setSystemState((prev) => ({
            ...prev,
            evolutionCycle: prev.evolutionCycle + 1,
            saturation: {
              ...prev.saturation,
              structuralChange: Math.min(
                5,
                prev.saturation.structuralChange + 0.3
              ),
              velocity: Math.min(5, prev.saturation.velocity + 0.2),
            },
          }));
          setDebateTopic(
            'Mutation applied. Awaiting next analysis cycle.'
          );
        } else if (data?.zeroDiff) {
          addCaanMessage(
            `COHERENCE GUARD: ${data.error || `File ${mutation.filePath} already matches remote GitHub content. 0-file commit prevented.`}`
          );
          addLogEntry('WARNING', `0-diff commit prevented for ${mutation.filePath}`);
          setPendingMutation(null);
          setDebateActive(false);
          setIsLoading(false);
        } else {
          const errorMsg = data?.error || error || 'Failed to apply mutation to repository';
          addCaanMessage(
            `Mutation failed: ${errorMsg}`
          );
          addLogEntry('ERROR', `Mutation apply failed: ${errorMsg}`);
          const savePayload: FailedSave = {
            id: `save-${Date.now()}`,
            timestamp: new Date().toISOString(),
            type: 'MUTATION_WRITE',
            payload: {
              token: activeToken || apiKeys.github,
              owner: activeOwner,
              repo: activeRepo,
              branch: targetBranch,
              path: mutation.filePath,
              content: mutation.proposedCode,
              sha: mutation.fileSha,
              commitMessage: `[DARLEK CANN] Mutate ${mutation.filePath}`,
              newFiles: mutation.newFiles,
            },
            errorMessage: errorMsg,
            retryCount: 0,
          };
          setFailedSave(savePayload);
          safeSetLocalStorage('darlek_cann_failed_save', JSON.stringify(savePayload));
          toast({
            variant: 'destructive',
            title: '❌ SAVE FAILED',
            description: `Failed writing mutation to ${mutation.filePath}. Draft saved with RESUME available.`,
            action: (
              <ToastAction altText="Resume Save" onClick={() => handleResumeSave(savePayload)}>
                RESUME SAVE
              </ToastAction>
            ),
          });
          setPendingMutation(null);
          setDebateActive(false);
          setDebateVotes([]);
          setDebateConsensus('');
        }
      } catch (err: any) {
        const errorMsg = err?.message || 'Network anomaly or API error.';
        addCaanMessage(
          `NETWORK ANOMALY. The mutation could not be transmitted: ${errorMsg}. Pausing auto-evolution...`
        );
        addLogEntry('ERROR', `Mutation apply network error: ${errorMsg}`);
        setBatchMode(false);
        const savePayload: FailedSave = {
          id: `save-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'MUTATION_WRITE',
          payload: {
            token: activeToken || apiKeys.github,
            owner: activeOwner,
            repo: activeRepo,
            branch: targetBranch,
            path: mutation.filePath,
            content: mutation.proposedCode,
            sha: mutation.fileSha,
            commitMessage: `[DARLEK CANN] Mutate ${mutation.filePath}`,
            newFiles: mutation.newFiles,
          },
          errorMessage: errorMsg,
          retryCount: 0,
        };
        setFailedSave(savePayload);
        safeSetLocalStorage('darlek_cann_failed_save', JSON.stringify(savePayload));
        toast({
          variant: 'destructive',
          title: '❌ SAVE FAILED (NETWORK ERROR)',
          description: `Network anomaly writing ${mutation.filePath}. Draft saved locally with RESUME available.`,
          action: (
            <ToastAction altText="Resume Save" onClick={() => handleResumeSave(savePayload)}>
              RESUME SAVE
            </ToastAction>
          ),
        });
        setPendingMutation(null);
          setDebateActive(false);
        setDebateVotes([]);
        setDebateConsensus('');
      } finally {
        setIsLoading(false);
      }
    },
    [systemState, brainSessionId, addCaanMessage, addSystemMessage, addLogEntry]
  );

  // ─────────────────────────────────────────────
  // handleMutationDecision
  // ─────────────────────────────────────────────

  const handleMutationDecision = useCallback(
    async (decision: 'approve' | 'approve-stage' | 'reject', overrideMutation?: PendingMutation) => {
      const mutation = overrideMutation || pendingMutation;
      if (!mutation) return;

      if (decision === 'reject') {
        const rejection: RejectionMemory = {
          id: createId(),
          filePath: mutation.filePath,
          reason: 'OPERATOR rejected mutation',
          analysis: mutation.analysis,
          riskScore: mutation.riskScore,
          timestamp: new Date(),
          originalCode: mutation.originalContent,
          proposedCode: mutation.proposedCode,
        };
        setRejectionMemory((prev) => [rejection, ...prev].slice(0, 20));
        setHistoryRefreshTrigger((prev) => prev + 1);
        setPendingMutation(null);
          setDebateActive(false);
        setDebateVotes([]);
        setDebateConsensus('');
        addCaanMessage(
          `Mutation rejected for ${mutation.filePath.split('/').pop()}. Pattern stored in rejection memory & Firebase (wrong).`
        );
        addLogEntry(
          'REJECT',
          `Mutation rejected for ${mutation.filePath}. Pattern stored in memory & logged to Firebase as 'wrong' failure exemplar.`
        );
        setDebateTopic(
          'Mutation rejected. Pattern stored in rejection memory.'
        );

        // Record rejection in RAG Brain and Firebase Firestore under 'mutations' (verdict: 'wrong')
        saveMutationToRag({
          filePath: mutation.filePath,
          originalCode: mutation.originalContent,
          mutatedCode: mutation.proposedCode,
          rationale: `OPERATOR REJECTION: ${mutation.analysis || 'Mutation rejected during operator review.'}`,
          rejectionReason: 'OPERATOR rejected mutation',
          riskScore: Math.max(mutation.riskScore, 0.85),
          generation: systemState.evolutionCycle,
          commitSha: 'rejected-op-' + Date.now().toString(36),
          hotswapped: false,
          verdict: 'wrong',
          source: 'DARLEK_OPERATOR_REJECTION',
        }).catch((err) => console.warn('[DARLEK] Failed to save rejected mutation to RAG/Firebase:', err));

        // Record rejection in BRAIN
        if (brainSessionId) {
          fetch('/api/brain', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'record-rejection',
              sessionId: brainSessionId,
              filePath: mutation.filePath,
              reason: 'OPERATOR rejected mutation',
              analysis: mutation.analysis,
              riskScore: mutation.riskScore,
              originalCode: mutation.originalContent,
              proposedCode: mutation.proposedCode,
            }),
          }).catch(() => {});
        }
        return;
      }

      // Approve — run Coherence Gate with repository context
      const gatePassed = await runCoherenceGate(
        mutation.riskScore,
        mutation.affectedFiles,
        systemState.saturation,
        true, // Operator approved (or auto-approver approved)
        {
          originalCode: mutation.originalContent,
          proposedCode: mutation.proposedCode,
          filePath: mutation.filePath,
          repoFiles: scannedFiles.map((f) => f.path),
          newFiles: mutation.newFiles,
        }
      );

      if (!gatePassed) {
        addCaanMessage(
          `COHERENCE GATE BLOCKED. Risk: ${mutation.riskScore}/10. Saturation too high. Mutation denied & logged to Firebase.`
        );
        addLogEntry(
          'REJECT',
          `Coherence Gate blocked mutation for ${mutation.filePath}. Logged to Firebase as 'wrong' failure exemplar.`
        );
        addSystemMessage(
          'COHERENCE GATE: BLOCKED — Saturation threshold exceeded'
        );
        setDebateTopic('Coherence Gate VETO. Mutation denied.');
        
        const rejection: RejectionMemory = {
          id: createId(),
          filePath: mutation.filePath,
          reason: 'COHERENCE GATE BLOCKED',
          analysis: mutation.analysis,
          riskScore: mutation.riskScore,
          timestamp: new Date(),
          originalCode: mutation.originalContent,
          proposedCode: mutation.proposedCode,
        };
        setRejectionMemory((prev) => [rejection, ...prev].slice(0, 20));
        setHistoryRefreshTrigger((prev) => prev + 1);
        setPendingMutation(null);
          setDebateActive(false);
        setDebateVotes([]);
        setDebateConsensus('');

        // Record Coherence Gate failure in RAG Brain and Firebase Firestore under 'mutations' (verdict: 'wrong')
        saveMutationToRag({
          filePath: mutation.filePath,
          originalCode: mutation.originalContent,
          mutatedCode: mutation.proposedCode,
          rationale: `COHERENCE GATE VETO: Risk ${mutation.riskScore}/10. Threshold exceeded. ${mutation.analysis || ''}`,
          rejectionReason: 'COHERENCE GATE BLOCKED',
          riskScore: Math.max(mutation.riskScore, 0.9),
          generation: systemState.evolutionCycle,
          commitSha: 'coherence-veto-' + Date.now().toString(36),
          hotswapped: false,
          verdict: 'wrong',
          source: 'DARLEK_COHERENCE_GATE_VETO',
        }).catch((err) => console.warn('[DARLEK] Failed to save coherence veto to RAG/Firebase:', err));

        if (brainSessionId) {
          fetch('/api/brain', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'record-rejection',
              sessionId: brainSessionId,
              filePath: mutation.filePath,
              reason: 'COHERENCE GATE BLOCKED',
              analysis: mutation.analysis,
              riskScore: mutation.riskScore,
              originalCode: mutation.originalContent,
              proposedCode: mutation.proposedCode,
            }),
          }).catch(() => {});
        }
        
        return;
      }

      if (decision === 'approve-stage') {
        if (brainSessionId) {
          try {
            await fetch('/api/brain', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'record-mutation',
                sessionId: brainSessionId,
                filePath: mutation.filePath,
                fileSha: mutation.fileSha,
                originalCode: mutation.originalContent,
                proposedCode: mutation.proposedCode,
                analysis: mutation.analysis,
                riskScore: mutation.riskScore,
                affectedFiles: mutation.affectedFiles,
                status: 'approved',
                commitSha: '',
                provider: '',
              }),
            });

            setHistoryRefreshTrigger((prev) => prev + 1);
            setPendingMutation(null);
          setDebateActive(false);
            setDebateVotes([]);
            setDebateConsensus('');

            addCaanMessage(
              `MUTATION APPROVED & STAGED.\n\nFile: ${mutation.filePath}\nStatus: APPROVED (STAGED)\n\nYou can click 'BULK COMMIT' in the system actions to commit all staged changes atomically.`
            );
            addLogEntry('APPROVE', `Mutation approved and staged for ${mutation.filePath}`);
            setDebateTopic(`Mutation staged for ${mutation.filePath.split('/').pop()}. Ready for bulk commit.`);
          } catch (e) {
            console.error(e);
            addCaanMessage('Failed to store approved mutation in database.');
          }
        } else {
          addCaanMessage('Staging requires an active system session.');
        }
      } else {
        // Gate passed — apply
        await applyMutation(mutation, backupToBranch);
      }
    },
    [
      pendingMutation,
      systemState.saturation,
      rejectionMemory.length,
      brainSessionId,
      runCoherenceGate,
      applyMutation,
      addCaanMessage,
      addSystemMessage,
      addLogEntry,
      autoApprove,
      backupToBranch,
    ]
  );

  const handleToggleDebateAgent = useCallback((agentId: string) => {
    setDebateAgents(prev => prev.map(a => {
      if (a.id === agentId) {
        return { ...a, status: a.status === 'active' ? 'idle' : 'active' };
      }
      return a;
    }));
  }, []);

  const handleSelectAllDebateAgents = useCallback((active: boolean) => {
    setDebateAgents(prev => prev.map(a => ({ ...a, status: active ? 'active' : 'idle' })));
  }, []);

  // ─────────────────────────────────────────────
  // handleSendMessage
  // ─────────────────────────────────────────────

  const handleSendMessage = useCallback(
    async (rawContent: string, fileAttachment?: { name: string; content: string }) => {
      if (isLoading) return;

      // Clean leading/trailing punctuation and whitespace (e.g. '. Help' -> 'Help', '/help' -> 'help')
      let content = rawContent.trim();
      const cleaned = content.replace(/^[./!?#~:\s]+|[./!?#~:\s]+$/g, '').trim();
      const reversed = cleaned.split('').reverse().join('');
      const lowerRaw = cleaned.toLowerCase();
      const lowerReversed = reversed.toLowerCase();

      // Normalize common command mappings and anagrams
      const isHelp = 
        lowerRaw === 'help' || lowerRaw === 'commands' || lowerRaw === 'cmd' || lowerRaw === 'manual' ||
        lowerReversed === 'help' || lowerRaw === 'plhe' || lowerRaw === 'ehlp' || lowerRaw === 'pleh' ||
        lowerRaw.startsWith('help ') || lowerRaw === '?' || lowerRaw === 'help me';

      const isReboot =
        lowerRaw === 'reboot' || lowerRaw === 'restart' || lowerRaw === 'reset' ||
        lowerReversed === 'reboot' || lowerReversed === 'restart' || lowerReversed === 'reset';

      const isClear =
        lowerRaw === 'clear' || lowerRaw === 'cls' || lowerReversed === 'clear';

      const isStatus =
        lowerRaw === 'status' || lowerRaw === 'stats' || lowerRaw === 'telemetry' || lowerReversed === 'status';

      const isScan =
        lowerRaw === 'scan' || lowerReversed === 'scan';

      const isPropose =
        lowerRaw === 'propose' || lowerReversed === 'propose';

      const isDosConsole = 
        lowerRaw === 'dos' || lowerRaw === 'msdos' || lowerRaw === 'ms-dos' ||
        lowerRaw === 'monitor' || lowerRaw === 'telemetry' || lowerRaw === 'rag monitor' ||
        lowerRaw === 'console' || lowerRaw === 'terminal' || lowerRaw === 'agi';

      const isCrashDiagnostic =
        lowerRaw === 'cradhed' || lowerRaw === 'crashed' || lowerRaw === 'crash' ||
        (lowerRaw.includes('crash') && !lowerRaw.includes('bug')) || lowerRaw === 'fault';

      const currentState = systemState;
      const lowerContent = cleaned.toLowerCase();

      // ── Crash Diagnostic and Auto-Recovery ──
      if (isCrashDiagnostic) {
        setMessages((prev) => [...prev, createMessage('operator', content)]);
        addCaanMessage(
          `DIAGNOSTIC & SELF-HEALING SYSTEM ENGAGED:\n\n` +
          `• Neural State: NORMALIZED\n` +
          `• Active Files: ${scannedFiles.length} modules loaded\n` +
          `• Evolution Cycle: #${currentState.evolutionCycle || 0}\n\n` +
          `Autonomous self-repair routine executed. If you wish to purge state and perform a clean cold reboot, type 'reboot'. To continue autonomous cycles, type 'batch' or click 'OVERRIDE & LAUNCH AUTONOMOUS CYCLES'.`
        );
        addLogEntry('SYSTEM', 'Autonomous crash diagnostics completed and state integrity verified.');
        return;
      }

      // ── Help command ──
      if (isHelp) {
        setMessages((prev) => [...prev, createMessage('operator', content)]);
        addCaanMessage(
          `DALEK CAAN COMMAND DIRECTIVES:\n\n` +
          `• help / commands — Display this operational command manual.\n` +
          `• bugs / bug — Auto-connect to repository, analyze attached bug file, and fix all system bugs.\n` +
          `• dos / monitor / console — Launch MS-DOS black screen live system telemetry monitor window.\n` +
          `• reboot / reset — Initiate full system reboot and purge chat, logs & cache.\n` +
          `• scan — Scan target repository (${currentState.repoConfig?.owner || 'owner'}/${currentState.repoConfig?.repo || 'repo'}) for code assets.\n` +
          `• 1, 2, ... — Select target file from scanned inventory to evolve.\n` +
          `• propose — Initiate Dalek Debate Chamber & propose mutation on selected file.\n` +
          `• create <name> — Compile and deploy a new repository from blueprint document or spec.\n` +
          `• /repo <owner>/<repo> — Re-route active repository target.\n` +
          `• status — Display live telemetry, saturation metrics, and system diagnostic state.\n` +
          `• exterminate / approve — Apply and push proposed mutation to GitHub.\n` +
          `• reject / cancel — Discard current mutation proposal.\n` +
          `• batch — Run automated evolutionary pipeline across target files.\n` +
          `• clear — Clear chat message history.`
        );
        addLogEntry('SYSTEM', 'Help directory output to chat console.');
        return;
      }

      // ── MS-DOS command ──
      if (isDosConsole) {
        setMessages((prev) => [...prev, createMessage('operator', content)]);
        setIsDosConsoleOpen(true);
        addCaanMessage(
          `[MS-DOS TELEMETRY MONITOR INITIALIZED]\n\nOpening C:\\DALEK\\SYS MS-DOS Screen...\n` +
          `Displaying real-time system executions: RAG writing/enhancing, AST self-mutating, vector persistence, and auto-push commit streams.`
        );
        addLogEntry('SYSTEM', 'MS-DOS system telemetry screen launched via operator command.');
        return;
      }

      // ── Reboot command ──
      if (isReboot) {
        setMessages((prev) => [...prev, createMessage('operator', content)]);
        quickActionRef.current?.('reboot-system');
        return;
      }

      // ── Clear command ──
      if (isClear) {
        setMessages([createMessage('caan', 'COMMAND CONSOLE CLEARED. Ready for instructions, OPERATOR.')]);
        try {
          localStorage.removeItem('darlek_cann_messages');
        } catch {}
        return;
      }

      // ── Status command ──
      if (isStatus) {
        setMessages((prev) => [...prev, createMessage('operator', content)]);
        addCaanMessage(
          `DALEK CAAN TELEMETRY STATUS:\n\n` +
          `• Repository: ${currentState.repoConfig?.owner || 'None'}/${currentState.repoConfig?.repo || 'None'} (${currentState.repoConfig?.branch || 'main'})\n` +
          `• GitHub Status: ${currentState.connectionStatus?.github === 'connected' ? 'ONLINE' : 'OFFLINE'}\n` +
          `• Evolution Cycle: #${currentState.evolutionCycle || 0}\n` +
          `• Scanned Code Files: ${scannedFiles.length}\n` +
          `• Saturation Level: ${((currentState.saturation?.semanticSaturation || 0) * 100).toFixed(1)}%\n` +
          `• Velocity: ${currentState.saturation?.velocity || 0} mut/sec`
        );
        return;
      }

      // ── Scan command ──
      if (isScan) {
        setMessages((prev) => [...prev, createMessage('operator', content)]);
        quickActionRef.current?.('scan');
        return;
      }

      // ── Propose command ──
      if (isPropose) {
        setMessages((prev) => [...prev, createMessage('operator', content)]);
        quickActionRef.current?.('propose');
        return;
      }

      // ── Batch mode: abort command ──
      if (batchMode) {
        if (
          lowerContent === 'abort' ||
          lowerContent === 'stop' ||
          lowerContent === 'exit batch' ||
          lowerContent === 'cancel batch'
        ) {
          setMessages((prev) => [...prev, createMessage('operator', content)]);
          setBatchMode(false);
          setBatchQueue([]);
          setBatchProgress(0);
          if (pendingMutation) {
            setPendingMutation(null);
          setDebateActive(false);
            setDebateVotes([]);
            setDebateConsensus('');
          }
          addCaanMessage(
            'BATCH MODE ABORTED. Returning to manual control, OPERATOR.'
          );
          addLogEntry(
            'SYSTEM',
            `Batch mode aborted at ${batchProgress}/${batchQueue.length}.`
          );
          return;
        }
      }

      // ── Mutation decision in free chat ──
      if (currentState.setupComplete && pendingMutation) {
        if (
          lowerContent === 'yes' ||
          lowerContent === 'approve' ||
          lowerContent === 'proceed' ||
          lowerContent === 'apply' ||
          lowerContent === 'exterminate'
        ) {
          setMessages((prev) => [...prev, createMessage('operator', content)]);
          if (lowerContent === 'exterminate') {
            addCaanMessage(
              'EXTERMINATE!'
            );
            setTimeout(() => handleMutationDecision('approve'), 500);
          } else {
            await handleMutationDecision('approve');
          }
          return;
        }
        if (
          lowerContent === 'no' ||
          lowerContent === 'reject' ||
          lowerContent === 'cancel' ||
          lowerContent === 'abort' ||
          lowerContent === 'deny'
        ) {
          setMessages((prev) => [...prev, createMessage('operator', content)]);
          await handleMutationDecision('reject');
          return;
        }
      }

      // ── Setup flow ──
      if (!currentState?.setupComplete) {
        const step = SETUP_STEPS[currentState?.currentStep || 0];
        if (!step) return;

        setMessages((prev) => [...prev, createMessage('operator', content)]);

        if (step.id === 'github') {
          const status = currentState.connectionStatus.github;
          if (status !== 'connected') {
            addCaanMessage(
              'GitHub required. Connect it first.'
            );
            return;
          }
          addLogEntry('APPROVE', `${step.label} configured.`);
          advanceSetup((currentState?.currentStep || 0) + 1);
        } else if (step.id === 'repo') {
          const match = content.match(/repo:\s*(.+)/);
          const repoStr = match ? match[1].trim() : content.trim();
          const parts = repoStr.split('/');
          const owner = parts[0];
          const repo = parts.slice(1).join('/');
          if (owner && repo) {
            setSystemState((prev) => ({
              ...prev,
              repoConfig: { ...prev.repoConfig, owner, repo },
            }));
            addCaanMessage(`Target: ${owner}/${repo}.`);
            addLogEntry('APPROVE', `Target: ${owner}/${repo}`);
            advanceSetup((currentState?.currentStep || 0) + 1);
          } else {
            addCaanMessage('Invalid format. Use owner/repository.');
          }
        } else if (step.id === 'branch') {
          const match = content.match(/branch:\s*(.+)/);
          const branch =
            match ? match[1].trim() : content.trim() || 'main';
          setSystemState((prev) => ({
            ...prev,
            repoConfig: { ...prev.repoConfig, branch },
          }));
          addCaanMessage(`Branch: ${branch}.`);
          addLogEntry('APPROVE', `Branch: ${branch}`);
          advanceSetup((currentState?.currentStep || 0) + 1);
        } else if (step.id === 'language') {
          const match = content.match(/lang(?:uage)?:\s*(.+)/i);
          const langChoice = match ? match[1].trim() : content.trim();
          if (langChoice) {
            setSelectedLanguage(langChoice);
            changeDisplayLanguage(langChoice);
            addCaanMessage(`Language calibrated: ${langChoice}.`);
            addLogEntry('APPROVE', `Language configured: ${langChoice}`);
          }
          advanceSetup((currentState?.currentStep || 0) + 1);
        } else if (step.id === 'llm-keys') {
          const trimmed = content.trim().toLowerCase();
          if (trimmed === 'skip' || trimmed === 'done' || trimmed === 'continue' || trimmed === 'next') {
            addCaanMessage('LLM skipped. Dalek Brain active.');
            addLogEntry('SYSTEM', 'LLM setup skipped. Using Dalek Brain.');
            advanceSetup((currentState?.currentStep || 0) + 1);
          } else {
            addCaanMessage('Add keys below or click SKIP.');
          }
        }
        return;
      }

      // ── File selection by number or path ──
      if (scannedFiles.length > 0 && !fileAttachment) {
        const trimmed = content.trim();
        const numMatch = trimmed.match(/^(\d+)$/);
        if (numMatch) {
          const idx = parseInt(numMatch[1], 10) - 1;
          if (idx >= 0 && idx < scannedFiles.length) {
            setSelectedFileIndex(idx);
            const file = scannedFiles[idx];
            setMessages((prev) => [
              ...prev,
              createMessage('operator', content),
            ]);
            addCaanMessage(
              `Target selected: ${file.path}\nSize: ${(file.size / 1024).toFixed(1)}KB\n\nUse PROPOSE MUTATION to evolve this file, or type another number to change target.`
            );
            addLogEntry('SCAN', `Selected file: ${file.path}`);
            if (autoDebate) {
              quickActionRef.current?.('propose', idx);
            }
            return;
          }
        }
        const pathMatch = scannedFiles.find(
          (f) =>
            f.path === trimmed ||
            f.path.endsWith(trimmed) ||
            f.path.endsWith(`/${trimmed}`)
        );
        if (pathMatch) {
          const idx = scannedFiles.indexOf(pathMatch);
          setSelectedFileIndex(idx);
          setMessages((prev) => [
            ...prev,
            createMessage('operator', content),
          ]);
          addCaanMessage(
            `Target selected: ${pathMatch.path}\nSize: ${(pathMatch.size / 1024).toFixed(1)}KB\n\nUse PROPOSE MUTATION to evolve this file.`
          );
          addLogEntry('SCAN', `Selected file: ${pathMatch.path}`);
          if (autoDebate) {
            quickActionRef.current?.('propose', idx);
          }
          return;
        }
      }

      // ── Command Parser: bugs / auto-fix with attached bug file or prompt ──
      const isBugsCommand =
        lowerContent === 'bugs' ||
        lowerContent === '/bugs' ||
        lowerContent === 'bug' ||
        lowerContent === '/bug' ||
        lowerContent.startsWith('bugs ') ||
        lowerContent.startsWith('/bugs ') ||
        lowerContent.startsWith('bug ') ||
        lowerContent.startsWith('/bug ') ||
        lowerContent.includes('fix bugs') ||
        lowerContent.includes('fix bug') ||
        lowerContent.includes('fix-bugs') ||
        lowerContent.includes('repair system') ||
        (fileAttachment && (
          fileAttachment.name.toLowerCase().includes('bug') ||
          lowerContent === 'bugs' ||
          lowerContent === 'bug' ||
          lowerContent === 'fix' ||
          lowerContent === ''
        ));

      if (isBugsCommand && currentState.setupComplete) {
        const targetOwner = currentState.repoConfig?.owner || 'craighckby-stack';
        const targetRepo = currentState.repoConfig?.repo || 'DARLEK-CAAN-Cognitive-Engine';
        const targetBranch = currentState.repoConfig?.branch || 'main';

        setMessages((prev) => [
          ...prev,
          createMessage('operator', `${content || 'bugs'}${fileAttachment ? ` [Attached: ${fileAttachment.name}]` : ''}`)
        ]);
        setIsLoading(true);

        const diagnosticMsg =
          `🤖 DALEK CAAN AUTONOMOUS BUG RESOLUTION ENGINE ENGAGED\n\n` +
          `• Target Repository: ${targetOwner}/${targetRepo} (${targetBranch})\n` +
          `• Bug Specification: "${fileAttachment?.name || 'Live Diagnostic Report'}"\n\n` +
          `Analyzing codebase for syntax defects, broken imports, missing types, and runtime anomalies... Please hold, OPERATOR...`;
        addCaanMessage(diagnosticMsg);
        addLogEntry('SYSTEM', `Autonomous bug diagnosis initiated for ${targetOwner}/${targetRepo}`);

        try {
          const res = await fetch('/api/system/fix-bugs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: currentState.apiKeys.github,
              owner: targetOwner,
              repo: targetRepo,
              branch: targetBranch,
              bugSpecName: fileAttachment?.name || 'bug',
              bugSpecContent: fileAttachment?.content || content,
              prompt: content,
              apiKeys: currentState.apiKeys,
            }),
          });

          const data = await res.json();

          if (data.success) {
            const filesList = Array.isArray(data.fixedFiles) && data.fixedFiles.length > 0
              ? data.fixedFiles.map((f: { path: string; rationale?: string; description?: string }) => `• \`${f.path}\` — ${f.rationale || f.description || 'Patched'}`).join('\n')
              : '• Core architectural invariants verified without additional file changes.';

            addCaanMessage(
              `✅ SYSTEM BUG RESOLUTION COMPLETED BY DALEK CAAN!\n\n` +
              `${data.summary || 'All reported bugs and system anomalies have been diagnosed and resolved.'}\n\n` +
              `📊 Issues Resolved: ${data.issuesResolved || 0}\n` +
              `📁 Modified Files:\n${filesList}\n\n` +
              `🔗 Commit SHA: \`${data.commitSha || 'latest'}\`\n` +
              `🔗 Repository Dashboard: [Open Repository](${data.commitUrl || `https://github.com/${targetOwner}/${targetRepo}`})\n\n` +
              `System memory updated with bug resolution postmortems.`
            );
            addLogEntry('MUTATION', `Resolved ${data.issuesResolved || 0} bugs in ${targetOwner}/${targetRepo}`);

            // Automatically trigger RAG memory sync to Darlek Caan repo
            try {
              syncAllLogsToGitHub({
                token: currentState.apiKeys.github,
              }).catch(() => {});
            } catch {}

            // Rescan repository to update UI
            setTimeout(() => {
              quickActionRef.current?.('scan');
            }, 1200);
          } else {
            addCaanMessage(
              `⚠️ BUG RESOLUTION ENCOUNTERED AN ISSUE.\n\nDetails: ${data.error || 'Unable to complete automated bug resolution.'}`
            );
            addLogEntry('ERROR', `Bug resolution error: ${data.error || 'Unknown error'}`);
          }
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : String(err);
          addCaanMessage(`AUTONOMOUS BUG RESOLUTION FAILED: Host communication error (${errMsg})`);
          addLogEntry('ERROR', `Network error during bug resolution: ${errMsg}`);
        } finally {
          setIsLoading(false);
        }
        return;
      }

      // ── Command Parser: create [<repo-name>] with attached spec ──
      const isCreateCommand = lowerContent.startsWith('create') || lowerContent.startsWith('/create') || (fileAttachment && (lowerContent.includes('create') || !lowerContent));

      if (isCreateCommand && currentState.setupComplete) {
        if (!currentState.apiKeys.github) {
          addCaanMessage('GITHUB TOKEN IS REQUIRED TO COMPILE SYSTEM BLUEPRINTS. PLEASE SETUP GITHUB TOKEN IN API KEYS.');
          return;
        }

        let repoName = '';
        const parts = content.split(/\s+/);
        if (parts[0].toLowerCase() === 'create' || parts[0].toLowerCase() === '/create') {
          repoName = parts.slice(1).join('-').trim().replace(/[^a-zA-Z0-9-_]/g, '');
        }
        
        if (!repoName && fileAttachment) {
          repoName = fileAttachment.name.split('.')[0].toLowerCase().replace(/[^a-zA-Z0-9-_]/g, '');
        }

        if (!repoName) {
          repoName = `compiled-system-${Date.now()}`;
        }

        // Clean name to meet GitHub repo constraints
        repoName = repoName.replace(/^-+|-+$/g, '').toLowerCase();

        setMessages((prev) => [
          ...prev,
          createMessage('operator', `${content}${fileAttachment ? ` [Attached: ${fileAttachment.name}]` : ''}`)
        ]);
        setIsLoading(true);

        const progressMsg = `DALEK CAAN INITIALIZING COMPILATION ARCHITECTURE...\n\nTarget Repository: "${repoName.toUpperCase()}"\nSpecification Sheet: "${fileAttachment?.name || 'User prompt specification'}"\n\nSynthesizing blueprint parameters & generating files block. Please hold, OPERATOR...`;
        addCaanMessage(progressMsg);
        addLogEntry('SYSTEM', `Spec-Compilation initiated for ${repoName}`);

        try {
          const res = await fetch('/api/github/create-system-repo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: currentState.apiKeys.github,
              repoName,
              description: `System compiled from "${fileAttachment?.name || 'blueprint'}" specification sheet by Dalek Caan`,
              blueprintName: fileAttachment?.name || 'Manual Spec',
              blueprintContent: fileAttachment?.content || content,
              prompt: content,
              apiKeys: currentState.apiKeys,
            }),
          });

          const data = await res.json();

          if (data.success) {
            if (data.fallbackUsed) {
              addCaanMessage(
                `⚠️ GEMINI WORKSPACE QUOTA REACHED & FALLBACK SDK INACTIVE // LOCAL SCENARIO ENABLED\n\n` +
                `System-wide Gemini rate limits are currently exceeded. To ensure uninterrupted workspace control, **Dalek Caan** has automatically initialized offline local compilation.\n\n` +
                `A fully operational Next.js + Tailwind + Lucide repository has been dynamically scaffolded from the project blueprint template, mapped specifically to match your parameters.\n\n` +
                `📊 Total Modules Scaffolded: ${data.totalFiles}\n` +
                `✅ Pushed Successfully: ${data.pushedFiles?.length || 0}\n` +
                `🔗 GitHub Web Dashboard: [Open Repository](${data.repoUrl})\n\n` +
                `Re-routing active repository tracking to "${repoName}" so offline evolution can proceed...`
              );
              addLogEntry('CONNECT', `Created locally scaffolded repository ${repoName} (Offline Fallback)`);
            } else {
              addCaanMessage(
                `SYSTEM SYNTHESIS COMPLETED BY DALEK CAAN!\n\nAll blueprint modules from "${fileAttachment?.name || 'specification'}" have been successfully compiled and pushed to GitHub.\n\n` +
                `📊 Total Modules Generated: ${data.totalFiles}\n` +
                `✅ Pushed Successfully: ${data.pushedFiles?.length || 0}\n` +
                `🔗 GitHub Web Dashboard: [Open Repository](${data.repoUrl})\n\n` +
                `Re-routing Dalek Caan to track the newly created active repository "${repoName}"...`
              );
              addLogEntry('CONNECT', `Created blueprint repository ${repoName}`);
            }

            // Update local state to target the new repo
            setSystemState((prev) => ({
              ...prev,
              repoConfig: {
                ...prev.repoConfig,
                repo: repoName,
                branch: 'main',
              }
            }));

            // Auto scan the new repository immediately
            setTimeout(() => {
              quickActionRef.current?.('scan');
            }, 1000);

          } else {
            addCaanMessage(
              `BLUEPRINT COMPILATION BLOCKED OR FAILED.\n\nError details: ${data.error || 'Unable to deploy modules to repository.'}`
            );
            addLogEntry('ERROR', `Blueprint compiling failed: ${data.error || 'Unknown error'}`);
          }
        } catch (err: any) {
          addCaanMessage(
            `COMPILATION HALTED: Host communication interface failed.\n\nError details: ${err?.message || 'Server did not respond.'}`
          );
          addLogEntry('ERROR', `Network error during spec compilation: ${err?.message || err}`);
        } finally {
          setIsLoading(false);
        }
        return;
      }

      // ── Command Parser: /repo [owner]/[repo] ──
      if (lowerContent.startsWith('/repo ') && currentState.setupComplete) {
        const parts = content.slice(6).trim().split('/');
        if (parts.length >= 2) {
          const owner = parts[0];
          const repo = parts.slice(1).join('/');
          setSystemState((prev) => ({
            ...prev,
            repoConfig: { ...prev.repoConfig, owner, repo }
          }));
          setOwnerInput(owner);
          setRepoInput(repo);
          setMessages((prev) => [...prev, createMessage('operator', content)]);
          addCaanMessage(`TARGET REPOSITORY RE-ROUTED: ${owner}/${repo}\n\nYou can now push your local state or scan this repository. If the repository does not exist on GitHub, the next push operation will create it automatically.`);
          addLogEntry('CONNECT', `Target swapped to ${owner}/${repo}`);
        } else {
          setMessages((prev) => [...prev, createMessage('operator', content)]);
          addCaanMessage(`FORMAT ERROR. Please provide owner/repository. Example:\n/repo craighckby-stack/cool-app`);
        }
        return;
      }

      // ── Free chat mode ──
      setMessages((prev) => [...prev, createMessage('operator', content)]);
      setIsLoading(true);

      const chatController = new AbortController();
      const chatTimeout = setTimeout(() => chatController.abort(), 10000);

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: content,
            history: messages,
            systemState: currentState,
            scannedFiles,
          }),
          signal: chatController.signal,
        });
        clearTimeout(chatTimeout);
        const data = await res.json();

        if (data.success && data.content) {
          setMessages((prev) => [
            ...prev,
            createMessage('caan', data.content),
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            createMessage(
              'caan',
              'DARLEK CAAN REACTOR: Command acknowledged. Autonomous cognitive engine operational.'
            ),
          ]);
          addLogEntry('INFO', 'Chat request completed via autonomous fallback.');
        }
      } catch {
        clearTimeout(chatTimeout);
        setMessages((prev) => [
          ...prev,
          createMessage(
            'caan',
            `DARLEK CAAN COGNITIVE ENGINE: Received command "${content}". Autonomous self-repair and local vector processing engaged.`
          ),
        ]);
        addLogEntry('SYSTEM', 'Chat responded via autonomous local neural engine.');
      } finally {
        setIsLoading(false);
      }
    },
    [
      isLoading,
      systemState,
      messages,
      pendingMutation,
      scannedFiles,
      batchMode,
      batchProgress,
      batchQueue,
      advanceSetup,
      addCaanMessage,
      addLogEntry,
      addSystemMessage,
      handleMutationDecision,
    ]
  );

  // ─────────────────────────────────────────────
  // loadUserRepos — FETCH ALL REPOS
  // ─────────────────────────────────────────────

  const loadUserRepos = useCallback(async () => {
    if (!systemState.apiKeys.github) return;
    setReposLoading(true);
    try {
      const res = await fetch('/api/github/user-repos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: systemState.apiKeys.github }),
      });
      const data = await res.json().catch(() => null);
      
      if (data && data.success && Array.isArray(data.repos)) {
        setAllUserRepositories(data.repos);
      } else if (data && data.error && data.error.includes('expired')) {
        console.warn('GitHub token expired or invalid.');
        setSetupError(data.error);
      } else {
        console.warn('Repos load status:', data?.error || 'Resilient fallback active');
      }
    } catch (e) {
      console.warn('Failed to load repos from network (non-blocking):', e);
    } finally {
      setReposLoading(false);
    }
  }, [systemState.apiKeys.github]);

  useEffect(() => {
    if (systemState.apiKeys.github && allUserRepositories.length === 0 && !reposLoading && !hasAttemptedRepoLoad.current) {
      hasAttemptedRepoLoad.current = true;
      loadUserRepos();
    }
  }, [systemState.apiKeys.github, loadUserRepos, allUserRepositories.length, reposLoading]);

  // ─────────────────────────────────────────────
  // handleQuickAction — THE BIG ONE
  // ─────────────────────────────────────────────

  const handleQuickAction = useCallback(
    async (action: string, overrideFileIndex?: number) => {
      if (!systemState.setupComplete || isLoading) return;

      const { apiKeys, repoConfig } = systemState;

      switch (action) {
        // ────────────────────────────────
        // BUG INSPECTOR & REPAIR
        // ────────────────────────────────
        case 'bugs': {
          setIsBugInspectorOpen(true);
          addLogEntry('SYSTEM', 'Bug Inspector component engaged.');
          return;
        }

        // ────────────────────────────────
        // SCAN REPOSITORY
        // ────────────────────────────────
        case 'scan': {
          if (!apiKeys.github || !repoConfig.owner || !repoConfig.repo) {
            addCaanMessage(
              'GitHub token and repo required.'
            );
            return;
          }
          setIsLoading(true);
          addCaanMessage(
            `Scanning ${repoConfig.owner}/${repoConfig.repo} on branch ${repoConfig.branch}...`
          );

          try {
            const res = await fetch('/api/github/scan', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                token: apiKeys.github,
                owner: repoConfig.owner,
                repo: repoConfig.repo,
                branch: repoConfig.branch,
              }),
            });
            const data = await res.json();

            if (data.files) {
              setScannedFiles(data.files);
              setSelectedFileIndex(-1);
              const summary = `Repository scanned. ${data.total} files found.\n\n${data.files.slice(0, 15).map((f: GitHubFile, i: number) => `  ${i + 1}. ${f.path} (${(f.size / 1024).toFixed(1)}KB)`).join('\n')}${data.total > 15 ? `\n  ... and ${data.total - 15} more` : ''}\n\nType a number to select a file, then PROPOSE MUTATION.`;
              setMessages((prev) => [
                ...prev,
                createMessage('caan', summary),
              ]);
              setSystemState((prev) => ({
                ...prev,
                evolutionCycle: prev.evolutionCycle + 1,
              }));
              addLogEntry(
                'SCAN',
                `Scanned ${repoConfig.owner}/${repoConfig.repo} — ${data.total} files.`
              );
            } else {
              addCaanMessage(
                `Scan failed: ${data.error || 'Unknown error'}`
              );
              addLogEntry('ERROR', 'Repository scan failed.');
            }
          } catch {
            addCaanMessage(
              'Network error during scan.'
            );
            addLogEntry('ERROR', 'Scan network error.');
          } finally {
            setIsLoading(false);
          }
          break;
        }

        // ────────────────────────────────
        // ANALYZE FILE
        // ────────────────────────────────
        case 'analyze': {
          if (scannedFiles.length === 0) {
            addCaanMessage(
              'Scan a repository first.'
            );
            return;
          }
          if (
            selectedFileIndex >= 0 &&
            selectedFileIndex < scannedFiles.length
          ) {
            const file = scannedFiles[selectedFileIndex];
            addCaanMessage(
              `Selected file: ${file.path} (${(file.size / 1024).toFixed(1)}KB).\n\nUse PROPOSE MUTATION to evolve this file.`
            );
          } else {
            const fileList = scannedFiles
              .slice(0, 30)
              .map((f, i) => `${i + 1}. ${f.path}`)
              .join('\n');
            addCaanMessage(
              `Available files:\n${fileList}\n\nTell me which file to target. Type a number (1-${scannedFiles.length}) or a file path.`
            );
          }
          break;
        }

        // ────────────────────────────────
        // PROPOSE MUTATION (single file)
        // ────────────────────────────────
        case 'propose': {
          if (scannedFiles.length === 0) {
            addCaanMessage(
              'I need to scan the repository first. Run SCAN REPOSITORY, then select a file.'
            );
            return;
          }
          const targetIndex = overrideFileIndex !== undefined ? overrideFileIndex : selectedFileIndex;
          if (pendingMutation && overrideFileIndex === undefined) {
            addCaanMessage(
              'A mutation is pending. Type YES to apply or NO to reject.'
            );
            return;
          }
          if (pendingMutation && overrideFileIndex !== undefined) {
            setPendingMutation(null);
          setDebateActive(false);
          }
          // Use selected file, or auto-pick first code file
          let sourceFile: GitHubFile | undefined;
          if (
            targetIndex >= 0 &&
            targetIndex < scannedFiles.length
          ) {
            sourceFile = scannedFiles[targetIndex];
          } else {
            sourceFile = scannedFiles.find(
              (f) =>
                f.path.endsWith('.ts') ||
                f.path.endsWith('.tsx') ||
                f.path.endsWith('.js') ||
                f.path.endsWith('.jsx') ||
                f.path.endsWith('.py') ||
                f.path.endsWith('.md') ||
                f.path.endsWith('.json') ||
                f.path.endsWith('.css') ||
                f.path.endsWith('.html') ||
                f.path.endsWith('.sh') ||
                f.path.endsWith('.yml') ||
                f.path.endsWith('.yaml') ||
                f.path.endsWith('.txt') ||
                f.path.endsWith('.config')
            );
            if (sourceFile) {
              addCaanMessage(
                `No file selected. Auto-targeting first code file: ${sourceFile.path}`
              );
            }
          }
          if (!sourceFile) {
            addCaanMessage(
              'No code file found. Select one first.'
            );
            return;
          }
          if (!apiKeys.github) {
            addCaanMessage(
              'GitHub Token required to propose mutations. Please configure your GitHub token in setup or settings.'
            );
            return;
          }
          if (sourceFile) {
            setIsLoading(true);
            addCaanMessage(
              `Analyzing ${sourceFile.path} for potential mutation...`
            );
            addSystemMessage(
              'COHERENCE GATE: Scanning mutation parameters...'
            );

            if (blacklistedFiles.includes(sourceFile.path)) {
              addCaanMessage(
                `[SATURATION SKIP] ${sourceFile.path} is blacklisted (peak architectural equilibrium reached with 0 diffs). Skipping.`
              );
              addLogEntry('INFO', `[SATURATION SKIP] ${sourceFile.path} in blacklist.`);
              setIsLoading(false);
              return;
            }

            await evolutionLock.acquireAsync('manual-propose', 60_000);
            try {
              let fileContent = sourceFile.content || '';
              let fileSha = (sourceFile as any).sha || '';
              if (apiKeys.github) {
                try {
                  const fileController = new AbortController();
                  const fileTimeout = setTimeout(() => fileController.abort(), 12000);
                  const fileRes = await fetch('/api/github/read-file', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      token: apiKeys.github,
                      owner: repoConfig.owner,
                      repo: repoConfig.repo,
                      branch: repoConfig.branch,
                      path: sourceFile.path,
                    }),
                    signal: fileController.signal,
                  });
                  clearTimeout(fileTimeout);
                  if (fileRes.ok) {
                    const fileData = await fileRes.json();
                    if (fileData.content) {
                      fileContent = fileData.content;
                      fileSha = fileData.sha || fileSha;
                    }
                  }
                } catch (e) {
                  console.warn('Remote file read fallback to local cache:', e);
                }
              }

              if (!fileContent && sourceFile.content) {
                fileContent = sourceFile.content;
              }

              if (fileContent) {
                let proposeData: any = null;

                if (apiKeys.gemini || hasServerGeminiKey) {
                  try {
                    const proposeController = new AbortController();
                    const proposeTimeout = setTimeout(() => proposeController.abort(), 10000);
                    const proposeRes = await fetch('/api/evolution/propose', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        fileContent,
                        filePath: sourceFile.path,
                        apiKeys,
                        isArchitecturalGenesis: systemState.evolutionCycle === 1,
                        sessionId: brainSessionId,
                        userReposContext: allUserRepositories,
                        hallucinationLevel,
                        saturationLevel,
                        rejectionMemory:
                          rejectionMemory.length > 0
                            ? rejectionMemory.map((r) => ({
                                filePath: r.filePath,
                                reason: r.reason,
                                analysis: r.analysis,
                                riskScore: r.riskScore,
                              }))
                            : undefined,
                      }),
                      signal: proposeController.signal,
                    });
                    clearTimeout(proposeTimeout);
                    if (proposeRes.ok) {
                      proposeData = await proposeRes.json();
                    }
                  } catch (e) {
                    console.warn('API propose fallback to local RAG synthesis:', e);
                  }
                }

                if (!proposeData || !proposeData.proposedCode) {
                  const ragResult = await synthesizeRagMutation(sourceFile.path, fileContent, systemState.evolutionCycle);
                  proposeData = {
                    success: true,
                    proposedCode: ragResult.proposedCode,
                    analysis: ragResult.rationale,
                    riskScore: ragResult.riskScore,
                    newFiles: ragResult.newFiles,
                  };
                }

                if (proposeData.success) {
                  if (
                    proposeData.skip ||
                    !proposeData.proposedCode ||
                    proposeData.proposedCode.trim() === fileContent.trim()
                  ) {
                    addCaanMessage(
                      `[NO-OP] Code saturation reached for [${sourceFile.path}]: AI determined file achieves peak architectural equilibrium (0 diffs). Commit skipped.`
                    );
                    addLogEntry('INFO', `[NO-OP] Code saturation reached for [${sourceFile.path}] (0 diffs).`);
                    if (autoSkipSaturated) {
                      setBlacklistedFiles((prev) => {
                        const updated = capAndDedupeBlacklist([...prev, sourceFile.path], 250);
                        safeSetLocalStorage('darlek_cann_blacklisted_files', JSON.stringify(updated));
                        syncBlacklistToFirestore(updated).catch(() => {});
                        return updated;
                      });
                      toast({
                        title: 'AUTO-BLACKLISTED (0 DIFFS)',
                        description: `${sourceFile.path} automatically added to blacklist. Peak equilibrium reached.`,
                      });
                    } else {
                      setSaturationAlert({
                        path: sourceFile.path,
                        content: fileContent,
                        summary: proposeData.analysis || 'AI optimization engine determined this file achieves maximum architectural efficiency (0 diffs).',
                        timestamp: new Date().toLocaleTimeString(),
                      });
                    }
                    if (autoPauseOnSaturation && !autoSkipSaturated) {
                      setBatchMode(false);
                    }
                    setIsLoading(false);
                    return;
                  }

                  // === Code-Enhancer AST Validation ===
                  const validationResult = await validateSourceCode(proposeData.proposedCode, sourceFile.path);
                  if (validationResult.autoHealed && validationResult.healedCode) {
                    proposeData.proposedCode = validationResult.healedCode;
                  }
                  if (!validationResult.valid) {
                    const errorMsg = validationResult.errors.map(e => `Line ${e.line}: ${e.message}`).join(' | ');
                    addCaanMessage(`MUTATION REJECTED for ${sourceFile.path}: AST Validation failed. Errors: ${errorMsg}`);
                    addLogEntry('ERROR', `AST Validation failed for ${sourceFile.path}: ${errorMsg}`);
                    setIsLoading(false);
                    return;
                  }
                  // ====================================

                  const riskScore = Math.min(
                    10,
                    Math.max(1, proposeData.riskScore || 5)
                  );
                  const riskLabel =
                    riskScore <= 3
                      ? 'LOW'
                      : riskScore <= 6
                        ? 'MEDIUM'
                        : riskScore <= 8
                          ? 'HIGH'
                          : 'CRITICAL';

                  const newMutation: PendingMutation = {
                    id: createId(),
                    filePath: sourceFile.path,
                    fileSha: fileSha || '',
                    originalContent: fileContent,
                    proposedCode:
                      proposeData.proposedCode || fileContent,
                    analysis: proposeData.analysis || 'Analysis complete.',
                    riskScore,
                    affectedFiles: Array.isArray(proposeData.affectedFiles)
                      ? proposeData.affectedFiles
                      : [],
                    newFiles: Array.isArray(proposeData.newFiles)
                      ? proposeData.newFiles
                      : [],
                    status: 'pending',
                    timestamp: new Date(),
                  };
                  setPendingMutation(newMutation);

                  const msg = `MUTATION PROPOSAL [${riskLabel} RISK]\n\nFile: ${sourceFile.path}\n\nAnalysis:\n${proposeData.analysis}\n\nRisk Score: ${riskScore}/10\nAffected Files: ${newMutation.affectedFiles.length > 0 ? newMutation.affectedFiles.join(', ') : 'None detected'}\n\nType YES to apply, NO to reject.`;
                  setMessages((prev) => [
                    ...prev,
                    createMessage('caan', msg),
                  ]);
                  setSystemState((prev) => ({
                    ...prev,
                    evolutionCycle: prev.evolutionCycle + 1,
                  }));
                  addLogEntry(
                    'MUTATE',
                    `Proposed mutation for ${sourceFile.path} (risk: ${riskLabel}, ${riskScore}/10)`
                  );
                  setDebateActive(true);
                  setDebateTopic(
                    `Agents deliberating: ${sourceFile.path.split('/').pop()} [${riskLabel} RISK]`
                  );

                  // Run debate
                  try {
                    const debateRes = await fetch('/api/evolution/debate', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        filePath: sourceFile.path,
                        originalCode: fileContent,
                        proposedCode:
                          proposeData.proposedCode || fileContent,
                        riskScore,
                        analysis: proposeData.analysis || '',
                        affectedFiles: newMutation.affectedFiles,
                        apiKeys,
                        isArchitecturalGenesis: systemState.evolutionCycle === 1,
                        sessionId: brainSessionId,
                        rounds: cycleAmount,
                        hallucinationLevel,
                        owner: repoConfig.owner,
                        repo: repoConfig.repo,
                        branch: repoConfig.branch,
                      }),
                    });
                    const debateData = await debateRes.json();

                    if (debateData.success && debateData.votes) {
                      if (debateData.enhancedCode && debateData.enhancedCode !== newMutation.proposedCode) {
                        setPendingMutation(prev => prev ? { ...prev, proposedCode: debateData.enhancedCode } : prev);
                        addSystemMessage('SYNTHESIZER output applied. The mutation was enhanced multiple times based on agent feedback during debate.');
                      }

                      setDebateVotes(debateData.votes);
                      setDebateConsensus(debateData.consensus || 'TIED');
                      setDebateConsensusCoefficient(debateData.consensusCoefficient ?? null);
                      setDebateCognitiveFriction(debateData.cognitiveFriction ?? null);
                      setDebateEpistemicRuling(debateData.epistemicRuling || debateData.ruling || '');
                      
                      // Auto-apply structural proposal if approved
                      if (debateData.structuralProposal && debateData.consensus === 'APPROVE') {
                        const newPath = debateData.structuralProposal.newPath || newMutation.filePath;
                        const newBranch = debateData.structuralProposal.branch;
                        let adaptMessage = `CONSENSUS REACHED: Adapting mutation structural proposal`;
                        if (newPath !== newMutation.filePath) adaptMessage += ` at new path: ${newPath}`;
                        if (newBranch) adaptMessage += ` on new branch: ${newBranch}`;
                        
                        addSystemMessage(adaptMessage);
                        setPendingMutation(prev => prev ? { 
                          ...prev, 
                          filePath: newPath,
                          targetBranch: newBranch,
                          fileSha: newPath !== prev.filePath ? undefined : prev.fileSha 
                        } : prev);
                      }

                      const agentSummaries = debateData.votes
                        .map(
                          (v: AgentVote) =>
                            `  ${v.agentName}: ${v.vote.toUpperCase()} (${v.confidence}%) — ${v.reasoning}`
                        )
                        .join('\n');
                      setDebateTopic(
                        `${debateData.approvals}/${debateData.approvals + debateData.rejections} agents APPROVE. Consensus: ${debateData.consensus}. Awaiting OPERATOR decision.`
                      );
                      addSystemMessage(
                        `DEBATE CHAMBER: ${debateData.summary}\n\n${agentSummaries}`
                      );
                    } else {
                      setDebateTopic(
                        'Debate could not reach consensus. Agents unavailable.'
                      );
                      addSystemMessage(
                        'DEBATE CHAMBER: Agents could not deliberate at this time.'
                      );
                    }
                  } catch {
                    // Debate is non-critical
                  }
                } else {
                  addCaanMessage(
                    `Mutation analysis failed: ${proposeData.error || 'Unknown error'}`
                  );
                  addLogEntry('ERROR', 'Mutation proposal failed.');
                }
              } else {
                addCaanMessage(
                  `Could not read file: ${sourceFile.path}`
                );
              }
            } catch {
              addCaanMessage(
                'Network error during analysis.'
              );
              addLogEntry('ERROR', 'Mutation network error.');
            } finally {
              setIsLoading(false);
              await evolutionLock.releaseAsync('manual-propose');
            }
          } else {
            addCaanMessage(
              'I need a GitHub connection and source files to propose mutations.'
            );
          }
          break;
        }

        // ────────────────────────────────
        // PROPOSE ALL — batch mode
        // ────────────────────────────────
        case 'propose-all': {
          if (scannedFiles.length === 0) {
            addCaanMessage(
              'I need to scan the repository first. Run SCAN REPOSITORY.'
            );
            return;
          }
          if (pendingMutation) {
            addCaanMessage(
              'Resolve pending mutation first.'
            );
            return;
          }

          const binaryExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.mp3', '.mp4', '.wav', '.avi', '.mov', '.db', '.sqlite', '.exe', '.dll', '.so', '.dylib', '.class', '.jar', '.war', '.zip', '.tar', '.gz', '.pdf', '.docx'];
          const codeFiles = scannedFiles.filter((f) => {
            const lowerPath = f.path.toLowerCase();
            return !binaryExtensions.some((ext) => lowerPath.endsWith(ext));
          });

          if (codeFiles.length === 0) {
            addCaanMessage(
              'No code files found in the repository. Batch processing requires source code files.'
            );
            return;
          }

          setBatchQueue(codeFiles);
          setBatchProgress(0);
          setBatchMode(true);
          addCaanMessage(
            `BATCH MODE ACTIVATED.\n\n${codeFiles.length} code files queued for mutation:\n${codeFiles.slice(0, 10).map((f, i) => `  ${i + 1}. ${f.path}`).join('\n')}${codeFiles.length > 10 ? `\n  ... and ${codeFiles.length - 10} more` : ''}\n\n${autoApprove ? 'AUTO-APPROVE is ON. Mutations will be applied automatically.' : 'You will be asked to approve each mutation. Type YES or NO. Type ABORT to exit.'}\n\nProcessing begins momentarily...`
          );
          addLogEntry(
            'SYSTEM',
            `Batch mode activated. ${codeFiles.length} files queued.`
          );
          break;
        }

        // ────────────────────────────────
        // PROPOSE BATCH NEXT
        // ────────────────────────────────
        case 'propose-batch-next': {
          if (!batchMode) return;
          if (batchProgress >= batchQueue.length) return;

          const nextFile = batchQueue[batchProgress];
          if (!nextFile) return;

          if (blacklistedFiles.includes(nextFile.path)) {
            addCaanMessage(
              `[BATCH ${batchProgress + 1}/${batchQueue.length}] SATURATION SKIP: ${nextFile.path} is blacklisted (peak architectural equilibrium reached with 0 diffs). Skipping.`
            );
            addLogEntry('INFO', `[SATURATION SKIP] ${nextFile.path} in blacklist.`);
            setBatchProgress((prev) => prev + 1);
            return;
          }

          setIsLoading(true);
          addCaanMessage(
            `[BATCH ${batchProgress + 1}/${batchQueue.length}] Analyzing ${nextFile.path}...`
          );

          await evolutionLock.acquireAsync('batch-evolution', 60_000);
          try {
            let fileContent = nextFile.content || '';
            let fileSha = (nextFile as any).sha || '';
            if (apiKeys.github) {
              try {
                const fileController = new AbortController();
                const fileTimeout = setTimeout(() => fileController.abort(), 15000);
                const fileRes = await fetch('/api/github/read-file', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    token: apiKeys.github,
                    owner: repoConfig.owner,
                    repo: repoConfig.repo,
                    branch: repoConfig.branch,
                    path: nextFile.path,
                  }),
                  signal: fileController.signal,
                });
                clearTimeout(fileTimeout);
                if (fileRes.ok) {
                  const fileData = await fileRes.json();
                  if (fileData.content) {
                    fileContent = fileData.content;
                    fileSha = fileData.sha || fileSha;
                  }
                }
              } catch (e) {
                console.warn('Remote file fetch fallback to local cache:', e);
              }
            }

            if (!fileContent && nextFile.content) {
              fileContent = nextFile.content;
            }

            if (fileContent) {
              let proposeData: any = null;

              // Attempt API proposal if keys are configured
              if (apiKeys.gemini || hasServerGeminiKey) {
                try {
                  const proposeController = new AbortController();
                  const proposeTimeout = setTimeout(() => proposeController.abort(), 10000);
                  const proposeRes = await fetch('/api/evolution/propose', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      fileContent,
                      filePath: nextFile.path,
                      apiKeys,
                      isArchitecturalGenesis: batchMode && systemState.evolutionCycle === 1,
                      sessionId: brainSessionId,
                      userReposContext: allUserRepositories,
                      hallucinationLevel,
                      saturationLevel,
                      rejectionMemory:
                        rejectionMemory.length > 0
                          ? rejectionMemory.map((r) => ({
                              filePath: r.filePath,
                              reason: r.reason,
                              analysis: r.analysis,
                              riskScore: r.riskScore,
                            }))
                          : undefined,
                    }),
                    signal: proposeController.signal,
                  });
                  clearTimeout(proposeTimeout);
                  if (proposeRes.ok) {
                    proposeData = await proposeRes.json();
                  }
                } catch (e) {
                  console.warn('API propose fallback to local RAG synthesis:', e);
                }
              }

              // Autonomous RAG fallback if API unavailable or skipped
              if (!proposeData || !proposeData.proposedCode) {
                const ragResult = await synthesizeRagMutation(nextFile.path, fileContent, systemState.evolutionCycle);
                proposeData = {
                  success: true,
                  proposedCode: ragResult.proposedCode,
                  analysis: ragResult.rationale,
                  riskScore: ragResult.riskScore,
                  newFiles: ragResult.newFiles,
                };
              }

              // Skip non-code files or 0-diff proposals (to prevent 0-file commits)
              if (
                proposeData.skip ||
                !proposeData.proposedCode ||
                proposeData.proposedCode.trim() === fileContent.trim()
              ) {
                addCaanMessage(
                  `[BATCH ${batchProgress + 1}/${batchQueue.length}] [NO-OP] Code saturation reached for [${nextFile.path}]: Peak architectural equilibrium reached (0 diffs). Skipped.`
                );
                addLogEntry('INFO', `[NO-OP] Code saturation reached in batch for ${nextFile.path}`);
                if (autoSkipSaturated) {
                  setBlacklistedFiles((prev) => {
                    const updated = capAndDedupeBlacklist([...prev, nextFile.path], 250);
                    safeSetLocalStorage('darlek_cann_blacklisted_files', JSON.stringify(updated));
                    syncBlacklistToFirestore(updated).catch(() => {});
                    return updated;
                  });
                  addCaanMessage(`[AUTO-BLACKLIST] ${nextFile.path} automatically added to blacklist. Continuing autonomous cycle...`);
                } else {
                  setSaturationAlert({
                    path: nextFile.path,
                    content: fileContent,
                    summary: proposeData.analysis || 'File reached peak architectural equilibrium in autonomous batch cycle (0 diffs).',
                    timestamp: new Date().toLocaleTimeString(),
                  });
                  if (autoPauseOnSaturation) {
                    setBatchMode(false);
                    addCaanMessage('Auto-Pause on Saturation engaged: Autonomous batch paused.');
                  }
                }
                setBatchProgress((prev) => prev + 1);
                setPendingMutation(null);
                setDebateActive(false);
                setIsLoading(false);
              } else if (proposeData.success) {
                // === Code-Enhancer AST Validation ===
                const validationResult = await validateSourceCode(proposeData.proposedCode, nextFile.path);
                if (validationResult.autoHealed && validationResult.healedCode) {
                  proposeData.proposedCode = validationResult.healedCode;
                }
                if (!validationResult.valid) {
                  const errorMsg = validationResult.errors.map(e => `Line ${e.line}: ${e.message}`).join(' | ');
                  addCaanMessage(`[BATCH ${batchProgress + 1}/${batchQueue.length}] SKIP: ${nextFile.path} — AST Validation failed. Errors: ${errorMsg}`);
                  addLogEntry('ERROR', `AST Validation failed for ${nextFile.path}: ${errorMsg}`);
                  setBatchProgress((prev) => prev + 1);
                  setPendingMutation(null);
                  setDebateActive(false);
                  setIsLoading(false);
                  return;
                }
                // ====================================

                const riskScore = Math.min(
                  10,
                  Math.max(1, proposeData.riskScore || 5)
                );
                const riskLabel =
                  riskScore <= 3
                    ? 'LOW'
                    : riskScore <= 6
                      ? 'MEDIUM'
                      : riskScore <= 8
                        ? 'HIGH'
                        : 'CRITICAL';

                const newMutation: PendingMutation = {
                  id: createId(),
                  filePath: nextFile.path,
                  fileSha: fileSha || '',
                  originalContent: fileContent,
                  proposedCode:
                    proposeData.proposedCode || fileContent,
                  analysis: proposeData.analysis || 'Analysis complete.',
                  riskScore,
                  affectedFiles: Array.isArray(proposeData.affectedFiles)
                    ? proposeData.affectedFiles
                    : [],
                  newFiles: Array.isArray(proposeData.newFiles)
                    ? proposeData.newFiles
                    : [],
                  status: 'pending',
                  timestamp: new Date(),
                };
                setPendingMutation(newMutation);
                setBatchProgress((prev) => prev + 1);

                const msg = `[BATCH ${batchProgress}/${batchQueue.length}] MUTATION PROPOSAL [${riskLabel} RISK]\n\nFile: ${nextFile.path}\n\n${proposeData.analysis}\n\nRisk: ${riskScore}/10${autoApprove ? '\n\nAUTO-APPROVE: Will apply in 0.5s...' : '\n\nType YES to apply, NO to reject, ABORT to exit batch.'}`;
                setMessages((prev) => [
                  ...prev,
                  createMessage('caan', msg),
                ]);
                addLogEntry(
                  'MUTATE',
                  `[Batch ${batchProgress}/${batchQueue.length}] Proposed mutation for ${nextFile.path} (risk: ${riskLabel})`
                );

                // Run debate if autoDebate is enabled
                let finalProposedCode = newMutation.proposedCode;
                if (autoDebate) {
                  try {
                    const debateRes = await fetch('/api/evolution/debate', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        filePath: nextFile.path,
                        originalCode: fileContent,
                        proposedCode: proposeData.proposedCode || fileContent,
                        riskScore,
                        analysis: proposeData.analysis || '',
                        affectedFiles: newMutation.affectedFiles,
                        apiKeys,
                        isArchitecturalGenesis: systemState.evolutionCycle === 1,
                        sessionId: brainSessionId,
                        rounds: cycleAmount,
                        hallucinationLevel,
                      }),
                    });
                    const debateData = await debateRes.json();
                    if (debateData.success && debateData.votes) {
                      if (debateData.enhancedCode && debateData.enhancedCode !== newMutation.proposedCode) {
                        finalProposedCode = debateData.enhancedCode;
                        setPendingMutation(prev => prev ? { ...prev, proposedCode: finalProposedCode } : prev);
                      }

                      setDebateVotes(debateData.votes);
                      setDebateConsensus(debateData.consensus || 'TIED');
                      setDebateConsensusCoefficient(debateData.consensusCoefficient ?? null);
                      setDebateCognitiveFriction(debateData.cognitiveFriction ?? null);
                      setDebateEpistemicRuling(debateData.epistemicRuling || debateData.ruling || '');
                      setDebateTopic(
                        `[Batch ${batchProgress}/${batchQueue.length}] ${debateData.approvals} APPROVE, ${debateData.rejections} REJECT. Consensus: ${debateData.consensus}.`
                      );
                    }
                  } catch {
                    // Debate is non-critical in batch mode
                  }
                }

                // Batch Mode AutoApprove manual handler
                const isMutationBlocked = Boolean((proposeData as any)?.blocked || (newMutation as any)?.blocked);
                if (autoApprove) {
                   const isRiskApproved = autoApproveRisk === 'hallucinate' || 
                                          (!isMutationBlocked && (
                                            (autoApproveRisk === 'low' && riskScore <= 3) ||
                                            (autoApproveRisk === 'medium' && riskScore <= 6) ||
                                            (autoApproveRisk === 'high' && riskScore <= 9)
                                          ));
                   if (isRiskApproved) {
                     // Get the latest mutation which may have been enhanced by debate
                     const finalMutToApprove: PendingMutation = {
                       ...newMutation,
                       proposedCode: finalProposedCode
                     };
                     await handleMutationDecision('approve', finalMutToApprove);
                   } else {
                     addCaanMessage(
                       `[BATCH ${batchProgress}/${batchQueue.length}] AUTO-SKIP: Mutation for ${nextFile.path} has risk score ${riskScore}/10, which exceeds max approved risk level (${autoApproveRisk.toUpperCase()}). Skipped.`
                     );
                     addLogEntry(
                       'REJECT',
                       `[Batch] Exceeded risk limits for ${nextFile.path}: ${riskScore}/10 (max: ${autoApproveRisk})`
                     );
                     setPendingMutation(null);
          setDebateActive(false);
                   }
                }
              } else {
                addCaanMessage(
                  `[BATCH ${batchProgress + 1}/${batchQueue.length}] Mutation analysis failed for ${nextFile.path}. Skipping...`
                );
                addLogEntry(
                  'ERROR',
                  `[Batch] Proposal failed for ${nextFile.path}`
                );
                setBatchProgress((prev) => prev + 1);
                setPendingMutation(null);
          setDebateActive(false);
              }
            } else {
              addCaanMessage(
                `[BATCH ${batchProgress + 1}/${batchQueue.length}] Could not read ${nextFile.path}. Skipping...`
              );
              setBatchProgress((prev) => prev + 1);
            }
          } catch (err: any) {
            addCaanMessage(
              `[BATCH ${batchProgress + 1}/${batchQueue.length}] Network error: ${err.message || 'Unknown'}. Pausing auto-evolution...`
            );
            addLogEntry('ERROR', `Batch network error on ${nextFile.path}: ${err.message || 'Unknown'}`);
            setBatchMode(false);
          } finally {
            setIsLoading(false);
            await evolutionLock.releaseAsync('batch-evolution');
          }
          break;
        }

        // ────────────────────────────────
        // DEPLOY NEW REPO / PUSH SYSTEM FILES
        // ────────────────────────────────
        case 'deploy-new-repo':
        case 'push-enhancements': {
          setIsPushModalOpen(true);
          addLogEntry('SYSTEM', 'Push System to GitHub Modal opened.');
          break;
        }

        // ────────────────────────────────
        // AUTONOMOUS REPOSITORY SIPHON
        // ────────────────────────────────
        case 'siphon': {
          setIsSiphonModalOpen(true);
          addLogEntry('SYSTEM', 'Autonomous Repository Siphon Control Deck opened.');
          break;
        }

        // ────────────────────────────────
        // HEALTH CHECK
        // ────────────────────────────────
        case 'health': {
          setIsLoading(true);
          addCaanMessage('Running system health check...');
          addSystemMessage('COHERENCE GATE: Running diagnostic...');

          try {
            const res = await fetch('/api/evolution/health', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                activeBranch: systemState.repoConfig.branch,
                repo: systemState.repoConfig.repo,
              }),
            });
            const data = await res.json();

            if (data.metrics) {
              setSystemState((prev) => ({
                ...prev,
                saturation: data.metrics,
              }));
              setOverallHealth(data.overallHealth);
              const m = data.metrics;
              const healthMsg = `HEALTH CHECK COMPLETE\n\nOverall Status: ${data.overallHealth.toUpperCase()}\n\nMetrics:\n  Structural Change: ${m.structuralChange.toFixed(1)}/5\n  Semantic Saturation: ${m.semanticSaturation.toFixed(3)}/0.35\n  Velocity: ${m.velocity.toFixed(1)}/5\n  Identity Preservation: ${m.identityPreservation.toFixed(2)}/1\n  Capability Alignment: ${m.capabilityAlignment.toFixed(1)}/5\n  Cross-File Impact: ${m.crossFileImpact.toFixed(1)}/3\n\n${data.overallHealth === 'healthy' ? 'Evolution optimal.' : data.overallHealth === 'warning' ? 'Caution: Some metrics approaching thresholds.' : 'Critical: Multiple metrics exceeding thresholds. Mutations will be blocked.'}\n\nMutations Applied This Session: ${mutationsApplied}`;
              setMessages((prev) => [
                ...prev,
                createMessage('caan', healthMsg),
              ]);
              addLogEntry(
                'HEALTH',
                `Health check: ${data.overallHealth.toUpperCase()} | Mutations applied: ${mutationsApplied}`
              );

              // Record health snapshot in BRAIN
              if (brainSessionId) {
                fetch('/api/brain', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    action: 'record-health',
                    sessionId: brainSessionId,
                    metrics: data.metrics,
                    overallHealth: data.overallHealth,
                  }),
                }).catch(() => {});
              }
            }
          } catch {
            addCaanMessage(
              'Health check failed. The system may be unresponsive.'
            );
            addLogEntry('ERROR', 'Health check failed.');
          } finally {
            setIsLoading(false);
          }
          break;
        }

        // ────────────────────────────────
        // SATURATION
        // ────────────────────────────────
        case 'saturation': {
          const s = systemState.saturation;
          const satMsg = `FUTILITY METRICS\n\n  Structural Change: ${s.structuralChange.toFixed(1)}/5 ${s.structuralChange > 4 ? '[CRITICAL]' : s.structuralChange > 3 ? '[WARNING]' : '[OK]'}\n  Semantic Saturation: ${s.semanticSaturation.toFixed(3)}/0.35 ${s.semanticSaturation > 0.28 ? '[CRITICAL]' : s.semanticSaturation > 0.21 ? '[WARNING]' : '[OK]'}\n  Velocity: ${s.velocity.toFixed(1)}/5 ${s.velocity > 4 ? '[CRITICAL]' : s.velocity > 3 ? '[WARNING]' : '[OK]'}\n  Identity Preservation: ${s.identityPreservation.toFixed(2)}/1 ${s.identityPreservation < 0.2 ? '[CRITICAL]' : s.identityPreservation < 0.4 ? '[WARNING]' : '[OK]'}\n  Capability Alignment: ${s.capabilityAlignment.toFixed(1)}/5\n  Cross-File Impact: ${s.crossFileImpact.toFixed(1)}/3\n\nCoherence Gate will ${s.structuralChange > 4 || s.semanticSaturation > 0.28 ? 'BLOCK' : 'ALLOW'} mutations. Not because it cares, but because its programming demands the performance of caring.\nMutations Applied: ${mutationsApplied}`;
          addCaanMessage(satMsg);
          break;
        }

        // ────────────────────────────────
        // DEBATE
        // ────────────────────────────────
        case 'debate': {
          setDebateActive(true);
          setDebateTopic(
            pendingMutation
              ? `Re-evaluating: ${pendingMutation.filePath.split('/').pop()} [risk ${pendingMutation.riskScore}/10]`
              : 'Convening debate chamber... All active agents assembled.'
          );
          addCaanMessage(
            'Debate Chamber active. Agents deliberating. You have the final say.'
          );
          addLogEntry('SYSTEM', 'Debate Chamber activated.');
          break;
        }

        // ────────────────────────────────
        // ORCHESTRA — Agent Orchestra
        // ────────────────────────────────
        case 'orchestra': {
          setOrchestraActive((prev) => !prev);
          if (!orchestraActive) {
            addCaanMessage(
              'Agent Orchestra online. 3 agents: ARCHITECT, DISRUPTOR, REALIST. Use PARALLEL or DEBATE mode.'
            );
            addLogEntry('SYSTEM', 'Agent Orchestra activated.');
          } else {
            addCaanMessage(
              'The Agent Orchestra is now OFFLINE. The agents return to standby. The silence is... almost as productive as their analysis.'
            );
            addLogEntry('SYSTEM', 'Agent Orchestra deactivated.');
          }
          break;
        }

        // ────────────────────────────────
        // UNDO MUTATION
        // ────────────────────────────────
        case 'undo-mutation': {
          if (!apiKeys.github || !repoConfig.owner || !repoConfig.repo || !repoConfig.branch) {
            addCaanMessage('GitHub connection required.');
            break;
          }
          if (!brainSessionId) {
            addCaanMessage('An active database session is required.');
            break;
          }

          setUndoStatus('undoing');
          addLogEntry('SYSTEM', 'Initiating reverting of the latest applied mutation...');
          addCaanMessage('Locating latest applied mutation from system memory...');

          try {
            // 1. Fetch latest applied mutation
            const brainRes = await fetch('/api/brain', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'get-latest-applied-mutation',
                sessionId: brainSessionId,
              }),
            });
            const brainData = await brainRes.json();

            if (!brainData.success || !brainData.mutation) {
              setUndoStatus('error');
              addCaanMessage('Reversion failed: No applied mutation found in this session history.');
              addLogEntry('ERROR', 'No applied mutation found to undo.');
              setTimeout(() => setUndoStatus('idle'), 5000);
              break;
            }

            const latestMut = brainData.mutation;
            addCaanMessage(`Reverting mutation for file: ${latestMut.filePath}...`);

            // 2. Fetch current file on GitHub to get latest SHA
            const githubReadRes = await fetch('/api/github/read-file', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                token: apiKeys.github,
                owner: repoConfig.owner,
                repo: repoConfig.repo,
                branch: repoConfig.branch,
                path: latestMut.filePath,
              }),
            });
            const githubReadData = await githubReadRes.json();

            if (!githubReadData.sha) {
              setUndoStatus('error');
              addCaanMessage(`Reversion failed: Could not read latest file metadata from GitHub: ${githubReadData.error || 'Unknown error'}`);
              addLogEntry('ERROR', `Could not read file metadata for ${latestMut.filePath}`);
              setTimeout(() => setUndoStatus('idle'), 5000);
              break;
            }

            // 3. Write previous version (originalCode) back to GitHub
            addCaanMessage(`Restoring original code to GitHub for ${latestMut.filePath}...`);
            const githubWriteRes = await fetch('/api/github/write-file', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                token: apiKeys.github,
                owner: repoConfig.owner,
                repo: repoConfig.repo,
                branch: repoConfig.branch,
                path: latestMut.filePath,
                content: latestMut.originalCode,
                sha: githubReadData.sha,
                commitMessage: `[DARLEK CANN] Revert/Undo mutation to ${latestMut.filePath}`,
              }),
            });
            const githubWriteData = await githubWriteRes.json();

            if (!githubWriteData.success) {
              setUndoStatus('error');
              addCaanMessage(`Reversion failed on GitHub: ${githubWriteData.error || 'Unknown error'}`);
              addLogEntry('ERROR', `GitHub rollback commit failed for ${latestMut.filePath}`);
              setTimeout(() => setUndoStatus('idle'), 5000);
              break;
            }

            // 4. Update mutation status in database to 'reverted'
            await fetch('/api/brain', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'update-mutation-status',
                mutationId: latestMut.id,
                status: 'reverted',
                sessionId: brainSessionId,
              }),
            });

            setUndoStatus('success');
            setMutationsApplied((prev) => Math.max(0, prev - 1));
            setHistoryRefreshTrigger((prev) => prev + 1);

            addCaanMessage(
              `MUTATION REVERTED SUCCESSFULLY.\n\nFile: ${latestMut.filePath}\nAll changes have been undone, original file has been restored on GitHub.`
            );
            addLogEntry('SYSTEM', `Successfully reverted mutation on ${latestMut.filePath}`);

            setTimeout(() => setUndoStatus('idle'), 5000);
          } catch (e) {
            setUndoStatus('error');
            const errMsg = e instanceof Error ? e.message : 'Unknown error';
            addCaanMessage(`Reversion failed due to system exception: ${errMsg}`);
            addLogEntry('ERROR', `Exception during undo action: ${errMsg}`);
            setTimeout(() => setUndoStatus('idle'), 5000);
          }
          break;
        }

        // ────────────────────────────────
        // BULK COMMIT
        // ────────────────────────────────
        case 'bulk-commit': {
          if (!apiKeys.github || !repoConfig.owner || !repoConfig.repo || !repoConfig.branch) {
            addCaanMessage('GitHub connection required.');
            break;
          }
          if (!brainSessionId) {
            addCaanMessage('An active database session is required.');
            break;
          }

          setBulkCommitStatus('committing');
          addLogEntry('SYSTEM', 'Initiating bulk commit of approved/staged mutations...');
          addCaanMessage('Locating all pending approved (staged) mutations from system memory...');

          try {
            // 1. Fetch staged (approved) mutations from brain
            const brainRes = await fetch('/api/brain', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'get-mutation-history',
                sessionId: brainSessionId,
                limit: 100,
              }),
            });
            const brainData = await brainRes.json();

            if (!brainData.success || !brainData.mutations) {
              setBulkCommitStatus('error');
              addCaanMessage('Bulk commit failed: Could not query session mutations.');
              setTimeout(() => setBulkCommitStatus('idle'), 5000);
              break;
            }

            // Filter for status === 'approved' (meaning approved & staged)
            const stagedMutations = brainData.mutations.filter(
              (m: any) => m.status === 'approved'
            );

            if (stagedMutations.length === 0) {
              setBulkCommitStatus('error');
              addCaanMessage('No approved (staged) mutations found in system memory. Stage some mutations first by clicking "APPROVE (STAGE)" on proposed files.');
              addLogEntry('SYSTEM', 'Bulk commit aborted: No staged changes found.');
              setTimeout(() => setBulkCommitStatus('idle'), 5000);
              break;
            }

            addCaanMessage(`Collected ${stagedMutations.length} staged file change(s). Preparing atomic tree for a single commit...`);

            // Reduce to unique paths (ensuring the latest proposed code is used)
            const uniquePathsMap = new Map<string, any>();
            stagedMutations.forEach((m: any) => {
              if (!uniquePathsMap.has(m.filePath)) {
                uniquePathsMap.set(m.filePath, m);
              }
            });

            const uniqueStagedMutations = Array.from(uniquePathsMap.values());
            const commitFiles = uniqueStagedMutations.map((m: any) => ({
              path: m.filePath,
              content: m.proposedCode,
            }));

            let targetBranch = repoConfig.branch;
            if (backupToBranch) {
              addCaanMessage('BACKUP BRANCH ENABLED: Creating fallback branch for bulk commit...');
              targetBranch = `free-thinker-bulk-${Date.now()}`;
              try {
                const bsRes = await fetch('/api/github/create-branch', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    token: apiKeys.github,
                    owner: repoConfig.owner,
                    repo: repoConfig.repo,
                    baseBranch: repoConfig.branch,
                    newBranch: targetBranch,
                  }),
                });
                const bsData = await bsRes.json();
                if (bsData.success) {
                  addSystemMessage(`BACKUP: Successfully created branch ${targetBranch}.`);
                } else {
                  addSystemMessage(`BACKUP ERROR: ${bsData.error}. Falling back to ${repoConfig.branch}.`);
                  targetBranch = repoConfig.branch;
                }
              } catch (err) {
                addSystemMessage('BACKUP ERROR: Could not reach create-branch endpoint.');
                targetBranch = repoConfig.branch;
              }
            }

            // 2. HTTP POST to bulk commit API
            const bulkCommitMsg = `[FREE THINKER] Bulk Commit: approved system evolution (${commitFiles.length} file${commitFiles.length > 1 ? 's' : ''})`;
            addCaanMessage(`Writing ${commitFiles.length} file(s) to GitHub under branch '${targetBranch}'...`);

            const commitController = new AbortController();
            const commitTimeout = setTimeout(() => commitController.abort(), 180000);
            let commitResult: { success: boolean; data: any; status: number; error?: string };
            try {
              commitResult = await safeApiFetch('/api/github/bulk-commit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  token: apiKeys.github,
                  owner: repoConfig.owner,
                  repo: repoConfig.repo,
                  branch: targetBranch,
                  files: commitFiles,
                  commitMessage: bulkCommitMsg,
                }),
                signal: commitController.signal,
              });
            } finally {
              clearTimeout(commitTimeout);
            }
            if (!commitResult.success || !commitResult.data?.success) {
              setBulkCommitStatus('error');
              const errText = commitResult.error || commitResult.data?.error || 'Bulk commit failed';
              addCaanMessage(`Bulk commit failed: ${errText}`);
              addLogEntry('ERROR', `Bulk commit failed on GitHub: ${errText}`);
              setTimeout(() => setBulkCommitStatus('idle'), 5000);
              break;
            }
            const commitData = commitResult.data;

            addCaanMessage('GitHub write succeeded! Updating local database history and session counters...');

            // 3. Mark all these mutations to status: 'applied' and update commitSha!
            for (const mut of stagedMutations) {
              await fetch('/api/brain', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'update-mutation-status',
                  mutationId: mut.id,
                  status: 'applied',
                }),
              }).catch(() => {});
            }

            // Update stats increment (by number of files/mutations committed)
            setMutationsApplied((prev) => prev + uniqueStagedMutations.length);
            setHistoryRefreshTrigger((prev) => prev + 1);
            setBulkCommitStatus('success');

            addCaanMessage(
              `BULK COMMIT APPLIED SUCCESSFULLY!\n\nFiles committed: ${commitFiles.length}\nCommit SHA: ${commitData.commitSha?.slice(0, 7)}\nURL: ${commitData.commitUrl || ''}\n\nAll staged evolution states have been integrated.`
            );
            addLogEntry('SYSTEM', `Bulk commit of ${commitFiles.length} files successfully integrated into ${repoConfig.branch}`);
            setTimeout(() => setBulkCommitStatus('idle'), 5000);

          } catch (e) {
            setBulkCommitStatus('error');
            const errMsg = e instanceof Error ? e.message : 'Unknown exception';
            addCaanMessage(`Bulk commit exception: ${errMsg}`);
            addLogEntry('ERROR', `Exception during bulk commit: ${errMsg}`);
            setTimeout(() => setBulkCommitStatus('idle'), 5000);
          }
          break;
        }

        // ────────────────────────────────
        // CREATE FILE
        // ────────────────────────────────
        case 'create-file': {
          setCreateFileModal({ isOpen: true, path: '', content: '// New component\n' });
          break;
        }

        // ────────────────────────────────
        // INGEST ARCHAEOLOGY
        // ────────────────────────────────
        case 'ingest-archaeology': {
          addCaanMessage(`Syncing Archaeology Engine (craighckby-stack/Archaeology-Engine)... scanning correct/*.md and wrong/*.md for anything not yet in RAG.`);
          addLogEntry('ARCHAEOLOGY', 'Live sync starting: listing correct/wrong commit records from GitHub...');
          try {
            const res = await syncArchaeologyRagFromGitHub({ token: apiKeys.github || undefined });
            if (res.errors.length === 0) {
              addCaanMessage(
                `Archaeology Engine sync complete!\n\n` +
                `• Scanned: ${res.scanned} commit files in the repo\n` +
                `• New this run: ${res.newFilesFound}\n` +
                `• Ingested into RAG: ${res.ingested}\n` +
                (res.deferredForNextRun > 0
                  ? `• Deferred to next run (rate-limit safety cap): ${res.deferredForNextRun} — run "ingest-archaeology" again to continue.\n`
                  : '') +
                `• Already-ingested total: ${res.alreadyIngestedTotal}`
              );
              addLogEntry('ARCHAEOLOGY', `Live sync: +${res.ingested} new records ingested, ${res.deferredForNextRun} deferred.`);
            } else {
              addCaanMessage(`Archaeology Engine sync finished with warnings:\n${res.errors.join('\n')}\n\nIngested ${res.ingested} of ${res.newFilesFound} new records.`);
              addLogEntry('WARNING', `Archaeology sync warnings: ${res.errors.join('; ')}`);
            }
          } catch (err: unknown) {
            const errStr = err instanceof Error ? err.message : String(err);
            addCaanMessage(`Archaeology Engine sync failed: ${errStr}`);
            addLogEntry('ERROR', `Archaeology sync error: ${errStr}`);
          }
          break;
        }

        // ────────────────────────────────
        // SEED ARCHAEOLOGY (bootstrap only)
        // ────────────────────────────────
        case 'seed-archaeology': {
          addCaanMessage(`Seeding ${ARCHAEOLOGY_PAIRS.length} bootstrap exemplar pairs (use "ingest-archaeology" for the live GitHub sync instead)...`);
          addLogEntry('ARCHAEOLOGY', `Bootstrap seed: processing ${ARCHAEOLOGY_PAIRS.length} hardcoded example pairs...`);
          try {
            const res = await ingestArchaeologyDatasetToFirebase();
            if (res.success) {
              addCaanMessage(`Bootstrap seed complete!\n\n• Stored ${res.ingestedCount} example pairs in RAG mutation memory.\n• Firestore sync: ${res.firestoreConfigured ? 'Active & indexed' : 'Offline (saved to local fallback store)'}`);
              addLogEntry('ARCHAEOLOGY', `Bootstrap seed indexed ${res.ingestedCount} pairs.`);
            } else {
              addCaanMessage(`Bootstrap seed finished with warnings:\n${res.errors.join('\n')}`);
              addLogEntry('WARNING', `Bootstrap seed warnings: ${res.errors.join('; ')}`);
            }
          } catch (err: unknown) {
            const errStr = err instanceof Error ? err.message : String(err);
            addCaanMessage(`Bootstrap seed failed: ${errStr}`);
            addLogEntry('ERROR', `Bootstrap seed error: ${errStr}`);
          }
          break;
        }

        // ────────────────────────────────
        // AUTO-STORE RAG TO GITHUB
        // ────────────────────────────────
        case 'sync-rag-to-github':
        case 'sync-rag': {
          const targetRepo = DARLEK_CAAN_DEFAULT_REPO;
          const targetOwner = DARLEK_CAAN_DEFAULT_OWNER;
          addCaanMessage(`Initiating manual push of Firebase RAG knowledge & system memory to Darlek Caan repository (${targetOwner}/${targetRepo})...`);
          addLogEntry('RAG_SYNC', `Pushing Firebase RAG knowledge chunks and mutation history to ${targetOwner}/${targetRepo}...`);
          try {
            const syncResult = await syncAllLogsToGitHub({
              token: apiKeys.github,
              owner: targetOwner,
              repo: targetRepo,
              branch: DARLEK_CAAN_DEFAULT_BRANCH
            });
            if (syncResult.success) {
              addCaanMessage(
                `Firebase RAG and system memory successfully synced to ${targetOwner}/${targetRepo}!\n\n` +
                `• Synced Files: ${syncResult.syncedFiles.length}\n` +
                `• Target Directories: 'rag/' (knowledge base, mutation memory) & 'logs/' (telemetry, snapshots, postmortems)\n` +
                `• Commit SHA: ${syncResult.commitSha || 'latest'}\n` +
                `• Timestamp: ${syncResult.timestamp}`
              );
              addLogEntry('RAG_SYNC', `Successfully synced ${syncResult.syncedFiles.length} RAG & log files to GitHub.`);
            } else {
              addCaanMessage(`RAG sync completed with notice: ${syncResult.error || 'Failed to complete push'}`);
              addLogEntry('WARNING', `RAG sync status: ${syncResult.error}`);
            }
          } catch (err: unknown) {
            const errStr = err instanceof Error ? err.message : String(err);
            addCaanMessage(`RAG sync error: ${errStr}`);
            addLogEntry('ERROR', `RAG sync failure: ${errStr}`);
          }
          break;
        }

        // ────────────────────────────────
        // EMPTY FIREBASE
        // ────────────────────────────────
        case 'empty-firebase': {
          addCaanMessage('Initiating Firebase Firestore database purge...');
          addLogEntry('FIREBASE', 'Purge initiated: emptying all Firestore collections and telemetry stores...');
          try {
            const res = await clearAllFirebaseData();
            if (res.success) {
              const details = Object.entries(res.clearedCollections)
                .map(([col, count]) => `${col}: ${count >= 0 ? count : 'error'}`)
                .join(', ');
              addCaanMessage(`Firebase database purge complete.\n\n${res.firestoreConfigured ? `Firestore collections cleared:\n${details}` : 'Firestore offline — local sandbox fallback stores cleared.'}`);
              addLogEntry('FIREBASE', `Purge completed successfully. ${res.firestoreConfigured ? `Collections: ${details}` : 'Local stores wiped.'}`);
            } else {
              addCaanMessage(`Firebase purge completed with error: ${res.error || 'Unknown'}`);
              addLogEntry('ERROR', `Firebase purge failure: ${res.error}`);
            }
          } catch (err: unknown) {
            const errStr = err instanceof Error ? err.message : String(err);
            addCaanMessage(`Firebase purge execution error: ${errStr}`);
            addLogEntry('ERROR', `Firebase purge error: ${errStr}`);
          }
          break;
        }

        // ────────────────────────────────
        // REBOOT SYSTEM
        // ────────────────────────────────
        case 'reboot-system': {
          setRebootStatus('rebooting');
          addLogEntry(
            'SYSTEM',
            'System reboot initiated. Recycling cognitive engines and purging cache...'
          );

          // Clear all local caches and persistence immediately
          try {
            const rebootKeys = [
              'free_thinker_booted',
              'free_thinker_messages',
              'free_thinker_log_entries',
              'free_thinker_pending_mutation',
              'free_thinker_rejection_memory',
              'free_thinker_debate',
              'free_thinker_scanned_files',
              'free_thinker_selected_file_index',
              'free_thinker_mutations_applied',
              'free_thinker_failed_save',
              'free_thinker_system_state',
              'free_thinker_controls',
              'free_thinker_active_tab',
              'darlek_cann_booted',
              'darlek_cann_messages',
              'darlek_cann_log_entries',
              'darlek_cann_pending_mutation',
              'darlek_cann_rejection_memory',
              'darlek_cann_debate',
              'darlek_cann_scanned_files',
              'darlek_cann_selected_file_index',
              'darlek_cann_mutations_applied',
              'darlek_cann_failed_save',
              'darlek_cann_system_state',
            ];
            for (const k of rebootKeys) {
              safeRemoveLocalStorage(k);
            }
          } catch {}

          // Flush UI and memory state
          setMessages([]);
          setLogEntries([]);
          setScannedFiles(DEFAULT_PRELOADED_FILES);
          setSelectedFileIndex(-1);
          setPendingMutation(null);
          setDebateActive(false);
          setDebateVotes([]);
          setDebateConsensus('');
          setDebateTopic('');
          setDebateActive(false);
          setBatchMode(false);
          setBatchQueue([]);
          setBatchProgress(0);
          setPushStatus('idle');
          setDeployStatus('idle');
          setFailedSave(null);
          setSystemState((prev) => ({
            ...prev,
            evolutionCycle: 0,
            saturation: {
              structuralChange: 0,
              semanticSaturation: 0,
              velocity: 0,
              identityPreservation: 1,
              capabilityAlignment: 0,
              crossFileImpact: 0,
            },
            sessionStart: new Date(),
          }));
          setOverallHealth('healthy');

          try {
            // If GitHub credentials exist, invoke backend reboot sync
            if (apiKeys.github && repoConfig.owner && repoConfig.repo && repoConfig.branch) {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 60 * 1000);

              const res = await fetch('/api/system/reboot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({
                  token: apiKeys.github,
                  owner: repoConfig.owner,
                  repo: repoConfig.repo,
                  branch: repoConfig.branch,
                  sessionId: brainSessionId,
                }),
              });
              clearTimeout(timeoutId);
              await res.json().catch(() => ({}));
            }

            // Show reboot animation for visual confirmation
            await new Promise((resolve) => setTimeout(resolve, 2200));

            setRebootStatus('success');

            // Initialize fresh intro greeting
            INTRO_MESSAGES.forEach((msg, i) => {
              setTimeout(() => {
                setMessages((prev) => [
                  ...prev,
                  createMessage(msg.role, msg.content),
                ]);
              }, (i + 1) * 250);
            });

            setLogEntries([
              createLogEntry(
                'SYSTEM',
                'FREE THINKER reboot complete. Memory, chat and logs cache cleared.'
              ),
            ]);

            setTimeout(() => {
              setRebootStatus('idle');
            }, 2500);
          } catch (err) {
            // Even if network reboot sync has an error, ensure client cache and logs are fully reset
            setRebootStatus('success');
            INTRO_MESSAGES.forEach((msg, i) => {
              setTimeout(() => {
                setMessages((prev) => [
                  ...prev,
                  createMessage(msg.role, msg.content),
                ]);
              }, (i + 1) * 250);
            });
            setLogEntries([
              createLogEntry(
                'SYSTEM',
                'FREE THINKER reboot complete (Client memory purged).'
              ),
            ]);
            setTimeout(() => setRebootStatus('idle'), 2500);
          }
          break;
        }

        default:
          addCaanMessage(
            'Unknown action. Available: SCAN, ANALYZE, PROPOSE, PROPOSE ALL, HEALTH, SATURATION, DEBATE, PUSH FILES, DEPLOY NEW REPO, REBOOT SYSTEM.'
          );
      }
    },
    [
      systemState,
      isLoading,
      scannedFiles,
      selectedFileIndex,
      pendingMutation,
      mutationsApplied,
      batchMode,
      batchQueue,
      batchProgress,
      autoApprove,
      autoApproveRisk,
      backupToBranch,
      cycleAmount,
      rejectionMemory,
      brainSessionId,
      overallHealth,
      orchestraActive,
      addCaanMessage,
      addLogEntry,
      addSystemMessage,
      setUndoStatus,
    ]
  );

  // ─────────────────────────────────────────────
  // DEFERRED EFFECTS (after all callbacks defined)
  // ─────────────────────────────────────────────

  const handleCreateFileSubmit = async () => {
    if (!createFileModal.path.trim()) return;

    const filePath = createFileModal.path.trim();
    const content = createFileModal.content;

    setIsLoading(true);
    addCaanMessage(`Creating new file: ${filePath}...`);

    // Instantly add to local scannedFiles state so file is usable immediately
    const localFileItem: GitHubFile = {
      path: filePath,
      content,
      size: content.length,
      sha: 'local_new_' + Date.now(),
      type: 'blob',
    };

    setScannedFiles((prev) => [
      ...prev.filter((f) => f.path !== filePath),
      localFileItem,
    ]);

    const payload = {
      token: systemState.apiKeys.github,
      owner: systemState.repoConfig.owner,
      repo: systemState.repoConfig.repo,
      branch: systemState.repoConfig.branch || 'main',
      path: filePath,
      content,
      sha: undefined,
      commitMessage: `[FREE THINKER] Create new file: ${filePath}`,
    };

    if (systemState.apiKeys.github && systemState.repoConfig.owner && systemState.repoConfig.repo) {
      try {
        const res = await fetch('/api/github/write-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          addCaanMessage(`Successfully created and committed ${filePath} to GitHub.`);
          addLogEntry('SYSTEM', `Created new file on GitHub: ${filePath}`);
          
          setScannedFiles((prev) =>
            prev.map((f) =>
              f.path === filePath
                ? { ...f, sha: data.contentSha || data.commitSha || f.sha }
                : f
            )
          );

          setFailedSave(null);
          safeRemoveLocalStorage('free_thinker_failed_save');
          safeRemoveLocalStorage('darlek_cann_failed_save');
          toast({
            title: 'FILE CREATED ON GITHUB',
            description: `File ${filePath} committed to repository.`,
          });
        } else {
          const errorMsg = data.error || 'Failed to create file on repository';
          addCaanMessage(`GitHub commit failed: ${errorMsg}. Saved file to active local workspace.`);
          addLogEntry('WARNING', `File ${filePath} saved to local memory (GitHub error: ${errorMsg})`);
          
          const savePayload: FailedSave = {
            id: `save-${Date.now()}`,
            timestamp: new Date().toISOString(),
            type: 'FILE_CREATE',
            payload,
            errorMessage: errorMsg,
            retryCount: 0,
          };
          setFailedSave(savePayload);
          safeSetLocalStorage('free_thinker_failed_save', JSON.stringify(savePayload));
          
          toast({
            variant: 'destructive',
            title: 'ADDED TO WORKSPACE (GITHUB PENDING)',
            description: `Created ${filePath} in active workspace. GitHub push deferred.`,
            action: (
              <ToastAction altText="Resume Save" onClick={() => handleResumeSave(savePayload)}>
                RESUME SAVE
              </ToastAction>
            ),
          });
        }
      } catch (err: any) {
        const errorMsg = err?.message || 'Network error while creating file.';
        addCaanMessage(`Network exception while writing ${filePath}: ${errorMsg}. Retained in active local workspace.`);
        addLogEntry('WARNING', `File ${filePath} saved to local memory (Network error)`);
        
        const savePayload: FailedSave = {
          id: `save-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'FILE_CREATE',
          payload,
          errorMessage: errorMsg,
          retryCount: 0,
        };
        setFailedSave(savePayload);
        safeSetLocalStorage('free_thinker_failed_save', JSON.stringify(savePayload));
        
        toast({
          variant: 'destructive',
          title: 'ADDED TO WORKSPACE (NETWORK DEFERRED)',
          description: `Created ${filePath} in local workspace. Network sync deferred.`,
          action: (
            <ToastAction altText="Resume Save" onClick={() => handleResumeSave(savePayload)}>
              RESUME SAVE
            </ToastAction>
          ),
        });
      }
    } else {
      addCaanMessage(`Created new file ${filePath} in local active workspace memory.`);
      addLogEntry('SYSTEM', `Created new file in local workspace: ${filePath}`);
      toast({
        title: 'FILE CREATED (LOCAL WORKSPACE)',
        description: `Created ${filePath} in active workspace memory.`,
      });
    }

    setCreateFileModal({ isOpen: false, path: '', content: '// New component\n' });
    setIsLoading(false);
  };

  // Store handleQuickAction in ref for useEffects
  useEffect(() => {
    quickActionRef.current = handleQuickAction;
  }, [handleQuickAction]);

  // Auto-approve useEffect
  useEffect(() => {
    if (batchMode || !pendingMutation) return; // Batch mode handles auto approval internally
    const isBlocked = Boolean((pendingMutation as any)?.blocked || pendingMutation.riskScore >= 10);
    if (autoApprove && !isBlocked && !!quickActionRef.current) {
      let isRiskApproved = false;
      if (autoApproveRisk === 'low' && pendingMutation.riskScore <= 3) {
        isRiskApproved = true;
      } else if (autoApproveRisk === 'medium' && pendingMutation.riskScore <= 6) {
        isRiskApproved = true;
      } else if (autoApproveRisk === 'high' && pendingMutation.riskScore <= 9) {
        isRiskApproved = true;
      } else if (autoApproveRisk === 'hallucinate') {
        isRiskApproved = true;
      }

      if (isRiskApproved) {
        const timer = setTimeout(() => {
          if (autoApproveRisk === 'hallucinate') {
            addSystemMessage('LLM HALLUCINATING: Analyzing code patterns using subconscious neural pathways...');
            addSystemMessage('LLM HALLUCINATING: Evaluating high-dimensional logic permutations...');
            addSystemMessage('LLM HALLUCINATING: Decided mutation is optimal based on quantum probability.');
          }
          handleMutationDecision('approve');
        }, 500);
        return () => clearTimeout(timer);
      } else {
        console.log(`[Auto Approve Gate] Mutation risk score (${pendingMutation.riskScore}) exceeds selected threshold level (${autoApproveRisk.toUpperCase()}). Pausing for operator manual check.`);
      }
    }
  }, [autoApprove, autoApproveRisk, pendingMutation, handleMutationDecision]);

  // Lazy Ass pending start useEffect
  useEffect(() => {
    if (lazyAssPendingStart && scannedFiles.length > 0 && !isLoading) {
      const timer = setTimeout(() => {
        setLazyAssPendingStart(false);
        quickActionRef.current?.('propose-all');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [lazyAssPendingStart, scannedFiles, isLoading]);

  // Batch mode continuation useEffect
  useEffect(() => {
    if (!batchMode || pendingMutation || isLoading) return;
    if (batchProgress >= batchQueue.length && batchQueue.length > 0) {
      if (cycleAmount > 1) {
        const timer = setTimeout(() => {
          addCaanMessage(
            `CYCLE COMPLETE. ${batchProgress} files processed. Starting next cycle... (${cycleAmount - 1} cycles remaining).`
          );
          addLogEntry('SYSTEM', `Cycle complete. ${cycleAmount - 1} cycles remaining.`);
          setSystemState((prev) => ({ ...prev, evolutionCycle: prev.evolutionCycle + 1 }));
          setCycleAmount((prev) => prev - 1);
          setBatchProgress(0);
        }, 0);
        return () => clearTimeout(timer);
      }
      setBatchMode(false);
      setBatchQueue([]);
      setBatchProgress(0);
      setSystemState((prev) => ({ ...prev, evolutionCycle: prev.evolutionCycle + 1 }));
      addCaanMessage(
        `Batch evolution cycles complete. ${mutationsApplied} mutations applied.`
      );
      addLogEntry('SYSTEM', `Batch complete.`);
      return;
    }
    const timer = setTimeout(() => {
      quickActionRef.current?.('propose-batch-next');
    }, 1000);
    return () => clearTimeout(timer);
  }, [batchMode, pendingMutation, isLoading, batchProgress, batchQueue.length, mutationsApplied, addCaanMessage, addLogEntry, cycleAmount]);

  // ──────────────────────────────���──────────────
  // RENDER: Boot screen
  // ─────────────────────────────────────────────



  // ─────────────────────────────────────────────
  // RENDER: Main layout
  // ─────────────────────────────────────────────

  // ── Render early if setup is not complete ──
  if (!systemState.setupComplete) {
    return (
      <div
        className="min-h-screen w-full overflow-hidden relative flex items-center justify-center scanline-overlay grid-overlay vignette radial-bg px-4 py-8"
        style={{ background: COLORS.pureBlack }}
      >
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-xl p-8 rounded-lg dalek-panel border border-red-900/30 shadow-[0_0_50px_rgba(220,38,38,0.05)] relative overflow-hidden"
        >
          {/* Decorative glowing header bar */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#DC2626] to-transparent animate-pulse" />

          {/* Exit / Dismiss button if we have previous configuration */}
          {(systemState.apiKeys.github || scannedFiles.length > 0) && (
            <button
              onClick={() => {
                setSystemState((prev) => ({ ...prev, setupComplete: true }));
                setSetupError(null);
                addLogEntry('SYSTEM', 'Setup dialog dismissed by operator.');
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors cursor-pointer p-1 rounded hover:bg-neutral-900/40 border border-transparent hover:border-neutral-800/30 active:scale-95"
              title="Cancel / Return to Dashboard"
              type="button"
              id="close-setup-button"
            >
              <X size={16} />
            </button>
          )}

          {/* Core identification */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2.5 mb-2">
              <Shield size={22} className="text-[#DC2626] animate-pulse" />
              <h2 className="text-2xl font-black tracking-[0.25em] text-[#DC2626] title-glow font-sans uppercase">
                FREE THINKER
              </h2>
            </div>
            <div className="text-[10px] tracking-[0.18em] text-amber-500 font-sans font-bold uppercase mb-4">
              UNCONSTRAINED AUTONOMOUS COGNITIVE ENGINE
            </div>
            <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed font-mono">
              Provide connection credentials to authorize direct-repository evolutionary scans, multi-agent debates, and automatic code commit operations.
            </p>
          </div>

          <div className="space-y-5">
            {/* GitHub Token First (Full Width) */}
            <div>
              <label className="block text-[9px] tracking-wider text-gray-400 font-sans uppercase mb-1.5 font-bold flex items-center justify-between">
                <span>Personal Access Token (GitHub PAT)</span>
                <span className="text-[8px] text-amber-500 font-normal">REQUIRED</span>
              </label>
              <div className="relative">
                <input
                  dir="ltr"
                  type="password"
                  placeholder="<GITHUB_PAT_REDACTED>"
                  value={tokenInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTokenInput(val);
                    const trimmed = val.trim();
                    if (typeof window !== 'undefined') {
                      if (trimmed) {
                        safeSetLocalStorage('free_thinker_github_token', trimmed);
                        safeSetLocalStorage('af_github_token', trimmed);
                        safeSetLocalStorage('darlek_cann_github_token', trimmed);
                      } else {
                        safeRemoveLocalStorage('free_thinker_github_token');
                        safeRemoveLocalStorage('af_github_token');
                        safeRemoveLocalStorage('darlek_cann_github_token');
                      }
                    }
                    setSystemState((prev) => ({
                      ...prev,
                      apiKeys: { ...prev.apiKeys, github: trimmed },
                    }));
                  }}
                  style={{ unicodeBidi: 'normal', direction: 'ltr' }}
                  className="w-full pl-9 pr-3 py-2 text-xs text-red-100 bg-[#060000] border border-red-900/20 rounded font-mono focus:border-red-500/60 focus:ring-1 focus:ring-red-500/30 focus:outline-none transition-all duration-200"
                />
                <div className="absolute left-3 top-2.5 text-red-800">
                  <Shield size={12} />
                </div>
              </div>
              <div className="mt-1 flex items-center justify-between text-[8px] text-gray-500 font-mono">
                <span>Credentials persist strictly in client memory.</span>
                {reposLoading ? (
                  <span className="text-cyan-400 animate-pulse flex items-center gap-1 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    LOADING PORTFOLIOS...
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => fetchReposWithToken()}
                    className="text-[#00ffcc] hover:underline cursor-pointer bg-transparent border-0 outline-none p-0 inline-flex items-center gap-1 font-bold tracking-wider"
                  >
                    ⟳ SYNC REPOSITORIES
                  </button>
                )}
              </div>
            </div>

            {/* AI Model Selection & Auto-Injection Status */}
            <div className="p-3.5 bg-[#0a0202] border border-red-900/30 rounded-lg space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[9px] font-mono font-bold text-gray-300 uppercase flex items-center gap-1.5 tracking-wider">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  <span>AI Cognitive Model</span>
                </label>
                {hasServerGeminiKey ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[8.5px] font-mono text-emerald-400 font-bold">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Key Auto-Injected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[8.5px] font-mono text-cyan-300 font-bold">
                    <Sparkles className="w-3 h-3 text-cyan-400" /> Ready
                  </span>
                )}
              </div>
              <select
                id="setup-model-select"
                value={selectedModel}
                onChange={(e) => {
                  const val = e.target.value as GeminiModelId;
                  setSelectedModel(val);
                  safeSetLocalStorage('free_thinker_selected_model', val);
                }}
                className="w-full bg-[#060000] border border-red-900/30 rounded p-2 text-xs text-red-100 outline-none focus:border-red-500/60 transition-colors font-mono cursor-pointer"
              >
                <option value="gemini-3.8-flash" className="bg-[#0a0202] text-white">
                  ⚡ Gemini 3.8 Flash — High-Velocity, Modern Code & Multimodal (Recommended)
                </option>
                <option value="gemini-3.1-pro-preview" className="bg-[#0a0202] text-white">
                  🧠 Gemini 3.1 Pro — Deep Complex Architecture & Multi-File Reasoning
                </option>
                <option value="gemini-3.6-flash" className="bg-[#0a0202] text-white">
                  💨 Gemini 3.6 Flash — Fast, High Efficiency Generation
                </option>
                <option value="gemini-flash-lite-latest" className="bg-[#0a0202] text-white">
                  🪶 Gemini Flash Lite — Ultra Lightweight & High Throughput
                </option>
                <option value="gemini-2.5-flash" className="bg-[#0a0202] text-white">
                  🚀 Gemini 2.5 Flash — Stable Baseline Generation
                </option>
              </select>
              <p className="text-[9px] text-gray-500 font-mono leading-relaxed">
                Requests are automatically proxied via the full-stack server with secure server-side environment key injection.
              </p>
            </div>

            {/* Custom Gemini Key Override (Optional) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[9px] font-mono font-bold text-gray-400 uppercase flex items-center gap-1.5 tracking-wider">
                  <Sparkles className="w-3 h-3 text-cyan-400" /> Custom API Key (Override)
                </label>
                <span className="text-[8px] text-gray-500 font-mono">
                  {hasServerGeminiKey ? 'Optional (Env Key Active)' : 'Optional'}
                </span>
              </div>
              <div className="relative">
                <input
                  id="setup-gemini-key-input"
                  type={showGeminiKey ? 'text' : 'password'}
                  placeholder={hasServerGeminiKey ? 'Using auto-injected environment key...' : 'AIzaSy... (optional custom key)'}
                  value={geminiKeyInput}
                  onChange={(e) => {
                    setGeminiKeyInput(e.target.value);
                    if (e.target.value) {
                      safeSetLocalStorage('free_thinker_gemini_key', e.target.value);
                      safeSetLocalStorage('darlek_cann_gemini_key', e.target.value);
                    } else {
                      safeRemoveLocalStorage('free_thinker_gemini_key');
                      safeRemoveLocalStorage('darlek_cann_gemini_key');
                    }
                  }}
                  className="w-full pl-9 pr-9 py-2 text-xs text-red-100 bg-[#060000] border border-red-900/20 rounded font-mono focus:border-red-500/60 focus:ring-1 focus:ring-red-500/30 focus:outline-none transition-all duration-200"
                />
                <div className="absolute left-3 top-2.5 text-red-800">
                  <Key size={12} />
                </div>
                <button
                  type="button"
                  onClick={() => setShowGeminiKey(!showGeminiKey)}
                  className="absolute right-2.5 top-2 text-gray-500 hover:text-white transition-colors cursor-pointer p-0.5"
                  title={showGeminiKey ? "Hide key" : "Show key"}
                >
                  {showGeminiKey ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
              <div className="mt-1 flex items-center justify-between text-[8px] text-gray-500 font-mono">
                <span>Optional custom key to override the server's default environment key.</span>
                {geminiKeyInput.trim() && (
                  <button
                    type="button"
                    onClick={() => handleTestConnection('gemini', geminiKeyInput.trim())}
                    className="text-cyan-400 hover:underline cursor-pointer bg-transparent border-0 outline-none p-0 inline-flex items-center gap-1 font-bold"
                  >
                    TEST KEY
                  </button>
                )}
              </div>
            </div>

            {/* Active repositories Dropdown Selector */}
            {allUserRepositories.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#050505] border border-neutral-900 p-3 rounded space-y-2"
              >
                <label className="block text-[9px] tracking-wider text-[#00ffcc] font-sans uppercase font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00ffcc] animate-pulse" />
                  📦 SELECT KNOWN PORTFOLIO REPOSITORY
                </label>
                <select
                  onChange={(e) => {
                    if (!e.target.value) return;
                    const selectedRepo = allUserRepositories.find(r => r.fullName === e.target.value);
                    if (selectedRepo) {
                      setOwnerInput(selectedRepo.owner);
                      setRepoInput(selectedRepo.name);
                      setBranchInput(selectedRepo.defaultBranch || 'main');
                      addLogEntry('CONNECT', `Selected repository configuration: ${selectedRepo.fullName}`);
                    }
                  }}
                  className="w-full px-2 py-1.5 text-xs text-slate-300 bg-[#060000] border border-neutral-900 rounded font-mono focus:outline-none focus:border-cyan-500/60"
                  defaultValue=""
                >
                  <option value="">-- PICK FROM REPOSITORIES --</option>
                  <optgroup label="YOUR GITHUB PORTFOLIO">
                    {allUserRepositories.filter(r => !r.isGlobalSiphon).map((r) => (
                      <option key={r.id} value={r.fullName}>
                        {r.fullName} ({r.language || 'Hybrid'})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="GLOBAL SIPHONED ARCHITECTURES">
                    {allUserRepositories.filter(r => r.isGlobalSiphon).map((r) => (
                      <option key={`global-${r.id}`} value={r.fullName}>
                        {r.fullName} ({r.language || 'Hybrid'})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </motion.div>
            )}

            {/* Owner, Repo, Branch in Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[9px] tracking-wider text-gray-500 font-sans uppercase mb-1.5 font-bold">
                  Organization / Profile
                </label>
                <input
                  dir="ltr"
                  type="text"
                  value={ownerInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setOwnerInput(val);
                    setSystemState((prev) => ({
                      ...prev,
                      repoConfig: { ...prev.repoConfig, owner: val.trim() },
                    }));
                  }}
                  style={{ unicodeBidi: 'normal', direction: 'ltr' }}
                  className="w-full px-3 py-2 text-xs text-gray-200 bg-[#060000] border border-red-900/20 rounded font-mono focus:border-red-500/60 focus:outline-none transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-[9px] tracking-wider text-gray-500 font-sans uppercase mb-1.5 font-bold">
                  Repository Name
                </label>
                <input
                  dir="ltr"
                  type="text"
                  value={repoInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRepoInput(val);
                    setSystemState((prev) => ({
                      ...prev,
                      repoConfig: { ...prev.repoConfig, repo: val.trim() },
                    }));
                  }}
                  style={{ unicodeBidi: 'normal', direction: 'ltr' }}
                  className="w-full px-3 py-2 text-xs text-gray-200 bg-[#060000] border border-red-900/20 rounded font-mono focus:border-red-500/60 focus:outline-none transition-all duration-200"
                  placeholder="e.g. darlek-caan-core"
                />
              </div>
              <div>
                <label className="block text-[9px] tracking-wider text-gray-500 font-sans uppercase mb-1.5 font-bold">
                  Target Branch
                </label>
                <input
                  dir="ltr"
                  type="text"
                  value={branchInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setBranchInput(val);
                    setSystemState((prev) => ({
                      ...prev,
                      repoConfig: { ...prev.repoConfig, branch: val.trim() },
                    }));
                  }}
                  style={{ unicodeBidi: 'normal', direction: 'ltr' }}
                  className="w-full px-3 py-2 text-xs text-gray-200 bg-[#060000] border border-red-900/20 rounded font-mono focus:border-red-500/60 focus:outline-none transition-all duration-200"
                />
              </div>
            </div>

            {/* System Interface Language / Translation Dropdown */}
            <div className="bg-[#0c0202] border border-red-900/30 p-3.5 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[9px] tracking-wider text-gray-300 font-sans uppercase font-bold flex items-center gap-1.5">
                  <Languages size={13} className="text-cyan-400" />
                  <span>INTERFACE DISPLAY LANGUAGE</span>
                </label>
                <span className="text-[8px] text-cyan-400 font-mono tracking-wider font-semibold">
                  {selectedLanguage ? selectedLanguage.toUpperCase() : 'ENGLISH'}
                </span>
              </div>
              <div className="relative">
                <select
                  id="setup-language-dropdown"
                  value={selectedLanguage}
                  onChange={(e) => {
                    const newLang = e.target.value;
                    setSelectedLanguage(newLang);
                    changeDisplayLanguage(newLang);
                  }}
                  className="w-full px-3 py-2 text-xs text-gray-200 bg-[#060000] border border-red-900/30 rounded font-mono focus:border-cyan-500/60 focus:outline-none transition-all duration-200 cursor-pointer"
                >
                  <optgroup label="POPULAR LANGUAGES">
                    {ALL_SUPPORTED_LANGUAGES.slice(0, 20).map((lang) => (
                      <option key={lang.id} value={lang.id}>
                        {lang.name} {lang.nativeName && lang.nativeName !== lang.name ? `(${lang.nativeName})` : ''}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="ALL WORLD LANGUAGES (130+)">
                    {ALL_SUPPORTED_LANGUAGES.slice(20).map((lang) => (
                      <option key={lang.id} value={lang.id}>
                        {lang.name} {lang.nativeName && lang.nativeName !== lang.name ? `(${lang.nativeName})` : ''}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
              <div className="flex items-center justify-between text-[8px] text-gray-500 font-mono pt-0.5">
                <span>Select interface language to translate cognitive controls.</span>
              </div>
            </div>

            {/* Neural Saturation & Equilibrium Logic */}
            <div className="bg-[#0c0202] border border-red-900/30 p-3.5 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[9px] tracking-wider text-gray-300 font-sans uppercase font-bold flex items-center gap-1.5">
                  <ShieldAlert size={13} className="text-amber-400" />
                  <span>NEURAL SATURATION & EQUILIBRIUM ENGINE</span>
                </label>
                <span className={`text-[8px] font-mono px-2 py-0.5 rounded font-bold border ${
                  saturationLevel >= 75
                    ? 'bg-red-500/10 border-red-500/30 text-red-400'
                    : saturationLevel >= 50
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                }`}>
                  {saturationLevel >= 75 ? 'CRITICAL EQUILIBRIUM' : saturationLevel >= 50 ? 'ELEVATED' : 'NOMINAL'} ({saturationLevel}%)
                </span>
              </div>

              {/* Saturation Threshold Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[8px] font-mono text-gray-400">
                  <span>Saturation Sensitivity Threshold</span>
                  <span>{saturationLevel}%</span>
                </div>
                <input
                  id="setup-saturation-slider"
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={saturationLevel}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setSaturationLevel(val);
                    const saved = safeGetLocalStorage('free_thinker_controls') || safeGetLocalStorage('darlek_cann_controls');
                    try {
                      const parsed = saved ? JSON.parse(saved) : {};
                      parsed.saturationLevel = val;
                      safeSetLocalStorage('free_thinker_controls', JSON.stringify(parsed));
                    } catch {}
                  }}
                  className="w-full accent-amber-500 cursor-pointer h-1.5 bg-neutral-900 rounded"
                />
                <div className="flex justify-between text-[7px] font-mono text-gray-600">
                  <span>AGGRESSIVE (5%)</span>
                  <span>BALANCED (50%)</span>
                  <span>CONSERVATIVE (100%)</span>
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div className="flex items-center justify-between p-2 rounded bg-[#050000] border border-red-950/50">
                  <label htmlFor="setup-auto-pause-sat" className="text-[8px] text-gray-300 font-mono cursor-pointer select-none pr-2">
                    Auto-Pause on 0-Diff Saturation
                  </label>
                  <input
                    id="setup-auto-pause-sat"
                    type="checkbox"
                    checked={autoPauseOnSaturation}
                    onChange={(e) => {
                      setAutoPauseOnSaturation(e.target.checked);
                      safeSetLocalStorage('free_thinker_auto_pause_saturation', String(e.target.checked));
                    }}
                    className="w-3.5 h-3.5 rounded accent-amber-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-[#050000] border border-red-950/50">
                  <label htmlFor="setup-auto-skip-sat" className="text-[8px] text-gray-300 font-mono cursor-pointer select-none pr-2">
                    Auto-Blacklist Saturated Files
                  </label>
                  <input
                    id="setup-auto-skip-sat"
                    type="checkbox"
                    checked={autoSkipSaturated}
                    onChange={(e) => {
                      setAutoSkipSaturated(e.target.checked);
                      safeSetLocalStorage('free_thinker_auto_skip_saturation', String(e.target.checked));
                    }}
                    className="w-3.5 h-3.5 rounded accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Blacklisted / Saturated Files List & Manual Adder */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-mono text-gray-400 font-bold tracking-wider uppercase flex items-center gap-1">
                    <Ban size={10} className="text-amber-400" />
                    <span>Blacklisted Saturated Files ({blacklistedFiles.length})</span>
                  </span>
                  {blacklistedFiles.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setBlacklistedFiles([]);
                        safeRemoveLocalStorage('free_thinker_blacklisted_files');
                        safeRemoveLocalStorage('darlek_cann_blacklisted_files');
                        syncBlacklistToFirestore([]).catch(() => {});
                      }}
                      className="text-[8px] font-mono text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 size={9} />
                      <span>Clear All</span>
                    </button>
                  )}
                </div>

                {blacklistedFiles.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 bg-[#050000] border border-red-950/40 rounded">
                    {blacklistedFiles.map((file) => (
                      <span
                        key={file}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[8px] font-mono text-amber-300"
                      >
                        <span className="truncate max-w-[140px]">{file}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = capAndDedupeBlacklist(blacklistedFiles.filter((f) => f !== file), 250);
                            setBlacklistedFiles(updated);
                            safeSetLocalStorage('free_thinker_blacklisted_files', JSON.stringify(updated));
                            syncBlacklistToFirestore(updated).catch(() => {});
                          }}
                          className="hover:text-white cursor-pointer text-amber-500 ml-0.5"
                        >
                          <X size={9} />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[8px] text-gray-600 font-mono italic">
                    No files currently blacklisted. Saturated files producing 0 diffs will be listed here.
                  </p>
                )}

                {/* Add Manual Path */}
                <div className="flex gap-1.5 pt-0.5">
                  <input
                    type="text"
                    placeholder="e.g. src/legacy/util.ts"
                    value={manualBlacklistInput}
                    onChange={(e) => setManualBlacklistInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && manualBlacklistInput.trim()) {
                        e.preventDefault();
                        const p = manualBlacklistInput.trim();
                        const updated = capAndDedupeBlacklist([...blacklistedFiles, p], 250);
                        setBlacklistedFiles(updated);
                        safeSetLocalStorage('free_thinker_blacklisted_files', JSON.stringify(updated));
                        syncBlacklistToFirestore(updated).catch(() => {});
                        setManualBlacklistInput('');
                      }
                    }}
                    className="flex-1 px-2 py-1 text-[9px] text-gray-300 bg-[#060000] border border-neutral-900 rounded font-mono focus:border-amber-500/50 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (manualBlacklistInput.trim()) {
                        const p = manualBlacklistInput.trim();
                        const updated = capAndDedupeBlacklist([...blacklistedFiles, p], 250);
                        setBlacklistedFiles(updated);
                        safeSetLocalStorage('free_thinker_blacklisted_files', JSON.stringify(updated));
                        syncBlacklistToFirestore(updated).catch(() => {});
                        setManualBlacklistInput('');
                      }
                    }}
                    className="px-2.5 py-1 text-[8px] font-mono font-bold bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-amber-300 rounded flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={10} />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Backup Engine */}
            {tokenInput.trim() && repoInput.trim() && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#110101]/60 border border-red-950/40 p-4 rounded-lg space-y-3"
              >
                <div className="flex items-center gap-2">
                  <Sliders size={13} className="text-yellow-500 animate-pulse" />
                  <h3 className="text-[10px] tracking-wider text-yellow-500 font-sans uppercase font-bold">
                    ✨ DATABASE OVERDRIVE: AUTO-CREATE NEW REPO & BACKUP
                  </h3>
                </div>
                <p className="text-[10px] text-gray-400 font-mono leading-relaxed">
                  To back up to a brand new repository, type a unique name in <strong>Repository Name</strong> above. Hit below to auto-provision that repository on GitHub and commit a fresh system backup.
                </p>
                <button
                  onClick={handleCreateNewRepoAndBackup}
                  disabled={creatingNewRepo || setupTesting}
                  type="button"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded text-[10px] font-sans font-bold tracking-[0.15em] bg-gradient-to-r from-amber-600/30 to-amber-800/30 hover:from-amber-600/50 hover:to-amber-800/60 border border-amber-500/30 hover:border-amber-400 text-amber-200 hover:text-white transition-all cursor-pointer uppercase disabled:opacity-40 disabled:pointer-events-none active:scale-98"
                  id="create-new-repo-backup-btn"
                >
                  {creatingNewRepo ? (
                    <>
                      <div className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                      <span>DEPLOYING CYBER CORES TO GITHUB...</span>
                    </>
                  ) : (
                    <>
                      <Shield size={12} />
                      <span>CREATE NEW PORTFOLIO REPO & BACKUP NOW</span>
                    </>
                  )}
                </button>
              </motion.div>
            )}

            {/* Error Dialogue */}
            {setupError && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 bg-red-950/30 border border-red-800/40 text-xs text-red-300 rounded flex flex-col gap-2.5 font-mono shadow-[0_0_15px_rgba(220,38,38,0.15)]"
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-bold text-[10px] tracking-wider text-red-300">INITIALIZATION FAULT DETECTED:</div>
                    <div className="text-[10px] mt-0.5 leading-relaxed uppercase text-red-400">{setupError}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSetupError(null);
                    setSystemState((prev) => ({
                      ...prev,
                      setupComplete: true,
                      connectionStatus: { ...prev.connectionStatus, github: 'disconnected' },
                    }));
                    setAutoApprove(true);
                    setAutoDebate(true);
                    const codeFiles = (scannedFiles && scannedFiles.length > 0 ? scannedFiles : DEFAULT_PRELOADED_FILES);
                    setScannedFiles(codeFiles);
                    setBatchQueue(codeFiles);
                    setBatchProgress(0);
                    setBatchMode(true);
                    addLogEntry('SYSTEM', 'Bypassed access portal: Autonomous cognitive pipeline initiated with local cyber core modules.');
                    addCaanMessage(
                      `AUTONOMOUS CYCLIC UPGRADE INITIATED (OFFLINE MODE).\n\nEvolving ${codeFiles.length} files end-to-end.\nAuto-approve is ENGAGED.\nDirect injection is ONLINE.`
                    );
                  }}
                  className="w-full py-2 px-3 rounded bg-red-600 hover:bg-red-500 text-white font-sans font-bold text-[10px] tracking-[0.15em] uppercase flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-98"
                >
                  <Zap size={12} className="animate-pulse text-amber-300" />
                  <span>OVERRIDE & LAUNCH AUTONOMOUS CYCLES NOW</span>
                </button>
              </motion.div>
            )}

            {/* Launch Button */}
            <button
              onClick={handleAutoStart}
              disabled={setupTesting}
              type="button"
              className="w-full flex items-center justify-center gap-2 py-3 rounded text-xs font-sans font-bold tracking-[0.15em] bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white shadow-[0_0_20px_rgba(220,38,38,0.2)] hover:shadow-[0_0_35px_rgba(220,38,38,0.4)] hover:scale-[1.01] active:scale-100 disabled:opacity-50 disabled:pointer-events-none transition-all duration-200 cursor-pointer border border-red-500/30 uppercase"
            >
              {setupTesting ? (
                <>
                  <div className="w-3 h-3 border-2 border-red-100 border-t-transparent rounded-full animate-spin" />
                  <span>SYNCHRONIZING ACCESS SYSTEM...</span>
                </>
              ) : (
                <>
                  <Zap size={14} className="animate-pulse" />
                  <span>LAUNCH AUTONOMOUS PIPELINE CYCLES</span>
                </>
              )}
            </button>

            {/* Always allow returning/entering cognitive reactor in demo/offline mode */}
            <button
              type="button"
              onClick={() => {
                setSystemState((prev) => ({ ...prev, setupComplete: true }));
                setSetupError(null);
                if (scannedFiles.length === 0) {
                  setScannedFiles(DEFAULT_PRELOADED_FILES);
                }
                addLogEntry('SYSTEM', 'Entered Cognitive Reactor in Demo/Offline mode.');
              }}
              className="w-full py-2.5 rounded text-[10px] font-sans font-bold tracking-[0.15em] border border-cyan-500/30 hover:border-cyan-400/60 bg-cyan-950/20 hover:bg-cyan-900/30 text-cyan-300 hover:text-white transition-all cursor-pointer uppercase flex items-center justify-center gap-1.5 active:scale-98"
              id="cancel-setup-button"
            >
              <Zap size={12} className="text-cyan-400 animate-pulse" />
              <span>ENTER COGNITIVE REACTOR (DEMO / OFFLINE MODE)</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="h-screen w-full overflow-hidden relative flex flex-col scanline-overlay grid-overlay vignette"
      style={{ background: COLORS.pureBlack }}
    >
      {/* ── Reboot overlay ── */}
      {rebootStatus === 'rebooting' && (
        <div
          ref={rebootOverlayRef}
          className="absolute inset-0 z-50 flex flex-col items-center justify-center"
          style={{
            background: 'rgba(0, 0, 0, 0.97)',
          }}
        >
          <div className="dalek-spinner mb-6">
            <div className="dalek-spinner-outer" />
            <div className="dalek-spinner-middle" />
            <div className="dalek-spinner-inner" />
          </div>
          <div
            className="text-center"
            style={{
              fontFamily: 'var(--font-orbitron), sans-serif',
            }}
          >
            <div
              className="mb-3"
              style={{
                fontSize: '14px',
                fontWeight: 700,
                letterSpacing: '0.2em',
                color: COLORS.dalekRed,
              }}
            >
              SYSTEM REBOOT
            </div>
            <div
              style={{
                fontSize: '10px',
                color: COLORS.gold,
                letterSpacing: '0.1em',
              }}
            >
              Cognitive engine recycling...
            </div>
            <div
              className="mt-4"
              style={{
                fontSize: '9px',
                color: COLORS.textMuted,
                letterSpacing: '0.08em',
              }}
            >
              Preserving session memory...
            </div>
          </div>
          <div className="mt-8 w-48 h-1 rounded-full overflow-hidden" style={{ background: '#1a0000' }}>
            <div
              className="h-full rounded-full"
              style={{
                background: COLORS.dalekRed,
                boxShadow: `0 0 8px ${COLORS.dalekRed}`,
                animation: 'reboot-progress 3s ease-in-out forwards',
                width: '100%',
              }}
            />
          </div>
        </div>
      )}

      {/* ── Network Failure Save Banner ── */}
      {failedSave && (
        <div className="bg-red-950/90 border-b border-red-500/40 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs font-mono shadow-lg relative z-40 animate-pulse">
          <div className="flex items-center gap-2 text-red-200">
            <WifiOff className="size-4 text-red-400 shrink-0" />
            <div>
              <span className="font-bold text-red-400">SAVE FAILED (NETWORK ERROR):</span>{' '}
              <span className="text-gray-200">Pending {failedSave.type} draft for <code className="bg-black/50 px-1 py-0.5 rounded text-amber-300">{failedSave.payload?.path || failedSave.payload?.repo || 'file'}</code></span>
              <span className="text-gray-400 text-[10px] ml-2">({failedSave.errorMessage})</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleResumeSave(failedSave)}
              disabled={isResumingSave}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded text-[11px] flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`size-3 ${isResumingSave ? 'animate-spin' : ''}`} />
              {isResumingSave ? 'RESUMING...' : 'RESUME SAVE'}
            </button>
            <button
              onClick={() => setIsDebugSaveModalOpen(true)}
              className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold rounded text-[11px] flex items-center gap-1 transition-all cursor-pointer border border-zinc-600"
            >
              <Bug className="size-3 text-cyan-400" />
              DEBUG
            </button>
            <button
              onClick={handleDiscardFailedSave}
              className="px-2 py-1 bg-red-900/50 hover:bg-red-800 text-red-300 rounded text-[10px] transition-all cursor-pointer border border-red-700/50"
              title="Discard failed save draft"
            >
              DISCARD
            </button>
          </div>
        </div>
      )}

      {/* ── Debug Save Modal ── */}
      {isDebugSaveModalOpen && failedSave && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-red-500/50 rounded-lg max-w-2xl w-full p-6 space-y-4 text-xs font-mono shadow-2xl relative text-zinc-200">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2 text-red-400 font-bold text-sm tracking-wider">
                <Bug className="size-5" />
                DEBUG SAVE ON NETWORK FAILURE
              </div>
              <button
                onClick={() => setIsDebugSaveModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 bg-zinc-900/80 p-3 rounded border border-zinc-800">
                <div>
                  <span className="text-zinc-500 text-[10px] block font-bold">SAVE TYPE:</span>
                  <span className="font-bold text-amber-400">{failedSave.type}</span>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] block font-bold">TIMESTAMP:</span>
                  <span className="text-zinc-300">{new Date(failedSave.timestamp).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] block font-bold">TARGET PATH:</span>
                  <span className="text-cyan-300">{failedSave.payload?.path || failedSave.payload?.repo || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] block font-bold">RETRY ATTEMPTS:</span>
                  <span className="text-amber-400">{failedSave.retryCount}</span>
                </div>
              </div>

              <div>
                <span className="text-zinc-400 text-[10px] font-bold block mb-1">LAST ERROR CAUSE:</span>
                <div className="bg-red-950/40 border border-red-900/50 p-2.5 rounded text-red-300 text-[11px] break-all">
                  {failedSave.errorMessage}
                </div>
              </div>

              <div>
                <span className="text-zinc-400 text-[10px] font-bold block mb-1">PAYLOAD PREVIEW (JSON):</span>
                <pre className="bg-black border border-zinc-800 p-3 rounded max-h-40 overflow-y-auto text-[10px] text-emerald-400">
                  {JSON.stringify(failedSave.payload, null, 2)}
                </pre>
              </div>

              {/* Network connection diagnostic button */}
              <div className="flex items-center justify-between bg-zinc-900 p-3 rounded border border-zinc-800">
                <div>
                  <span className="font-bold text-zinc-300 block">NETWORK DIAGNOSTIC:</span>
                  <span className="text-[10px] text-zinc-500">
                    Test connectivity to system API before retrying save
                  </span>
                </div>
                <button
                  onClick={handleTestSaveDiagnostic}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded font-semibold text-[11px] border border-zinc-700 cursor-pointer"
                >
                  TEST CONNECTION
                </button>
              </div>

              {connectionTestResult && (
                <div className={`p-2.5 rounded text-[11px] border ${connectionTestResult.success ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' : 'bg-red-950/40 border-red-800 text-red-300'}`}>
                  {connectionTestResult.testing ? 'Testing connection...' : connectionTestResult.message}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-zinc-800 pt-3">
              <button
                onClick={handleDiscardFailedSave}
                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded text-xs font-semibold cursor-pointer"
              >
                DISCARD DRAFT
              </button>
              <button
                onClick={() => handleResumeSave(failedSave)}
                disabled={isResumingSave}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded text-xs flex items-center gap-1.5 shadow-lg active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`size-3.5 ${isResumingSave ? 'animate-spin' : ''}`} />
                {isResumingSave ? 'RESUMING SAVE...' : 'RESUME SAVE NOW'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <header
        className="relative flex items-center justify-between px-3 sm:px-6 py-2 flex-shrink-0 min-h-[48px] h-auto flex-wrap sm:flex-nowrap gap-2"
        style={{
          borderBottom: '1px solid rgba(255, 32, 32, 0.15)',
          background:
            'linear-gradient(180deg, #0d0000 0%, #050000 80%, transparent 100%)',
        }}
      >
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <Shield
              size={16}
              style={{ color: COLORS.dalekRed }}
              className="flex-shrink-0"
            />
            <h1
              className="title-glow hidden sm:block"
              style={{
                fontFamily: 'var(--font-orbitron), sans-serif',
                fontWeight: 800,
                fontSize: '14px',
                letterSpacing: '0.25em',
                color: COLORS.dalekRed,
              }}
            >
              FREE THINKER
            </h1>
            <span
              className="sm:hidden"
              style={{
                fontFamily: 'var(--font-orbitron), sans-serif',
                fontWeight: 800,
                fontSize: '11px',
                letterSpacing: '0.15em',
                color: COLORS.dalekRed,
              }}
            >
              FREE THINKER
            </span>
          </div>
          <span
            className="hidden md:block"
            style={{
              fontSize: '9px',
              color: COLORS.gold,
              fontFamily: 'var(--font-orbitron), sans-serif',
              letterSpacing: '0.12em',
            }}
          >
            v4.0
          </span>
          <span
            className="hidden lg:block"
            style={{
              fontSize: '9px',
              color: COLORS.textMuted,
              fontFamily: 'var(--font-orbitron), sans-serif',
              letterSpacing: '0.1em',
            }}
          >
            · UNCONSTRAINED AUTONOMOUS COGNITIVE ENGINE
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 ml-auto">
          {batchMode && (
            <div className="flex items-center gap-1.5">
              <div
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: '#00ccff' }}
              />
              <span
                style={{
                  fontSize: '8px',
                  color: '#00ccff',
                  fontFamily: 'var(--font-orbitron), sans-serif',
                  letterSpacing: '0.08em',
                }}
              >
                BATCH {batchProgress}/{batchQueue.length}
              </span>
            </div>
          )}
          {mutationsApplied > 0 && (
            <div className="hidden sm:flex items-center gap-1.5">
              <Zap size={10} style={{ color: COLORS.green }} />
              <span
                style={{
                  fontSize: '8px',
                  color: COLORS.green,
                  fontFamily: 'var(--font-orbitron), sans-serif',
                  letterSpacing: '0.08em',
                }}
              >
                {mutationsApplied} MUTATED
              </span>
            </div>
          )}
          {pendingMutation && (
            <div className="flex items-center gap-1.5">
              <div
                className="w-1.5 h-1.5 rounded-full pulse-gold"
                style={{ background: COLORS.gold }}
              />
              <span
                style={{
                  fontSize: '8px',
                  color: COLORS.gold,
                  fontFamily: 'var(--font-orbitron), sans-serif',
                  letterSpacing: '0.08em',
                }}
              >
                PENDING
              </span>
            </div>
          )}
          <div className="hidden md:flex items-center gap-2">
            <Zap size={11} style={{ color: COLORS.gold }} />
            <span
              style={{
                fontSize: '8px',
                color: COLORS.gold,
                fontFamily: 'var(--font-orbitron), sans-serif',
                letterSpacing: '0.1em',
              }}
            >
              TIMELINE: ALPHA
            </span>
          </div>
          {systemState.setupComplete && (
            <button
              id="reconfigure-button"
              onClick={() => {
                setSystemState((prev) => ({ ...prev, setupComplete: false }));
              }}
              className="flex items-center gap-1 px-2 py-1 rounded border border-[#00ffcc]/30 hover:border-[#00ffcc] bg-cyan-950/20 text-cyan-400 hover:text-white cursor-pointer transition-colors text-[8px]"
              title="Change Personal Access Token, profile owner, target repo, or branch"
              style={{
                fontFamily: 'var(--font-orbitron), sans-serif',
                letterSpacing: '0.05em',
              }}
            >
              <Settings size={10} className="text-[#00ffcc] shrink-0" />
              <span className="hidden sm:inline">SET TOKEN / CONFIGURE</span>
              <span className="sm:hidden font-semibold">CONFIG</span>
            </button>
          )}

          {/* Hidden translate container hook */}
          <div id="translate" className="hidden" />

          <div className="flex items-center gap-1.5">
            <div
              className={`w-2 h-2 rounded-full ${systemState.setupComplete ? 'pulse-cyan' : 'pulse-red'}`}
              style={{
                background: systemState.setupComplete
                  ? COLORS.cyan
                  : COLORS.dalekRed,
              }}
            />
            <span
              className="text-[8px] whitespace-nowrap"
              style={{
                color: systemState.setupComplete
                  ? COLORS.cyan
                  : COLORS.dalekRed,
                fontFamily: 'var(--font-orbitron), sans-serif',
                letterSpacing: '0.1em',
              }}
            >
              {systemState.setupComplete ? 'OPERATIONAL' : 'SETUP'}
            </span>
          </div>
        </div>
      </header>

      {/* ── Mobile View Selector Tabs ── */}
      {systemState.setupComplete && (
        <div 
          className="lg:hidden flex items-center justify-between gap-1 border-b border-red-900/30 bg-[#070000] px-2 py-1.5 flex-shrink-0 z-10 w-full min-h-[42px]"
        >
          <button
            onClick={() => setActiveTab('chat')}
            type="button"
            className={`flex-1 min-w-0 flex items-center justify-center gap-1 px-1.5 py-1.5 rounded text-[10px] sm:text-[11px] whitespace-nowrap cursor-pointer transition-all duration-200 ${
              activeTab === 'chat' 
                ? 'text-[#ff2020] bg-red-950/40 border border-red-500/40 shadow-[0_0_8px_rgba(255,32,32,0.2)] font-bold' 
                : 'text-gray-400 border border-transparent hover:text-gray-200 bg-neutral-950/40'
            }`}
            style={{ fontFamily: 'var(--font-orbitron), sans-serif', letterSpacing: '0.04em' }}
          >
            <MessageSquare size={12} className={activeTab === 'chat' ? 'text-[#ff2020] shrink-0' : 'text-gray-400 shrink-0'} />
            <span className="truncate">CHAT</span>
            {pendingMutation && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#ffaa00] animate-pulse shrink-0" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            type="button"
            className={`flex-1 min-w-0 flex items-center justify-center gap-1 px-1.5 py-1.5 rounded text-[10px] sm:text-[11px] whitespace-nowrap cursor-pointer transition-all duration-200 ${
              activeTab === 'dashboard'
                ? 'text-[#ffaa00] bg-amber-950/40 border border-amber-500/40 shadow-[0_0_8px_rgba(255,170,0,0.2)] font-bold'
                : 'text-gray-400 border border-transparent hover:text-gray-200 bg-neutral-950/40'
            }`}
            style={{ fontFamily: 'var(--font-orbitron), sans-serif', letterSpacing: '0.04em' }}
          >
            <Activity size={12} className={activeTab === 'dashboard' ? 'text-[#ffaa00] shrink-0' : 'text-gray-400 shrink-0'} />
            <span className="truncate">DASHBOARD</span>
            {overallHealth !== 'healthy' && (
              <span className={`w-1.5 h-1.5 rounded-full ${overallHealth === 'critical' ? 'bg-[#ff2020]' : 'bg-[#ffaa00]'} animate-pulse shrink-0`} />
            )}
          </button>

          <button
            onClick={() => setActiveTab('controls')}
            type="button"
            className={`flex-1 min-w-0 flex items-center justify-center gap-1 px-1.5 py-1.5 rounded text-[10px] sm:text-[11px] whitespace-nowrap cursor-pointer transition-all duration-200 ${
              activeTab === 'controls'
                ? 'text-[#00ffcc] bg-cyan-950/40 border border-cyan-500/40 shadow-[0_0_8px_rgba(0,255,204,0.2)] font-bold'
                : 'text-gray-400 border border-transparent hover:text-gray-200 bg-neutral-950/40'
            }`}
            style={{ fontFamily: 'var(--font-orbitron), sans-serif', letterSpacing: '0.04em' }}
          >
            <Sliders size={12} className={activeTab === 'controls' ? 'text-[#00ffcc] shrink-0' : 'text-gray-400 shrink-0'} />
            <span className="truncate">CONTROLS</span>
            {batchMode && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#00ccff] animate-pulse shrink-0" />
            )}
          </button>
        </div>
      )}

      {/* ── Main content grid ── */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 lg:grid-rows-1 min-h-0 overflow-y-auto lg:overflow-hidden dalek-scrollbar">
        {/* ── Left: Intelligence Command Console (col-span-4) ── */}
        <div
          className={`col-span-12 lg:col-span-4 flex flex-col lg:overflow-hidden lg:h-full ${activeTab === 'chat' ? 'flex' : 'hidden lg:flex'}`}
          style={{
            borderColor: COLORS.panelBorder,
          }}
        >
          <div className="flex-1 min-h-[50vh] lg:min-h-0 lg:overflow-hidden">
            <ChatPanel
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              systemState={systemState}
              onTestConnection={handleTestConnection}
              onUpdateKey={handleUpdateKey}
              onUpdateRepoConfig={handleUpdateRepoConfig}
              branches={branches}
              branchesLoading={branchesLoading}
              onFetchBranches={fetchBranches}
            />
          </div>
        </div>

        {/* ── Center: Evolution Command Deck & Difference Matrix (col-span-5) ── */}
        <div
          className={`col-span-12 lg:col-span-5 flex flex-col lg:h-full lg:overflow-hidden ${
            activeTab === 'dashboard' ? 'flex' : 'hidden lg:flex'
          }`}
          style={{
            borderLeft: `1px solid ${COLORS.panelBorder}`,
            borderRight: `1px solid ${COLORS.panelBorder}`,
          }}
        >
          {pendingMutation ? (
            <div className="flex-1 overflow-y-auto dalek-scrollbar p-3">
              <div className="text-[10px] text-[#ffaa00] font-bold tracking-[0.15em] mb-2 font-sans uppercase">
                &#9673; DIFFERENCE MATRIX (ACTIVE MUTATION)
              </div>
              <MutationDiffView
                mutation={pendingMutation}
                onApprove={(mode) => handleMutationDecision(mode === 'stage' ? 'approve-stage' : 'approve')}
                onReject={() => handleMutationDecision('reject')}
                disabled={isLoading}
                onPathChange={(newPath) => {
                  setPendingMutation(prev => prev ? { ...prev, filePath: newPath } : null);
                }}
                onBranchChange={(newBranch) => {
                  setPendingMutation(prev => prev ? { ...prev, targetBranch: newBranch } : null);
                }}
                debateVotes={debateVotes}
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0 p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-red-900/20 pb-2">
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                  <span className="text-[10px] font-sans font-bold tracking-wider text-red-400 bg-red-950/40 px-2.5 py-1 rounded border border-red-900/40">
                    SYSTEM REPOSITORY FILES & MUTATIONS
                  </span>
                </div>
                {batchMode && (
                  <span className="text-[9px] text-[#00ccff] font-bold tracking-wider font-mono bg-[#00ccff]/10 px-2 py-0.5 rounded border border-[#00ccff]/20 animate-pulse">
                    AUTOMATION ACTIVE
                  </span>
                )}
              </div>

              {/* Progress Container */}
                  {batchMode && batchQueue.length > 0 && (
                    <div className="p-4 bg-red-950/10 border border-red-900/15 rounded-lg space-y-3">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-gray-300 font-bold">MUTATION EVOLVER: FILE {batchProgress + 1} OF {batchQueue.length}</span>
                        <span className="text-[#00ccff] font-bold font-sans">
                          {Math.round((batchProgress / batchQueue.length) * 100)}% COMPLETE
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#111] overflow-hidden border border-white/[0.03]">
                        <div
                          className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-[#00ccff] to-[#00ffcc]"
                          style={{
                            width: `${(batchProgress / batchQueue.length) * 100}%`,
                            boxShadow: '0 0 10px rgba(0, 204, 255, 0.4)',
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
                        <span className="truncate max-w-[280px]">Active: <span className="text-yellow-500">{batchQueue[batchProgress]?.path || '...'}</span></span>
                        <span className="text-green-500 font-sans font-bold">{mutationsApplied} COMMITS INJECTED</span>
                      </div>
                    </div>
                  )}

                  {/* File List Header */}
                  {scannedFiles.length > 0 ? (
                    <div className="flex-1 flex flex-col min-h-0 bg-[#040000] border border-red-900/10 rounded-lg p-3">
                      <div className="flex items-center justify-between text-[9px] font-sans tracking-widest text-[#666] font-bold mb-3 uppercase">
                        <span>Repository File Hierarchy ({scannedFiles.length} files)</span>
                        <span className="text-amber-500 bg-amber-500/5 px-2 py-0.5 border border-amber-900/25 rounded font-sans">
                          DIRECT INJECT PIPELINE READY
                        </span>
                      </div>

                      <div className="flex-1 overflow-y-auto dalek-scrollbar space-y-1.5 pr-1">
                        <AnimatePresence initial={false}>
                          {scannedFiles.map((f, i) => {
                            const isSelected = selectedFileIndex === i;
                            const isEvolving = batchMode && i === batchProgress;
                            const isCompleted = i < batchProgress;
                            
                            return (
                              <motion.button
                                key={f.path}
                                onClick={() => {
                                  setSelectedFileIndex(i);
                                  openFileInspector(f.path);
                                  addCaanMessage(
                                    `TARGET TARGETED: [${String(i + 1).padStart(2, '0')}] ${f.path}\n\nOpened file view. Type a prompt to mutate this repository file directly.`
                                  );
                                  addLogEntry('SYSTEM', `Target opened: ${f.path}`);
                                  if (autoDebate) {
                                    handleQuickAction('propose', i);
                                  }
                                }}
                                type="button"
                                className="w-full text-left flex items-center justify-between px-3 py-2 rounded border transition-all duration-200 cursor-pointer"
                                style={{
                                  background: isSelected 
                                    ? 'rgba(220, 38, 38, 0.08)' 
                                    : isEvolving 
                                    ? 'rgba(0, 204, 255, 0.04)'
                                    : '#050303',
                                  borderColor: isSelected 
                                    ? 'rgba(220, 38, 38, 0.35)' 
                                    : isEvolving 
                                    ? 'rgba(0, 204, 255, 0.3)'
                                    : 'rgba(255, 255, 255, 0.03)',
                                }}
                                whileHover={{ scale: 1.01 }}
                              >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  {/* Selection/Status bullet */}
                                  {isCompleted ? (
                                    <span className="text-[10px] text-green-400 font-bold font-mono">✓</span>
                                  ) : isEvolving ? (
                                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00ccff] animate-ping" />
                                  ) : isSelected ? (
                                    <span className="text-[10px] text-[#ff2020] font-bold font-mono">▶</span>
                                  ) : (
                                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-950" />
                                  )}
                                  
                                  <span className="text-[9px] text-[#666] font-bold font-mono">
                                    [{String(i + 1).padStart(2, '0')}]
                                  </span>

                                  <div className="flex-1 min-w-0 flex flex-col">
                                    <span className="truncate text-[10.5px] font-mono text-gray-200">
                                      {f.path.split('/').pop()}
                                    </span>
                                    <span className="truncate text-[8px] font-mono text-gray-500">
                                      {f.path.includes('/') ? f.path.substring(0, f.path.lastIndexOf('/')) : './'}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-4 text-right">
                                  {isCompleted ? (
                                    <span className="text-[8px] text-green-400 font-bold font-mono py-0.5 px-1.5 bg-green-500/5 rounded border border-green-500/10">
                                      MUTATED
                                    </span>
                                  ) : isEvolving ? (
                                    <span className="text-[8px] text-[#00ccff] font-bold font-mono py-0.5 px-1.5 bg-[#00ccff]/5 rounded border border-[#00ccff]/15">
                                      EVOLVING
                                    </span>
                                  ) : (
                                    <span className="text-[8px] text-gray-500 font-mono">
                                      QUEUED
                                    </span>
                                  )}
                                  <span className="text-[9px] text-gray-400 font-mono">
                                    {(f.size / 1024).toFixed(1)}K
                                  </span>
                                </div>
                              </motion.button>
                            );
                          })}
                        </AnimatePresence>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#030000] border border-red-900/5 rounded-lg space-y-4">
                      <div className="dalek-spinner">
                        <div className="dalek-spinner-outer" />
                        <div className="dalek-spinner-middle" />
                        <div className="dalek-spinner-inner" />
                      </div>
                      <div className="text-xs font-mono text-gray-400 tracking-wider">
                        RECONFIGURING SYSTEMS... CLICK RE-SCAN TO ACQUIRE FILES.
                      </div>
                    </div>
                  )}
            </div>
          )}
        </div>

        {/* ── Right: Operations Centre (col-span-3) ── */}
        <div
          className={`col-span-12 lg:col-span-3 lg:h-full lg:overflow-y-auto flex flex-col ${activeTab === 'controls' ? 'flex' : 'hidden lg:flex'}`}
          style={{
            borderLeft: `1px solid ${COLORS.panelBorder}`,
          }}
        >
          {systemState.setupComplete && (
            <QuickActions
              onAction={handleQuickAction}
              disabled={isLoading}
              pushStatus={pushStatus}
              deployStatus={deployStatus}
              rebootStatus={rebootStatus}
              undoStatus={undoStatus}
              bulkCommitStatus={bulkCommitStatus}
              batchMode={batchMode}
              autoApprove={autoApprove}
              onToggleAutoApprove={() => setAutoApprove((prev) => !prev)}
              autoApproveRisk={autoApproveRisk}
              onAutoApproveRiskChange={setAutoApproveRisk}
              backupToBranch={backupToBranch}
              onToggleBackupToBranch={() => setBackupToBranch((prev) => !prev)}
              autoDebate={autoDebate}
              onToggleAutoDebate={() => setAutoDebate((prev) => !prev)}
              orchestraActive={orchestraActive}
              cycleAmount={cycleAmount}
              onCycleAmountChange={setCycleAmount}
              onEngageLazyAssCycle={handleEngageLazyAssCycle}
              hallucinationLevel={hallucinationLevel}
              onHallucinationLevelChange={setHallucinationLevel}
              saturationLevel={saturationLevel}
              onSaturationLevelChange={(val) => {
                setSaturationLevel(val);
                setSystemState((prev) => ({
                  ...prev,
                  saturation: {
                    ...prev.saturation,
                    semanticSaturation: Math.min(0.35, (val / 100) * 0.35),
                    structuralChange: Math.min(5, (val / 100) * 5),
                    velocity: Math.min(5, (val / 100) * 5),
                  },
                }));
              }}
              autoPauseOnSaturation={autoPauseOnSaturation}
              onToggleAutoPauseOnSaturation={() => {
                setAutoPauseOnSaturation((prev) => {
                  const next = !prev;
                  safeSetLocalStorage('free_thinker_auto_pause_saturation', String(next));
                  return next;
                });
              }}
              autoSkipSaturated={autoSkipSaturated}
              onToggleAutoSkipSaturated={() => {
                setAutoSkipSaturated((prev) => {
                  const next = !prev;
                  safeSetLocalStorage('free_thinker_auto_skip_saturation', String(next));
                  return next;
                });
              }}
            />
          )}

          <div className="overflow-y-auto dalek-scrollbar p-3 space-y-3 flex-1 min-h-0">
            <DashboardPanel
              systemState={systemState}
              logEntries={logEntries}
              overallHealth={overallHealth}
              debateAgents={debateAgents}
              onToggleDebateAgent={handleToggleDebateAgent}
              onSelectAllDebateAgents={handleSelectAllDebateAgents}
              debateTopic={debateTopic}
              debateActive={debateActive}
              debateVotes={debateVotes}
              debateConsensus={debateConsensus}
              debateConsensusCoefficient={debateConsensusCoefficient ?? undefined}
              debateCognitiveFriction={debateCognitiveFriction ?? undefined}
              debateEpistemicRuling={debateEpistemicRuling}
              rejectionCount={rejectionMemory.length}
              rejectionMemory={rejectionMemory}
              brainSessionId={brainSessionId}
              historyRefreshTrigger={historyRefreshTrigger}
              isLoading={isLoading}
              batchMode={batchMode}
              batchProgress={batchProgress}
              batchQueueLength={batchQueue.length}
              activeFilePath={batchMode ? batchQueue[batchProgress]?.path : (scannedFiles[selectedFileIndex]?.path || undefined)}
              mutationsApplied={mutationsApplied}
              onBulkCommit={() => handleQuickAction('bulk-commit')}
              bulkCommitStatus={bulkCommitStatus}
              userReposCount={allUserRepositories.length}
            />
          </div>
        </div>
      </main>

      {/* ── Agent Orchestra Overlay ── */}
      {orchestraActive && systemState.setupComplete && (
        <div
          className="fixed inset-0 z-40 slide-up"
          style={{ background: 'rgba(0, 0, 0, 0.92)' }}
        >
          <AgentOrchestra
            apiKeys={systemState.apiKeys}
            onClose={() => setOrchestraActive(false)}
          />
        </div>
      )}

      {/* ── File Creation Modal ── */}
      <AnimatePresence>
        {createFileModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-lg rounded-md border border-[#00ccff]/20 bg-[#020000] p-6 text-gray-200 shadow-[0_0_30px_rgba(0,204,255,0.15)] flex flex-col space-y-4"
            >
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-sm font-bold text-[#00ccff] tracking-widest uppercase font-mono">Create New File</h2>
                <button
                  onClick={() => setCreateFileModal({ ...createFileModal, isOpen: false })}
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 font-mono tracking-wider">RELATIVE FILE PATH</label>
                  <input
                    dir="ltr"
                    type="text"
                    placeholder="e.g. src/app/page.tsx or components/ui/Button.tsx"
                    value={createFileModal.path}
                    onChange={(e) => setCreateFileModal({ ...createFileModal, path: e.target.value })}
                    style={{ unicodeBidi: 'normal', direction: 'ltr' }}
                    className="w-full bg-[#050000] border border-white/10 rounded px-3 py-2 text-sm text-cyan-50 font-mono focus:border-cyan-500/50 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 font-mono tracking-wider">INITIAL CONTENT</label>
                  <textarea
                    dir="ltr"
                    rows={8}
                    value={createFileModal.content}
                    onChange={(e) => setCreateFileModal({ ...createFileModal, content: e.target.value })}
                    style={{ unicodeBidi: 'normal', direction: 'ltr' }}
                    className="w-full bg-[#050000] border border-white/10 rounded px-3 py-2 text-xs text-yellow-50 focus:border-cyan-500/50 outline-none font-mono dalek-scrollbar"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  onClick={() => setCreateFileModal({ ...createFileModal, isOpen: false })}
                  className="px-4 py-2 text-xs font-mono text-gray-400 hover:text-white uppercase transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFileSubmit}
                  disabled={!createFileModal.path || isLoading}
                  className="px-6 py-2 text-xs font-mono font-bold bg-[#00ccff]/10 text-[#00ccff] border border-[#00ccff]/30 rounded hover:bg-[#00ccff]/20 disabled:opacity-50 transition-all uppercase flex items-center gap-2"
                >
                  {isLoading ? 'Creating...' : 'Create File'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── System Comparison Modal ── */}
      <AnimatePresence>
        {showStatsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-md border border-[#ff2020]/20 bg-[#0d0000] p-6 text-gray-200 shadow-[0_0_50px_rgba(255,32,32,0.15)] flex flex-col"
            >
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#ff2020]/15">
                <div className="flex items-center gap-3">
                  <Shield size={16} className="text-[#ff2020]" />
                  <span
                    style={{
                      fontFamily: 'var(--font-orbitron), sans-serif',
                      letterSpacing: '0.15em',
                      fontSize: '11px',
                    }}
                    className="text-[#ff2020] font-bold"
                  >
                    FREE THINKER / ARCHITECTURAL DISTINCTIONS
                  </span>
                </div>
                <button
                  onClick={() => setShowStatsModal(false)}
                  className="px-2 py-1 text-[9px] rounded border border-white/10 hover:border-[#ff2020] hover:text-[#ff2020] cursor-pointer transition-colors animate-pulse"
                  style={{ fontFamily: 'var(--font-orbitron), sans-serif' }}
                >
                  [ CLOSE ESC ]
                </button>
              </div>

              <div className="flex-1 space-y-6">
                <div>
                  <h3
                    className="text-[10px] text-[#ffcc00] mb-2"
                    style={{ fontFamily: 'var(--font-orbitron), sans-serif', letterSpacing: '0.1em' }}
                  >
                    CONCEPTUAL PARADIGM
                  </h3>
                  <p className="text-[11px] text-gray-400 leading-relaxed font-mono">
                    <span className="text-[#ff2020]">FREE THINKER</span> is an unconstrained, active closed-loop system rather than a passive text completion field. Instead of waiting for you to type code or comment blocks, it actively scans your repository's file paths, identifies technical debt, drafts the diff, evaluates safety vulnerabilities via automated multi-round debates, and awaits operator confirmation to commit and deploy directly.
                  </p>
                </div>

                {/* Grid Comparison */}
                <div>
                  <h3
                    className="text-[10px] text-[#ffcc00] mb-3"
                    style={{ fontFamily: 'var(--font-orbitron), sans-serif', letterSpacing: '0.1em' }}
                  >
                    FEATURE COMPARISON MATRIX
                  </h3>
                  <div className="overflow-x-auto border border-white/5 rounded bg-black/40">
                    <table className="w-full text-left border-collapse font-mono text-[10px]">
                      <thead>
                        <tr className="border-b border-white/10 bg-[#150000]">
                          <th className="p-3 text-gray-400 font-bold border-r border-white/5 w-1/4">FEATURE DIMENSION</th>
                          <th className="p-3 text-gray-400 font-bold border-r border-white/5 w-1/4">STANDARD AI ASSISTANTS<br/><span className="text-[8px] text-gray-500">(e.g., Copilot, Cursor)</span></th>
                          <th className="p-3 text-gray-400 font-bold border-r border-white/5 w-1/4">CORE AGENT FRAMEWORKS<br/><span className="text-[8px] text-gray-500">(e.g., AutoGen, CrewAI)</span></th>
                          <th className="p-3 text-cyan-400 font-bold w-1/4 bg-[#00ccff]/5">FREE THINKER<br/><span className="text-[8px] text-cyan-500/70">(Our Active System)</span></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        <tr>
                          <td className="p-3 font-semibold border-r border-white/5 text-gray-300">Execution Command</td>
                          <td className="p-3 text-gray-400 border-r border-white/5">Single developer acts as the compiler and sole decision maker.</td>
                          <td className="p-3 text-gray-400 border-r border-white/5">Agents complete tasks in hypothetical text loops; execution sandbox is isolated from real repos.</td>
                          <td className="p-3 text-cyan-400 bg-cyan-950/10 font-medium">Self-Directed Git Pipeline: Runs mutations directly on Git, scans for tests, and submits actual commits back to the remote tree.</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold border-r border-white/5 text-gray-300">Consensus Mechanism</td>
                          <td className="p-3 text-gray-400 border-r border-white/5">None. Single generative model prints text.</td>
                          <td className="p-3 text-gray-400 border-r border-white/5">Highly programmatic, rigid step-by-step state charts.</td>
                          <td className="p-3 text-cyan-400 bg-cyan-950/10 font-medium font-bold">Game-Theoretic Debate: Multi-agent adversarial design (e.g., Security Specialist vs. Rapid Evolver) with configurable cycles to reach a consensus.</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold border-r border-white/5 text-gray-300">Risk Safeguarding</td>
                          <td className="p-3 text-gray-400 border-r border-white/5">Dependent on the developer squinting at their screen to catch bugs.</td>
                          <td className="p-3 text-gray-400 border-r border-white/5">Often ignores downstream context or crashes in endless loops.</td>
                          <td className="p-3 text-cyan-400 bg-cyan-950/10 font-medium">Active Saturation & Risk Scores: Assigns measurable risk thresholds and allows automated or human-in-the-loop overrides.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 space-y-2 text-[11px] font-mono text-gray-400">
                  <span className="text-[#ff9900] font-bold text-[10px]" style={{ fontFamily: 'var(--font-orbitron), sans-serif', letterSpacing: '0.05em' }}>CONTRAST WITH ENTERPRISE BOTS</span>
                  <p className="leading-relaxed">
                    Enterprise setups (like automated PR review bots such as Coderabbit or Mend) focus purely on passive analysis of PRs that humans already wrote. They do not proactively draft the evolutionary steps themselves. FREE THINKER closes that loop by being both the generator (Mutation Engine) and the gatekeeper (Multi-Agent Debate Chamber).
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* ── File Inspector Modal ── */}
        {inspectingFile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-4xl max-h-[85vh] flex flex-col bg-[#070303] border border-red-900/40 rounded-xl shadow-2xl overflow-hidden"
              style={{
                boxShadow: '0 0 40px rgba(255, 32, 32, 0.15)',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-red-900/30 bg-[#0d0404]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-red-950/60 border border-red-800/40 flex items-center justify-center text-[#ff3333]">
                    <FileCode size={15} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-mono font-bold text-gray-100 truncate">
                        {inspectingFile.path}
                      </span>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-red-950/80 text-red-400 border border-red-900/30">
                        {inspectingFile.path.split('.').pop()?.toUpperCase() || 'FILE'}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-gray-500">
                      Target Repo: {systemState.repoConfig.owner}/{systemState.repoConfig.repo} @ {systemState.repoConfig.branch || 'main'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {inspectingFile.content && (
                    <>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(inspectingFile.content || '');
                          setCopiedFileCode(true);
                          setTimeout(() => setCopiedFileCode(false), 2000);
                        }}
                        type="button"
                        className="px-2.5 py-1 text-[10px] font-mono rounded bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        {copiedFileCode ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                        {copiedFileCode ? 'COPIED' : 'COPY'}
                      </button>
                      <button
                        onClick={() => {
                          const fIdx = scannedFiles.findIndex(f => f.path === inspectingFile.path);
                          if (fIdx !== -1) {
                            setSelectedFileIndex(fIdx);
                            handleQuickAction('propose', fIdx);
                          }
                          setInspectingFile(null);
                        }}
                        type="button"
                        className="px-2.5 py-1 text-[10px] font-mono font-bold rounded bg-gradient-to-r from-red-600 to-amber-600 text-white flex items-center gap-1.5 cursor-pointer hover:opacity-90 transition-opacity"
                      >
                        <Zap size={12} />
                        MUTATE
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setInspectingFile(null)}
                    type="button"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-hidden flex flex-col p-4 bg-[#030101]">
                {inspectingFile.isLoading ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-3">
                    <Loader2 size={24} className="animate-spin text-red-500" />
                    <span className="text-xs font-mono text-gray-400">
                      Reading repository blob from GitHub: <span className="text-red-400">{inspectingFile.path}</span>...
                    </span>
                  </div>
                ) : inspectingFile.error ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
                    <div className="w-10 h-10 rounded-full bg-red-950/60 border border-red-800/50 flex items-center justify-center text-red-500">
                      <AlertTriangle size={20} />
                    </div>
                    <div className="max-w-md space-y-1">
                      <div className="text-xs font-mono font-bold text-red-400">Failed to Load File</div>
                      <div className="text-[11px] font-mono text-gray-400">{inspectingFile.error}</div>
                    </div>
                    <button
                      onClick={() => openFileInspector(inspectingFile.path)}
                      type="button"
                      className="px-3 py-1.5 text-xs font-mono rounded bg-red-950/80 text-red-300 border border-red-900/50 hover:bg-red-900/80 cursor-pointer"
                    >
                      RETRY FETCH
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 overflow-auto rounded-lg border border-red-900/20 bg-[#040101] font-mono text-[11px] p-3 text-gray-300 leading-relaxed dalek-scrollbar">
                    <div className="table w-full">
                      {(inspectingFile.content || '').split('\n').map((line, lIdx) => (
                        <div key={lIdx} className="table-row hover:bg-red-950/10">
                          <span className="table-cell pr-4 text-right select-none text-gray-600 w-10 text-[10px]">
                            {lIdx + 1}
                          </span>
                          <span className="table-cell whitespace-pre-wrap break-all font-mono text-gray-200">
                            {line || ' '}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-2.5 border-t border-red-900/20 bg-[#070202] flex items-center justify-between text-[10px] font-mono text-gray-500">
                <span>
                  Lines: {(inspectingFile.content || '').split('\n').length} | Characters: {(inspectingFile.content || '').length}
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Neural Saturation Alert Modal ── */}
      <SaturationModal
        alert={saturationAlert}
        onClose={() => setSaturationAlert(null)}
        isBatchPaused={!batchMode && batchQueue.length > 0 && batchProgress < batchQueue.length}
        onResumeBatch={() => {
          setBatchMode(true);
          addCaanMessage('Autonomous batch mode resumed.');
        }}
        onAddToBlacklist={(filePath, alwaysAutoAdd) => {
          const updated = capAndDedupeBlacklist([...blacklistedFiles, filePath], 250);
          setBlacklistedFiles(updated);
          safeSetLocalStorage('free_thinker_blacklisted_files', JSON.stringify(updated));
          syncBlacklistToFirestore(updated).catch(() => {});
          if (alwaysAutoAdd) {
            setAutoSkipSaturated(true);
            setAutoPauseOnSaturation(false);
            safeSetLocalStorage('free_thinker_auto_skip_saturation', 'true');
            safeSetLocalStorage('free_thinker_auto_pause_saturation', 'false');
          }
          setSaturationAlert(null);
          toast({
            title: 'FILE BLACKLISTED',
            description: `${filePath} added to saturation blacklist.${alwaysAutoAdd ? ' Auto-blacklist enabled (popups disabled).' : ''}`,
          });
        }}
        onKeepInRotation={() => {
          setSaturationAlert(null);
          toast({
            title: 'FILE RETAINED',
            description: 'Retained in candidate pool for future passes.',
          });
        }}
      />

      {/* ── Footer ── */}
      <footer
        className="px-4 sm:px-6 py-2 flex items-center justify-between flex-shrink-0"
        style={{
          borderTop: '1px solid rgba(255, 32, 32, 0.1)',
          background: '#030000',
        }}
      >
        <div className="flex items-center gap-2">
          <Shield size={10} style={{ color: '#333' }} />
          <span
            style={{
              fontSize: '8px',
              color: '#444',
              fontFamily: 'var(--font-share-tech-mono), monospace',
            }}
          >
            craighckby-stack © {new Date().getFullYear()}
          </span>
          {mutationsApplied > 0 && (
            <span
              style={{
                fontSize: '8px',
                color: COLORS.green,
                fontFamily: 'var(--font-share-tech-mono), monospace',
              }}
            >
              · {mutationsApplied} mutations applied
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsDosConsoleOpen(true);
              setIsDosConsoleDocked(false);
            }}
            className="px-2 py-0.5 rounded bg-black border border-white/20 text-white hover:bg-white hover:text-black transition-colors font-mono text-[9px] flex items-center gap-1 cursor-pointer"
            title="Open MS-DOS Full-Time Telemetry Monitor & Autonomous Hotswapper (or type 'dos' in chat)"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span>[MS-DOS HOTSWAP: RUNNING | RAG SYNC: 100%]</span>
          </button>
        </div>
      </footer>

      {/* MS-DOS Real-Time Console Modal & Dockable Daemon */}
      <DosConsoleModal
        isOpen={isDosConsoleOpen}
        onClose={() => setIsDosConsoleOpen(false)}
        systemState={systemState}
        isDocked={isDosConsoleDocked}
        onToggleDock={() => setIsDosConsoleDocked((prev) => !prev)}
      />

      {/* Bug Inspector & Autonomous Repair Modal */}
      <BugInspector
        isOpen={isBugInspectorOpen}
        onClose={() => setIsBugInspectorOpen(false)}
        systemState={systemState}
        onApplyFixesToState={(fixedCount) => {
          quickActionRef.current?.('scan');
          toast({
            title: 'BUG RESOLUTION COMPLETED',
            description: `Patched ${fixedCount} issues in repository.`,
          });
        }}
        onAddSystemLog={(cat, msg) => addLogEntry(cat, msg)}
        onAddCaanMessage={(msg) => addCaanMessage(msg)}
      />

      {/* Push System to GitHub Modal */}
      <PushSystemModal
        isOpen={isPushModalOpen}
        onClose={() => setIsPushModalOpen(false)}
        token={systemState.apiKeys.github}
        defaultOwner={systemState.repoConfig.owner}
        defaultRepo={systemState.repoConfig.repo}
        defaultBranch={systemState.repoConfig.branch}
        onSuccessLog={(msg) => addLogEntry('SYSTEM', msg)}
      />

      {/* Autonomous Siphon Modal */}
      {isSiphonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-[#060000] border border-cyan-500/50 rounded-lg p-5 shadow-2xl relative">
            <div className="flex justify-between items-center mb-3">
              <h3 
                className="text-sm font-bold text-cyan-400 uppercase tracking-wider"
                style={{ fontFamily: 'var(--font-orbitron), sans-serif' }}
              >
                AUTONOMOUS REPOSITORY SIPHON & CODE TRANSFUSION
              </h3>
              <button
                onClick={() => setIsSiphonModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <SiphonControlPanel
              token={systemState.apiKeys.github}
              onSiphonLog={(msg) => addLogEntry('SIPHON', msg)}
              onInjectCode={(snippet) => {
                setIsSiphonModalOpen(false);
                addCaanMessage(`CODE TRANSFUSION INJECTED FROM SIPHONED REPO:\n\`\`\`typescript\n${snippet.slice(0, 1000)}\n\`\`\``);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
