/* DARLEK CAAN RAG SYNTHESIS - Autonomous Generation G-113 [2026-09-20T05:48:45.097Z] */
/**
 * DARLEK CANN ARCHITECTURAL HEADER
 * File: src/components/ChatPanel.tsx
 * Role: Core system component participating in autonomous cognitive evolution cycles.
 * Architecture: Type-safe modular unit with resilient state interfaces.
 */


import { useState, useRef, useEffect, useCallback, type ChangeEvent, type KeyboardEvent } from 'react';
import { Send, Loader2, GitBranch, RefreshCw, Paperclip, File, X, Languages, Bug } from 'lucide-react';
import type { Message, SystemState, BranchInfo } from '@/lib/types';
import { SETUP_STEPS, COLORS } from '@/lib/constants';
import { ALL_SUPPORTED_LANGUAGES, changeDisplayLanguage, getCurrentLanguage } from '@/lib/languages';
import ChatMessage from './ChatMessage';
import BugInspector, { BugKeywordPromptBanner } from './BugInspector';

interface AttachedFile {
  name: string;
  content: string;
}

interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (content: string, fileAttachment?: AttachedFile) => void;
  isLoading: boolean;
  systemState: SystemState;
  onTestConnection: (provider: string, key: string) => void;
  onUpdateKey: (key: string, value: string) => void;
  onUpdateRepoConfig: (field: 'owner' | 'repo' | 'branch', value: string) => void;
  branches: BranchInfo[];
  branchesLoading: boolean;
  onFetchBranches: () => void;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB bounds check
const MAX_INPUT_LENGTH = 10000;

export default function ChatPanel({
  messages,
  onSendMessage,
  isLoading,
  systemState,
  onTestConnection,
  onUpdateKey,
  onUpdateRepoConfig,
  branches,
  branchesLoading,
  onFetchBranches,
}: ChatPanelProps) {
  const [input, setInput] = useState<string>('');
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('english');
  const [isBugInspectorOpen, setIsBugInspectorOpen] = useState<boolean>(false);

  useEffect(() => {
    setSelectedLanguage(getCurrentLanguage());
  }, []);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || '');
      reader.readAsText(file);
    });
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      alert('File size exceeds the 5MB safety limit.');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setIsExtracting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/extract-text', {
        method: 'POST',
        body: formData,
      });
      
      const contentType = response.headers.get('content-type') || '';
      if (response.ok && contentType.includes('application/json')) {
        const extractedData = await response.json();
        if (extractedData?.success && typeof extractedData.text === 'string') {
          setAttachedFile({ name: file.name, content: extractedData.text.slice(0, MAX_INPUT_LENGTH) });
          return;
        }
      }
      
      const fallbackContent = await readFileAsText(file);
      setAttachedFile({ name: file.name, content: fallbackContent.slice(0, MAX_INPUT_LENGTH) });
    } catch (error) {
      console.error('File extraction failed:', error);
      const fallbackContent = await readFileAsText(file);
      setAttachedFile({ name: file.name, content: fallbackContent.slice(0, MAX_INPUT_LENGTH) });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSend = useCallback(() => {
    const trimmedInput = input.trim().slice(0, MAX_INPUT_LENGTH);
    if ((trimmedInput || attachedFile) && !isLoading) {
      onSendMessage(trimmedInput, attachedFile ?? undefined);
      setInput('');
      setAttachedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [input, attachedFile, isLoading, onSendMessage]);

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const currentStep = systemState?.currentStep ?? 0;
  const setupStep = currentStep < SETUP_STEPS.length ? SETUP_STEPS[currentStep] : null;

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'testing': return 'TESTING...';
      case 'connected': return 'ONLINE';
      case 'error': return 'FAILED';
      default: return 'IDLE';
    }
  };

  const handleBranchSelect = useCallback((branchName: string) => {
    const sanitizedBranch = branchName.trim().slice(0, 255);
    onUpdateRepoConfig('branch', sanitizedBranch);
    onSendMessage(`branch: ${sanitizedBranch}`);
  }, [onUpdateRepoConfig, onSendMessage]);

  const renderSetupInput = () => {
    if (!setupStep || systemState.setupComplete) return null;

    const { id: stepId } = setupStep;

    if (stepId === 'repo') {
      const handleRepoSubmit = () => {
        if (systemState.repoConfig.owner && systemState.repoConfig.repo) {
          onSendMessage(`repo: ${systemState.repoConfig.owner}/${systemState.repoConfig.repo}`);
        }
      };

      return (
        <div className="space-y-3 p-4 flex-shrink-0" style={{ borderTop: `1px solid ${COLORS.panelBorder}` }}>
          <input
            dir="ltr"
            type="text"
            placeholder={setupStep.placeholder}
            defaultValue="craighckby-stack/Free-Thinker"
            maxLength={255}
            className="dalek-input w-full px-4 py-3 text-sm"
            style={{ unicodeBidi: 'normal', direction: 'ltr' }}
            onChange={(e) => {
              const val = e.target.value.slice(0, 255);
              const [owner = '', ...repoParts] = val.split('/');
              onUpdateRepoConfig('owner', owner.trim());
              onUpdateRepoConfig('repo', repoParts.join('/').trim());
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRepoSubmit();
            }}
          />
          <button
            onClick={handleRepoSubmit}
            disabled={!systemState.repoConfig.owner || !systemState.repoConfig.repo}
            className="dalek-btn dalek-btn-primary px-6 py-2 text-xs w-full"
          >
            SET TARGET REPOSITORY
          </button>
        </div>
      );
    }

    if (stepId === 'branch') {
      return (
        <div className="space-y-3 p-4 flex-shrink-0" style={{ borderTop: `1px solid ${COLORS.panelBorder}` }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitBranch size={14} style={{ color: COLORS.dalekRed }} />
              <span
                style={{
                  fontFamily: 'var(--font-orbitron), sans-serif',
                  fontSize: '10px',
                  letterSpacing: '0.1em',
                  color: COLORS.pureWhite,
                }}
              >
                SELECT BRANCH
              </span>
            </div>
            <button
              onClick={onFetchBranches}
              disabled={branchesLoading}
              className="flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-all"
              style={{
                color: COLORS.pureWhite,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                cursor: branchesLoading ? 'not-allowed' : 'pointer',
                opacity: branchesLoading ? 0.5 : 1,
              }}
              title="Refresh branch list"
            >
              <RefreshCw size={11} className={branchesLoading ? 'animate-spin' : ''} />
              REFRESH
            </button>
          </div>

          {branchesLoading ? (
            <div className="flex items-center justify-center gap-2 py-4">
              <Loader2 size={14} className="animate-spin" style={{ color: COLORS.dalekRed }} />
              <span style={{ color: COLORS.textMuted, fontSize: '11px', fontFamily: 'var(--font-share-tech-mono), monospace' }}>
                Scanning branches...
              </span>
            </div>
          ) : branches.length > 0 ? (
            <div className="space-y-1.5 max-h-40 overflow-y-auto dalek-scrollbar pr-1">
              {branches.map((branch) => {
                const isSelected = systemState.repoConfig.branch === branch.name;
                return (
                  <button
                    key={branch.name}
                    onClick={() => handleBranchSelect(branch.name)}
                    className="w-full text-left px-3 py-2.5 rounded flex items-center justify-between group transition-all"
                    style={{
                      background: isSelected ? 'rgba(255, 32, 32, 0.15)' : 'rgba(20, 10, 10, 0.6)',
                      border: `1px solid ${isSelected ? 'rgba(255, 32, 32, 0.4)' : 'rgba(255, 32, 32, 0.1)'}`,
                      cursor: 'pointer',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <GitBranch
                        size={12}
                        style={{
                          color: branch.default ? COLORS.pureWhite : isSelected ? COLORS.dalekRed : COLORS.textMuted,
                        }}
                      />
                      <span
                        style={{
                          fontFamily: 'var(--font-share-tech-mono), monospace',
                          fontSize: '12px',
                          color: '#ffffff',
                        }}
                      >
                        {branch.name}
                      </span>
                    </div>
                    {branch.default && (
                      <span
                        style={{
                          fontFamily: 'var(--font-orbitron), sans-serif',
                          fontSize: '8px',
                          letterSpacing: '0.08em',
                          color: COLORS.pureWhite,
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          padding: '1px 6px',
                          borderRadius: '2px',
                        }}
                      >
                        DEFAULT
                      </span>
                    )}
                    {isSelected && !branch.default && (
                      <span
                        style={{
                          fontFamily: 'var(--font-orbitron), sans-serif',
                          fontSize: '8px',
                          letterSpacing: '0.08em',
                          color: COLORS.dalekRed,
                          background: 'rgba(255, 32, 32, 0.1)',
                          border: '1px solid rgba(255, 32, 32, 0.2)',
                          padding: '1px 6px',
                          borderRadius: '2px',
                        }}
                      >
                        SELECTED
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-3">
              <span style={{ color: COLORS.textMuted, fontSize: '11px', fontFamily: 'var(--font-share-tech-mono), monospace' }}>
                No branches found. Check repository access.
              </span>
            </div>
          )}

          <div
            className="pt-2"
            style={{ borderTop: `1px solid ${COLORS.panelBorder}` }}
          >
            <span style={{ color: COLORS.textMuted, fontSize: '9px', fontFamily: 'var(--font-orbitron), sans-serif', letterSpacing: '0.1em' }}>
              OR ENTER CUSTOM BRANCH:
            </span>
            <div className="flex items-center gap-2 mt-1.5">
              <input
                dir="ltr"
                type="text"
                placeholder="branch name..."
                defaultValue="main"
                maxLength={255}
                className="dalek-input flex-1 px-3 py-2 text-xs"
                style={{ unicodeBidi: 'normal', direction: 'ltr' }}
                onChange={(e) => onUpdateRepoConfig('branch', e.target.value.slice(0, 255))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const branchVal = e.currentTarget.value.trim().slice(0, 255) || 'main';
                    onSendMessage(`branch: ${branchVal}`);
                  }
                }}
              />
              <button
                onClick={() => onSendMessage(`branch: ${systemState?.repoConfig?.branch?.slice(0, 255) || 'main'}`)}
                className="dalek-btn dalek-btn-primary px-3 py-2 text-xs"
              >
                SET
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (stepId === 'github') {
      const currentValue = systemState.apiKeys.github;
      const status = systemState.connectionStatus.github;

      return (
        <div className="space-y-3 p-4 flex-shrink-0" style={{ borderTop: `1px solid ${COLORS.panelBorder}` }}>
          <div
            className="px-3 py-2 rounded text-xs mb-2"
            style={{
              color: COLORS.pureWhite,
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            Free Thinker Engine: ONLINE (built-in) | No external APIs
          </div>
          <div className="flex items-center gap-2">
            <input
              dir="ltr"
              type="password"
              placeholder={setupStep.placeholder}
              maxLength={512}
              className="dalek-input flex-1 px-4 py-3 text-sm"
              style={{ unicodeBidi: 'normal', direction: 'ltr' }}
              value={currentValue}
              onChange={(e) => onUpdateKey('github', e.target.value.slice(0, 512))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && currentValue.trim()) {
                  onTestConnection('github', currentValue);
                }
              }}
            />
            <button
              onClick={() => onTestConnection('github', currentValue)}
              disabled={!currentValue.trim() || status === 'testing'}
              className="dalek-btn dalek-btn-primary px-4 py-3 text-xs whitespace-nowrap"
            >
              {status === 'testing' ? (
                <span className="flex items-center gap-1">
                  <Loader2 size={12} className="animate-spin" />
                  TESTING
                </span>
              ) : (
                <span>CONNECT</span>
              )}
            </button>
          </div>
          {status !== 'idle' && (
            <div
              className="px-3 py-2 rounded text-xs"
              style={{
                color: status === 'connected' ? COLORS.pureWhite : COLORS.dalekRed,
                background: status === 'connected' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 32, 32, 0.06)',
                border: `1px solid ${status === 'connected' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 32, 32, 0.15)'}`,
              }}
            >
              {getStatusText(status)} — GitHub {status === 'connected' ? 'connected.' : 'connection failed. Try again.'}
            </div>
          )}
          {status === 'connected' && (
            <button
              onClick={() => onSendMessage('github: configured')}
              className="dalek-btn dalek-btn-secondary px-4 py-2 text-xs w-full"
            >
              CONTINUE
            </button>
          )}
        </div>
      );
    }

    if (stepId === 'language') {
      return (
        <div className="space-y-3 p-4 flex-shrink-0" style={{ borderTop: `1px solid ${COLORS.panelBorder}` }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Languages size={14} style={{ color: COLORS.dalekRed }} />
              <span
                style={{
                  fontFamily: 'var(--font-orbitron), sans-serif',
                  fontSize: '10px',
                  letterSpacing: '0.1em',
                  color: COLORS.pureWhite,
                }}
              >
                INTERFACE DISPLAY LANGUAGE
              </span>
            </div>
            <span
              style={{
                fontFamily: 'var(--font-orbitron), sans-serif',
                fontSize: '8px',
                letterSpacing: '0.08em',
                color: COLORS.pureWhite,
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                padding: '1px 6px',
                borderRadius: '2px',
              }}
            >
              130+ WORLD LOCALES
            </span>
          </div>

          <div className="space-y-1.5">
            <select
              value={selectedLanguage}
              onChange={(e) => {
                const lang = e.target.value;
                setSelectedLanguage(lang);
                changeDisplayLanguage(lang);
              }}
              className="dalek-input w-full px-3 py-2 text-xs cursor-pointer bg-black text-gray-200 border border-neutral-800 rounded font-mono"
            >
              <optgroup label="POPULAR LANGUAGES">
                {ALL_SUPPORTED_LANGUAGES.slice(0, 20).map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} {l.nativeName && l.nativeName !== l.name ? `(${l.nativeName})` : ''}
                  </option>
                ))}
              </optgroup>
              <optgroup label="ALL WORLD LANGUAGES (130+)">
                {ALL_SUPPORTED_LANGUAGES.slice(20).map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} {l.nativeName && l.nativeName !== l.name ? `(${l.nativeName})` : ''}
                  </option>
                ))}
              </optgroup>
            </select>
            <div className="text-[9px] text-gray-500 font-mono text-center pt-0.5">
              Translation by xnx3/translate
            </div>
          </div>

          <button
            onClick={() => onSendMessage(`language: ${selectedLanguage}`)}
            className="dalek-btn dalek-btn-primary px-4 py-2 text-xs w-full cursor-pointer"
          >
            CONFIRM LANGUAGE & CONTINUE
          </button>
        </div>
      );
    }

    if (stepId === 'llm-keys') {
      const geminiStatus = systemState.connectionStatus.gemini;
      const geminiKey = systemState.apiKeys.gemini ?? '';
      const isGeoblocked = Boolean((systemState as unknown as Record<string, unknown>).geminiGeoblocked);

      const handleGeminiSubmit = (val: string) => {
        if (val.trim()) {
          onTestConnection('gemini', val);
        } else {
          onSendMessage('skip');
        }
      };

      return (
        <div className="space-y-3 p-4 flex-shrink-0" style={{ borderTop: `1px solid ${COLORS.panelBorder}` }}>
          <div
            className="px-3 py-2 rounded text-xs mb-2"
            style={{
              color: geminiStatus === 'connected' ? COLORS.green : COLORS.gold,
              background: geminiStatus === 'connected' ? 'rgba(0, 255, 136, 0.05)' : 'rgba(212, 160, 23, 0.05)',
              border: `1px solid ${geminiStatus === 'connected' ? 'rgba(0, 255, 136, 0.1)' : 'rgba(212, 160, 23, 0.1)'}`,
            }}
          >
            {geminiStatus === 'connected'
              ? 'Gemini connected — external LLM augmentation active.'
              : isGeoblocked
                ? 'Gemini geoblocked. Free Thinker Brain active.'
                : geminiKey
                  ? 'Gemini key detected. Test to verify connection.'
                  : 'Free Thinker engine is ACTIVE. Gemini is optional external augmentation.'}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span
                style={{
                  fontFamily: 'var(--font-orbitron), sans-serif',
                  fontSize: '9px',
                  letterSpacing: '0.1em',
                  color: '#4285f4',
                }}
              >
                GEMINI API KEY (OPTIONAL)
              </span>
              {geminiStatus === 'connected' && (
                <span
                  style={{
                    fontSize: '8px',
                    color: COLORS.green,
                    fontFamily: 'var(--font-share-tech-mono), monospace',
                  }}
                >
                  ONLINE
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                dir="ltr"
                type="password"
                placeholder="AIza... (or leave blank for Free Thinker Brain)"
                maxLength={512}
                className="dalek-input flex-1 px-3 py-2 text-xs"
                value={geminiKey}
                onChange={(e) => onUpdateKey('gemini', e.target.value.slice(0, 512))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleGeminiSubmit(e.currentTarget.value);
                  }
                }}
                style={{
                  unicodeBidi: 'normal',
                  direction: 'ltr',
                  borderColor: geminiStatus === 'connected'
                    ? `${COLORS.green}30`
                    : geminiStatus === 'error'
                      ? `${COLORS.dalekRed}30`
                      : undefined,
                }}
              />
              <button
                onClick={() => handleGeminiSubmit(geminiKey)}
                disabled={geminiStatus === 'testing'}
                className="px-3 py-2 text-xs transition-all whitespace-nowrap"
                style={{
                  color: '#4285f4',
                  background: 'rgba(66, 133, 244, 0.08)',
                  border: '1px solid rgba(66, 133, 244, 0.25)',
                  cursor: geminiStatus !== 'testing' ? 'pointer' : 'not-allowed',
                  opacity: geminiStatus !== 'testing' ? 1 : 0.4,
                  fontFamily: 'var(--font-orbitron), sans-serif',
                  fontSize: '8px',
                  letterSpacing: '0.08em',
                }}
              >
                {geminiStatus === 'testing' ? (
                  <span className="flex items-center gap-1">
                    <Loader2 size={10} className="animate-spin" />
                    TEST
                  </span>
                ) : geminiStatus === 'connected' ? (
                  'RE-TEST'
                ) : (
                  'TEST'
                )}
              </button>
            </div>
            {geminiStatus === 'error' && !isGeoblocked && (
              <div
                className="px-2 py-1 rounded text-xs"
                style={{ color: COLORS.dalekRed, fontSize: '9px' }}
              >
                Connection failed. Check your key.
              </div>
            )}
            {isGeoblocked && geminiStatus === 'error' && (
              <div
                className="px-2 py-1 rounded text-xs"
                style={{ color: COLORS.gold, fontSize: '9px' }}
              >
                Region blocked. Free Thinker Brain active.
              </div>
            )}
          </div>

          <button
            onClick={() => onSendMessage('skip')}
            className="dalek-btn dalek-btn-secondary px-6 py-2 text-xs w-full mt-2"
          >
            CONTINUE WITH FREE THINKER BRAIN
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <div
      className="flex flex-col h-full"
      style={{
        background: `linear-gradient(180deg, rgba(5,0,0,0.98) 0%, rgba(0,0,0,0.98) 100%)`,
      }}
    >
      {/* Chat header */}
      <div
        className="px-4 py-3 flex items-center justify-between flex-shrink-0"
        style={{
          borderBottom: `1px solid rgba(255, 32, 32, 0.15)`,
          background: 'linear-gradient(180deg, rgba(17, 0, 0, 0.6) 0%, transparent 100%)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full dalek-eye-stalk flex-shrink-0"
            style={{ background: COLORS.dalekRed }}
          />
          <span
            style={{
              fontFamily: 'var(--font-orbitron), sans-serif',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.15em',
              color: COLORS.dalekRed,
            }}
          >
            COMMUNICATION CHANNEL
          </span>
        </div>
        <div className="flex items-center gap-2">
          {systemState.setupComplete && (
            <button
              onClick={() => setIsBugInspectorOpen(true)}
              className="px-2.5 py-1 rounded bg-[#200a0a] hover:bg-[#300f0f] border border-red-700/60 text-red-300 hover:text-red-200 text-[10px] font-mono flex items-center gap-1.5 transition-all shadow-sm group"
              title="Open Bug Inspector & Autonomous Repair"
            >
              <Bug size={12} className="text-red-400 group-hover:scale-110 transition-transform" />
              <span>BUG INSPECTOR</span>
            </button>
          )}
          <span
            style={{
              fontFamily: 'var(--font-orbitron), sans-serif',
              fontSize: '10px',
              color: COLORS.textMuted,
            }}
          >
            {messages.length} MSGS
          </span>
        </div>
      </div>

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto dalek-scrollbar p-4 space-y-3 min-h-0">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {isLoading && (
          <div className="message-animate flex justify-start">
            <div className="chat-caan rounded-lg p-3 mr-12">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0 pulse-red"
                  style={{ background: COLORS.dalekRed }}
                />
                <span
                  style={{
                    fontFamily: 'var(--font-orbitron), sans-serif',
                    fontSize: '9px',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    color: COLORS.dalekRed,
                  }}
                >
                  FREE THINKER
                </span>
              </div>
              <div className="flex items-center gap-1.5 py-1">
                <div className="typing-dot w-2 h-2 rounded-full" style={{ background: COLORS.dalekRed }} />
                <div className="typing-dot w-2 h-2 rounded-full" style={{ background: COLORS.dalekRed }} />
                <div className="typing-dot w-2 h-2 rounded-full" style={{ background: COLORS.dalekRed }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {!systemState.setupComplete && renderSetupInput()}

      {systemState.setupComplete && (
        <div 
          className="p-3 flex-shrink-0 pb-safe sm:pb-3" 
          style={{ 
            borderTop: `1px solid ${COLORS.panelBorder}`,
            paddingBottom: 'max(env(safe-area-inset-bottom), 12px)'
          }}
        >
          {/* Proactive Bug Keyword Detector Banner */}
          {!attachedFile && (
            <BugKeywordPromptBanner
              inputText={input}
              onOpenInspector={() => setIsBugInspectorOpen(true)}
              onTriggerFileAttachment={() => fileInputRef.current?.click()}
            />
          )}

          {attachedFile && (
            <div className="mb-2 px-3 py-2 bg-[#120808] border border-[#a21f1f]/30 rounded flex items-center justify-between text-xs font-mono text-stone-300">
              <div className="flex items-center gap-1.5 truncate">
                <File size={13} style={{ color: COLORS.dalekRed }} />
                <span className="truncate">{attachedFile.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsBugInspectorOpen(true)}
                  className="text-[11px] text-red-400 hover:text-red-300 px-2 py-0.5 rounded bg-red-950/60 border border-red-800/40"
                  title="Inspect in Bug Inspector"
                >
                  Inspect in Modal
                </button>
                <button 
                  onClick={() => {
                    setAttachedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-gray-400 hover:text-red-400 p-0.5 rounded cursor-pointer transition-colors"
                >
                  <X size={13} />
                </button>
              </div>
            </div>
          )}
          <div className="flex items-end gap-2">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              style={{ display: 'none' }} 
              accept=".txt,.json,.md,.html,.xml,.yml,.yaml,.ts,.tsx,.js,.jsx,.pdf,.doc,.docx" 
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || isExtracting}
              title="Attach Blueprint Document"
              className="dalek-btn p-3 flex-shrink-0 flex items-center justify-center hover:bg-stone-900 transition-colors"
              style={{ 
                minHeight: '42px', 
                minWidth: '42px',
                border: `1px solid ${COLORS.panelBorder}`,
                color: attachedFile ? COLORS.dalekRed : COLORS.textMuted
              }}
            >
              {isExtracting ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
            </button>
            <textarea
              ref={textareaRef}
              dir="ltr"
              value={input}
              maxLength={MAX_INPUT_LENGTH}
              onChange={(e) => setInput(e.target.value.slice(0, MAX_INPUT_LENGTH))}
              onFocus={() => {
                setTimeout(() => {
                  if (textareaRef.current) {
                    textareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                  }
                  if (scrollRef.current) {
                    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                  }
                }, 300);
              }}
              onKeyDown={handleKeyDown}
              placeholder={
                attachedFile
                  ? attachedFile.name.toLowerCase().includes('bug')
                    ? "Bug specification attached! Type 'bugs' to auto-connect & fix repository bugs..."
                    : "Specification attached... Type 'create [name]' to compile or 'bugs' to repair!"
                  : "Type a command (e.g. 'bugs', 'scan', 'propose', 'help')..."
              }
              rows={1}
              className="dalek-input flex-1 px-4 py-3 text-sm resize-none"
              style={{ 
                minHeight: '42px', 
                maxHeight: '120px',
                direction: 'ltr',
                textAlign: 'left',
                unicodeBidi: 'normal'
              }}
            />
            <button
              onClick={handleSend}
              disabled={(!input.trim() && !attachedFile) || isLoading}
              className="dalek-btn dalek-btn-primary px-4 py-3"
              style={{ minWidth: '42px' }}
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
          <div className="mt-1.5 text-[10px] text-gray-500 font-mono text-center select-none w-full flex flex-wrap justify-center gap-2 sm:gap-3">
            <span>Type <span className="text-red-400 font-semibold font-sans">help</span> for commands.</span>
            <span>•</span>
            <span>Attach bug doc & type <strong className="text-red-400 font-mono">bugs</strong> to auto-fix system!</span>
            <span>•</span>
            <span>Attach spec & type <strong className="text-red-400 font-mono">create [name]</strong> to compile repo.</span>
          </div>
        </div>
      )}

      {/* Bug Inspector Modal */}
      <BugInspector
        isOpen={isBugInspectorOpen}
        onClose={() => setIsBugInspectorOpen(false)}
        systemState={systemState}
        initialKeyword={input}
        initialAttachedFile={attachedFile}
        onApplyFixesToState={() => {
          onSendMessage('scan');
        }}
        onAddCaanMessage={(msg) => {
          // If needed, message handling is triggered
        }}
      />
    </div>
  );
}

// Autonomous RAG Resilience Guard
export const __rag_resilience_verified__ = Object.freeze({
  generation: 111,
  timestamp: "2026-09-20T03:44:19.665Z",
  ragEngine: "DARLEK_CAAN_HYBRID_RAG"
});
