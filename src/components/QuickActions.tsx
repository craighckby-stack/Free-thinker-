/* DARLEK CAAN RAG SYNTHESIS - Autonomous Generation G-130 [2026-09-20T05:55:34.162Z] */
/**
 * DARLEK CANN ARCHITECTURAL HEADER
 * File: src/components/QuickActions.tsx
 * Role: Core system component participating in autonomous cognitive evolution cycles.
 * Architecture: Type-safe modular unit with resilient state interfaces.
 */

import React, { memo, useCallback, useMemo } from 'react';
import {
  Search,
  FileCode,
  Dna,
  Heart,
  Eye,
  Users,
  Upload,
  Rocket,
  ListChecks,
  CheckCircle2,
  RotateCcw,
  Radio,
  Undo2,
  GitCommit,
  Languages,
  Sparkles,
  ShieldAlert,
  Ban,
  Trash2,
  Bug
} from 'lucide-react';
import { COLORS } from '@/lib/constants';
import { ALL_SUPPORTED_LANGUAGES, changeDisplayLanguage, getCurrentLanguage } from '@/lib/languages';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type ActionStatus = 'idle' | 'pushing' | 'deploying' | 'rebooting' | 'undoing' | 'committing' | 'success' | 'error';
export type RiskLevel = 'low' | 'medium' | 'high' | 'hallucinate';

export interface QuickActionsProps {
  readonly onAction: (actionId: string) => void;
  readonly disabled: boolean;
  readonly pushStatus?: 'idle' | 'pushing' | 'success' | 'error';
  readonly deployStatus?: 'idle' | 'deploying' | 'success' | 'error';
  readonly rebootStatus?: 'idle' | 'rebooting' | 'success' | 'error';
  readonly undoStatus?: 'idle' | 'undoing' | 'success' | 'error';
  readonly bulkCommitStatus?: 'idle' | 'committing' | 'success' | 'error';
  readonly batchMode?: boolean;
  readonly autoApprove?: boolean;
  readonly onToggleAutoApprove?: () => void;
  readonly autoApproveRisk?: RiskLevel;
  readonly onAutoApproveRiskChange?: (risk: RiskLevel) => void;
  readonly backupToBranch?: boolean;
  readonly onToggleBackupToBranch?: () => void;
  readonly autoDebate?: boolean;
  readonly onToggleAutoDebate?: () => void;
  readonly orchestraActive?: boolean;
  readonly cycleAmount?: number;
  readonly onCycleAmountChange?: (amount: number) => void;
  readonly onEngageLazyAssCycle?: () => void;
  readonly hallucinationLevel?: number;
  readonly onHallucinationLevelChange?: (level: number) => void;
  readonly saturationLevel?: number;
  readonly onSaturationLevelChange?: (level: number) => void;
  readonly autoPauseOnSaturation?: boolean;
  readonly onToggleAutoPauseOnSaturation?: () => void;
  readonly autoSkipSaturated?: boolean;
  readonly onToggleAutoSkipSaturated?: () => void;
}

interface ActionDefinition {
  readonly id: string;
  readonly label: string;
  readonly icon: React.ComponentType<{ readonly size?: number; readonly className?: string }>;
  readonly color: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const QUICK_ACTION_REGISTRY: ActionDefinition[] = [
  { id: 'scan', label: 'SCAN REPOSITORY', icon: Search, color: COLORS.cyan },
  { id: 'bugs', label: 'BUG INSPECTOR', icon: Bug, color: '#ff0033' },
  { id: 'analyze', label: 'ANALYZE FILE', icon: FileCode, color: COLORS.gold },
  { id: 'propose', label: 'PROPOSE MUTATION', icon: Dna, color: COLORS.purple },
  { id: 'propose-all', label: 'SELECT ALL', icon: ListChecks, color: '#00ccff' },
  { id: 'bulk-commit', label: 'BULK COMMIT', icon: GitCommit, color: '#33ffaa' },
  { id: 'create-file', label: 'CREATE FILE', icon: FileCode, color: COLORS.green },
  { id: 'recalibrate-dna', label: 'RECALIBRATE DNA', icon: Dna, color: '#00ffaa' },
  { id: 'resume-save', label: 'RESUME PENDING SAVE', icon: RotateCcw, color: '#ffaa00' },
  { id: 'health', label: 'HEALTH CHECK', icon: Heart, color: COLORS.dalekRed },
  { id: 'saturation', label: 'VIEW SATURATION', icon: Eye, color: COLORS.electricBlue },
  { id: 'debate', label: 'DEBATE CHAMBER', icon: Users, color: COLORS.purple },
  { id: 'orchestra', label: 'ORCHESTRA', icon: Radio, color: COLORS.gold },
  { id: 'siphon', label: 'AUTO-SIPHON REPOS', icon: Dna, color: '#00e5ff' },
  { id: 'push-enhancements', label: 'PUSH SYSTEM TO GITHUB', icon: Upload, color: COLORS.green },
  { id: 'deploy-new-repo', label: 'DEPLOY NEW REPO', icon: Rocket, color: '#ff6600' },
  { id: 'undo-mutation', label: 'UNDO MUTATION', icon: Undo2, color: '#ff3366' },
  { id: 'ingest-archaeology', label: 'INGEST ARCHAEOLOGY', icon: FileCode, color: '#00ffff' },
  { id: 'sync-rag-to-github', label: 'AUTO-STORE RAG TO GITHUB', icon: Upload, color: '#00ffcc' },
  { id: 'empty-firebase', label: 'EMPTY FIREBASE', icon: Trash2, color: '#ff0055' },
  { id: 'reboot-system', label: 'REBOOT SYSTEM', icon: RotateCcw, color: '#ff00ff' },
];

const PRESET_CYCLES = [1, 5, 10] as const;
const RISK_LEVELS: RiskLevel[] = ['low', 'medium', 'high', 'hallucinate'];
const CUSTOM_CYCLE_VALUES = [2, 3, 4, 15, 20, 50, 100] as const;

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface ControlToggleProps {
  readonly active: boolean;
  readonly activeColor: string;
  readonly label: string;
  readonly icon: React.ReactNode;
  readonly onToggle: () => void;
  readonly title: string;
}

const ControlToggle = memo(function ControlToggle({ 
  active, 
  activeColor, 
  label, 
  icon, 
  onToggle, 
  title 
}: ControlToggleProps) {
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle();
  }, [onToggle]);

  const toggleStyle = useMemo(() => ({
    fontFamily: 'var(--font-orbitron), sans-serif',
    fontSize: '7px',
    letterSpacing: '0.1em',
    color: active ? activeColor : COLORS.textMuted,
    background: active ? `${activeColor}1a` : 'transparent',
    border: `1px solid ${active ? `${activeColor}66` : 'rgba(255,255,255,0.1)'}`,
  }), [active, activeColor]);

  const indicatorTrackStyle = useMemo(() => ({
    background: active ? `${activeColor}4d` : 'rgba(255,255,255,0.1)',
  }), [active, activeColor]);

  const indicatorThumbStyle = useMemo(() => ({
    left: active ? '10px' : '2px',
    background: active ? activeColor : '#555',
    boxShadow: active ? `0 0 6px ${activeColor}80` : 'none',
  }), [active, activeColor]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex items-center gap-1.5 px-2 py-0.5 rounded-sm transition-all duration-200 cursor-pointer"
      style={toggleStyle}
      title={title}
    >
      <span style={{ opacity: active ? 1 : 0.4 }}>{icon}</span>
      <span>{label}</span>
      <div className="relative w-5 h-2.5 rounded-full transition-colors duration-200" style={indicatorTrackStyle}>
        <div className="absolute top-0.5 w-1.5 h-1.5 rounded-full transition-all duration-200" style={indicatorThumbStyle} />
      </div>
    </button>
  );
});

interface ActionButtonProps {
  readonly id: string;
  readonly label: string;
  readonly icon: React.ComponentType<{ readonly size?: number; readonly className?: string }>;
  readonly color: string;
  readonly disabled: boolean;
  readonly batchMode?: boolean;
  readonly pushStatus?: string;
  readonly deployStatus?: string;
  readonly rebootStatus?: string;
  readonly undoStatus?: string;
  readonly bulkCommitStatus?: string;
  readonly onAction: (id: string) => void;
}

const ActionButton = memo(function ActionButton({
  id,
  label,
  icon: Icon,
  color,
  disabled,
  batchMode,
  pushStatus,
  deployStatus,
  rebootStatus,
  undoStatus,
  bulkCommitStatus,
  onAction,
}: ActionButtonProps) {
  
  const { isBusy, resolvedColor, busyLabel } = useMemo(() => {
    let busy = false;
    let resColor = color;
    let bLabel = label;

    switch (id) {
      case 'push-enhancements':
        busy = pushStatus === 'pushing';
        if (pushStatus === 'success') resColor = COLORS.green;
        if (pushStatus === 'error') resColor = COLORS.dalekRed;
        if (pushStatus === 'pushing') bLabel = 'PUSHING...';
        break;
      case 'deploy-new-repo':
        busy = deployStatus === 'deploying';
        if (deployStatus === 'success') resColor = COLORS.green;
        if (deployStatus === 'error') resColor = COLORS.dalekRed;
        if (deployStatus === 'deploying') bLabel = 'DEPLOYING...';
        break;
      case 'reboot-system':
        busy = rebootStatus === 'rebooting';
        if (rebootStatus === 'success') resColor = COLORS.green;
        if (rebootStatus === 'error') resColor = COLORS.dalekRed;
        if (rebootStatus === 'rebooting') bLabel = 'REBOOTING...';
        break;
      case 'undo-mutation':
        busy = undoStatus === 'undoing';
        if (undoStatus === 'success') resColor = COLORS.green;
        if (undoStatus === 'error') resColor = COLORS.dalekRed;
        if (undoStatus === 'undoing') bLabel = 'UNDOING...';
        break;
      case 'bulk-commit':
        busy = bulkCommitStatus === 'committing';
        if (bulkCommitStatus === 'success') resColor = COLORS.green;
        if (bulkCommitStatus === 'error') resColor = COLORS.dalekRed;
        if (bulkCommitStatus === 'committing') bLabel = 'COMMITTING...';
        break;
      case 'propose-all':
        if (batchMode) resColor = '#00ccff';
        break;
    }

    return { isBusy: busy, resolvedColor: resColor, busyLabel: bLabel };
  }, [id, label, color, batchMode, pushStatus, deployStatus, rebootStatus, undoStatus, bulkCommitStatus]);

  const isActionDisabled = disabled || isBusy;
  const isProposeAllActiveBatch = id === 'propose-all' && batchMode;

  const handleClick = useCallback(() => {
    onAction(id);
  }, [onAction, id]);

  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isActionDisabled) {
      e.currentTarget.style.background = `${resolvedColor}15`;
      e.currentTarget.style.boxShadow = `0 0 10px ${resolvedColor}20, inset 0 0 20px ${resolvedColor}05`;
      e.currentTarget.style.borderColor = `${resolvedColor}50`;
    }
  }, [isActionDisabled, resolvedColor]);

  const handleMouseLeave = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isActionDisabled) {
      e.currentTarget.style.background = `${resolvedColor}06`;
      e.currentTarget.style.boxShadow = isProposeAllActiveBatch ? '0 0 12px rgba(0, 204, 255, 0.2)' : 'none';
      e.currentTarget.style.borderColor = isProposeAllActiveBatch ? 'rgba(0, 204, 255, 0.4)' : `${resolvedColor}25`;
    }
  }, [isActionDisabled, resolvedColor, isProposeAllActiveBatch]);

  const buttonStyle = useMemo(() => ({
    fontFamily: 'var(--font-orbitron), sans-serif',
    fontWeight: 500,
    letterSpacing: '0.05em',
    background: isActionDisabled ? '#1a1a1a' : `${resolvedColor}06`,
    color: isActionDisabled ? '#333' : resolvedColor,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: isProposeAllActiveBatch ? 'rgba(0, 204, 255, 0.4)' : (isActionDisabled ? '#1a1a1a' : `${resolvedColor}25`),
    cursor: isActionDisabled ? 'not-allowed' : 'pointer',
    ...(isProposeAllActiveBatch ? { boxShadow: '0 0 12px rgba(0, 204, 255, 0.2)' } : {}),
  }), [isActionDisabled, resolvedColor, isProposeAllActiveBatch]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isActionDisabled}
      className="flex items-center gap-1.5 px-3 py-2 rounded-sm text-[10px] transition-all duration-200"
      style={buttonStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Icon size={11} className={isBusy ? 'animate-spin' : ''} />
      <span>&#9673;</span>
      {busyLabel}
    </button>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function QuickActions({
  onAction,
  disabled,
  pushStatus,
  deployStatus,
  rebootStatus,
  undoStatus,
  bulkCommitStatus,
  batchMode,
  autoApprove,
  onToggleAutoApprove,
  autoApproveRisk,
  onAutoApproveRiskChange,
  backupToBranch,
  onToggleBackupToBranch,
  autoDebate,
  onToggleAutoDebate,
  cycleAmount,
  onCycleAmountChange,
  onEngageLazyAssCycle,
  hallucinationLevel,
  onHallucinationLevelChange,
  saturationLevel,
  onSaturationLevelChange,
  autoPauseOnSaturation,
  onToggleAutoPauseOnSaturation,
  autoSkipSaturated,
  onToggleAutoSkipSaturated,
}: QuickActionsProps) {

  const handleLazyAssClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEngageLazyAssCycle?.();
  }, [onEngageLazyAssCycle]);

  const handleHallucinationChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onHallucinationLevelChange?.(Number(e.target.value));
  }, [onHallucinationLevelChange]);

  const handleSaturationChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onSaturationLevelChange?.(Number(e.target.value));
  }, [onSaturationLevelChange]);

  const handleCycleSelectChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value) {
      onCycleAmountChange?.(Number(e.target.value));
    }
  }, [onCycleAmountChange]);

  const saturationFillStyle = useMemo(() => {
    const level = saturationLevel ?? 0;
    return {
      width: `${level}%`,
      background: level > 80 
        ? 'linear-gradient(90deg, #ff0055, #ff0000)' 
        : level > 50 
          ? 'linear-gradient(90deg, #00e5ff, #ffaa00)' 
          : 'linear-gradient(90deg, #00ff88, #00e5ff)',
      boxShadow: `0 0 6px ${level > 80 ? '#ff0000' : '#00e5ff'}`
    };
  }, [saturationLevel]);

  const [currentLanguage, setCurrentLanguage] = React.useState<string>('english');

  React.useEffect(() => {
    setCurrentLanguage(getCurrentLanguage());
  }, []);

  return (
    <div className="px-3 py-3 flex-shrink-0" style={{ borderTop: `1px solid ${COLORS.panelBorder}` }}>
      {/* Header & Status Indicator */}
      <div className="flex flex-col gap-2 mb-2">
        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-2"
            style={{
              fontFamily: 'var(--font-orbitron), sans-serif',
              fontSize: '8px',
              letterSpacing: '0.15em',
              color: COLORS.textMuted,
            }}
          >
            <span>&#9673;</span>
            <span>QUICK ACTIONS</span>
          </div>
          {batchMode && (
            <div
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-sm animate-pulse"
              style={{
                fontFamily: 'var(--font-orbitron), sans-serif',
                fontSize: '7px',
                letterSpacing: '0.1em',
                color: '#00ccff',
                background: 'rgba(0, 204, 255, 0.1)',
                border: '1px solid rgba(0, 204, 255, 0.25)',
              }}
            >
              <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: '#00ccff' }} />
              BATCH ACTIVE
            </div>
          )}
        </div>

        {/* Global Control Toggles Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-[#020000] p-2 border border-white/[0.04] rounded">
          <div className="flex flex-wrap items-center gap-2">
            {backupToBranch !== undefined && onToggleBackupToBranch && (
              <ControlToggle
                active={backupToBranch}
                activeColor="#00ccff"
                label="BACKUP BRANCH"
                icon={<GitCommit size={9} />}
                onToggle={onToggleBackupToBranch}
                title={backupToBranch ? 'Backup ON — system backs up old logic to branch' : 'Backup OFF — mutations applied in place'}
              />
            )}

            {autoApprove !== undefined && onToggleAutoApprove && (
              <ControlToggle
                active={autoApprove}
                activeColor="#00ff88"
                label="AUTO APPROVE"
                icon={<CheckCircle2 size={9} />}
                onToggle={onToggleAutoApprove}
                title={autoApprove ? 'Auto-approve ON — all mutations applied automatically' : 'Auto-approve OFF — manual confirmation required'}
              />
            )}

            {autoDebate !== undefined && onToggleAutoDebate && (
              <ControlToggle
                active={autoDebate}
                activeColor="#ffaa00"
                label="AUTO DEBATE"
                icon={<Users size={9} />}
                onToggle={onToggleAutoDebate}
                title={autoDebate ? 'Auto-debate ON — file selection initiates debate' : 'Auto-debate OFF — manually initiate debate'}
              />
            )}

            {autoApproveRisk !== undefined && onAutoApproveRiskChange && (
              <ControlToggle
                active={autoApproveRisk === 'hallucinate' || (hallucinationLevel !== undefined && hallucinationLevel >= 75)}
                activeColor="#c800ff"
                label="HALLUCINATE"
                icon={<Sparkles size={9} />}
                onToggle={() => {
                  if (autoApproveRisk === 'hallucinate') {
                    onAutoApproveRiskChange('high');
                    onHallucinationLevelChange?.(50);
                  } else {
                    onAutoApproveRiskChange('hallucinate');
                    onHallucinationLevelChange?.(85);
                  }
                }}
                title={autoApproveRisk === 'hallucinate' ? 'Hallucination Mode ON — radical architectural leaps & zero limits' : 'Hallucination Mode OFF — standard controlled thresholds'}
              />
            )}

            {autoPauseOnSaturation !== undefined && onToggleAutoPauseOnSaturation && (
              <ControlToggle
                active={autoPauseOnSaturation}
                activeColor="#ffaa00"
                label="SATURATION GUARD"
                icon={<ShieldAlert size={9} />}
                onToggle={onToggleAutoPauseOnSaturation}
                title={autoPauseOnSaturation ? 'Saturation Guard ON — auto-pauses when 0-diff architectural equilibrium is reached' : 'Saturation Guard OFF — continues mutating regardless of 0 diffs'}
              />
            )}

            {autoSkipSaturated !== undefined && onToggleAutoSkipSaturated && (
              <ControlToggle
                active={autoSkipSaturated}
                activeColor="#00e5ff"
                label="SATURATION BLACKLIST"
                icon={<Ban size={9} />}
                onToggle={onToggleAutoSkipSaturated}
                title={autoSkipSaturated ? 'Auto-Blacklist ON — files reaching 0 diffs are blacklisted from duplicate churn' : 'Auto-Blacklist OFF — all files continuously eligible for mutation'}
              />
            )}

            {onEngageLazyAssCycle && (
              <button
                type="button"
                onClick={handleLazyAssClick}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-sm transition-all duration-200 cursor-pointer text-[#ff00a0] bg-pink-950/15 border border-[#ff00a0]/30 hover:border-[#ff00a0] hover:bg-pink-950/30 font-bold active:scale-95 shadow-[0_0_8px_rgba(255,0,160,0.1)] hover:shadow-[0_0_12px_rgba(255,0,160,0.35)]"
                style={{
                  fontFamily: 'var(--font-orbitron), sans-serif',
                  fontSize: '7px',
                  letterSpacing: '0.05em',
                }}
                title="LAZY ASS CYCLE: Auto-Approve ON, Auto-Debate ON, Cycles = 5"
              >
                <Rocket size={8} className="text-[#ff00a0] animate-bounce" />
                <span>LAZY ASS MODE (5 CYCLES) 🚀</span>
              </button>
            )}
          </div>
        </div>

        {/* Reconfiguration Panel */}
        <div id="reconfigure-button" className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1.5 p-2 bg-black/60 border border-red-950/20 rounded">
          
          {/* Risk Level Selector */}
          {autoApprove !== undefined && autoApproveRisk !== undefined && onAutoApproveRiskChange && (
            <div className="flex flex-col gap-1">
              <span className="text-[7.5px] tracking-wider font-sans font-bold uppercase" style={{ color: COLORS.textMuted }}>
                MAX AUTO-APPROVED RISK
              </span>
              <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded border border-white/5">
                {RISK_LEVELS.map((risk) => {
                  const isActive = autoApproveRisk === risk;
                  const isHallucinate = risk === 'hallucinate';
                  const borderActiveColor = isHallucinate ? 'rgba(200, 0, 255, 0.4)' : risk === 'low' ? 'rgba(0, 204, 255, 0.4)' : risk === 'medium' ? 'rgba(255, 170, 0, 0.4)' : 'rgba(255, 51, 51, 0.4)';
                  const bgActiveColor = isHallucinate ? 'rgba(200, 0, 255, 0.1)' : risk === 'low' ? 'rgba(0, 204, 255, 0.1)' : risk === 'medium' ? 'rgba(255, 170, 0, 0.1)' : 'rgba(255, 51, 51, 0.1)';
                  const textActiveColor = isHallucinate ? '#c800ff' : risk === 'low' ? '#00ccff' : risk === 'medium' ? '#ffaa00' : '#ff3333';
                  
                  return (
                    <button
                      key={risk}
                      type="button"
                      onClick={() => onAutoApproveRiskChange(risk)}
                      className={`flex-grow py-1 px-1 rounded text-[8px] font-mono tracking-wider transition-all duration-200 uppercase text-center font-bold cursor-pointer ${isHallucinate ? 'animate-pulse' : ''}`}
                      style={{
                        color: isActive ? textActiveColor : '#555',
                        background: isActive ? bgActiveColor : 'transparent',
                        borderColor: isActive ? borderActiveColor : 'transparent',
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        textShadow: isActive && isHallucinate ? '0 0 8px rgba(200, 0, 255, 0.6)' : 'none'
                      }}
                      title={isHallucinate ? 'Auto-approve ANY risk level & engage Hallucination Engine' : `Auto-approve mutations up to ${risk.toUpperCase()} risk`}
                    >
                      {isHallucinate ? 'HALLUCINATE' : risk}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Hallucination Level Slider */}
          {hallucinationLevel !== undefined && onHallucinationLevelChange && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[7.5px] tracking-wider font-sans font-bold uppercase" style={{ color: COLORS.textMuted }}>
                  HALLUCINATION {hallucinationLevel < 33 ? 'CONSERVATIVE' : hallucinationLevel < 66 ? 'ADAPTIVE' : 'CHAOTIC'}
                </span>
                <span className="text-[7.5px] font-mono font-bold text-[#c800ff]">
                  {hallucinationLevel}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={hallucinationLevel}
                onChange={handleHallucinationChange}
                className="w-full accent-[#c800ff] cursor-pointer"
              />
              <div className="flex gap-1 mt-0.5">
                {[
                  { label: 'CONSERVATIVE (20%)', val: 20 },
                  { label: 'ADAPTIVE (50%)', val: 50 },
                  { label: 'CHAOTIC (85%)', val: 85 },
                ].map((tier) => (
                  <button
                    key={tier.val}
                    type="button"
                    onClick={() => onHallucinationLevelChange(tier.val)}
                    className={`flex-1 py-0.5 text-[6.5px] font-mono rounded border transition-colors cursor-pointer ${
                      (tier.val === 20 && hallucinationLevel < 33) ||
                      (tier.val === 50 && hallucinationLevel >= 33 && hallucinationLevel < 66) ||
                      (tier.val === 85 && hallucinationLevel >= 66)
                        ? 'bg-[#c800ff]/20 text-[#c800ff] border-[#c800ff]/40 font-bold'
                        : 'bg-white/[0.03] hover:bg-white/[0.08] text-gray-400 hover:text-white border-white/5'
                    }`}
                  >
                    {tier.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Saturation Level Slider & Meter */}
          {saturationLevel !== undefined && onSaturationLevelChange && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[7.5px] tracking-wider font-sans font-bold uppercase" style={{ color: COLORS.textMuted }}>
                  SATURATION {saturationLevel < 33 ? 'NOMINAL' : saturationLevel < 66 ? 'ELEVATED' : 'CRITICAL'}
                </span>
                <span 
                  className="text-[7.5px] font-mono font-bold uppercase"
                  style={{ color: saturationLevel > 80 ? COLORS.dalekRed : saturationLevel > 50 ? COLORS.gold : COLORS.electricBlue }}
                >
                  {saturationLevel}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={saturationLevel}
                onChange={handleSaturationChange}
                className="w-full accent-[#00e5ff] cursor-pointer"
              />
              <div className="w-full h-1 bg-black/60 rounded overflow-hidden border border-white/10 flex">
                <div 
                  className={`h-full transition-all duration-300 ${saturationLevel > 80 ? 'animate-pulse' : ''}`}
                  style={saturationFillStyle}
                />
              </div>
              <div className="flex gap-1 mt-0.5">
                {[
                  { label: 'SENSITIVE (25%)', val: 25 },
                  { label: 'BALANCED (50%)', val: 50 },
                  { label: 'STRICT (80%)', val: 80 },
                ].map((tier) => (
                  <button
                    key={tier.val}
                    type="button"
                    onClick={() => onSaturationLevelChange(tier.val)}
                    className={`flex-1 py-0.5 text-[6.5px] font-mono rounded border transition-colors cursor-pointer ${
                      (tier.val === 25 && saturationLevel < 33) ||
                      (tier.val === 50 && saturationLevel >= 33 && saturationLevel < 66) ||
                      (tier.val === 80 && saturationLevel >= 66)
                        ? 'bg-[#00e5ff]/20 text-[#00e5ff] border-[#00e5ff]/40 font-bold'
                        : 'bg-white/[0.03] hover:bg-white/[0.08] text-gray-400 hover:text-white border-white/5'
                    }`}
                  >
                    {tier.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Cycles Preset Selector */}
          {cycleAmount !== undefined && onCycleAmountChange && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[7.5px] tracking-wider font-sans font-bold uppercase" style={{ color: COLORS.textMuted }}>
                  DEBATE CYCLES PRESET
                </span>
                <span className="text-[7.5px] text-red-500 font-mono font-bold uppercase">
                  {cycleAmount} CYCLES
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded border border-white/5">
                {PRESET_CYCLES.map((cycles) => {
                  const isActive = cycleAmount === cycles;
                  return (
                    <button
                      key={cycles}
                      type="button"
                      onClick={() => onCycleAmountChange(cycles)}
                      className="flex-grow py-1 px-1 rounded text-[8px] font-mono tracking-wider transition-all duration-200 text-center font-bold cursor-pointer"
                      style={{
                        color: isActive ? '#00ff88' : '#555',
                        background: isActive ? 'rgba(0, 255, 136, 0.1)' : 'transparent',
                        borderColor: isActive ? 'rgba(0, 255, 136, 0.4)' : 'transparent',
                        borderWidth: '1px',
                        borderStyle: 'solid',
                      }}
                      title={`Set debate cycles to ${cycles}`}
                    >
                      {cycles}
                    </button>
                  );
                })}
                <select
                  aria-label="Variable debate cycles selector"
                  value={PRESET_CYCLES.includes(cycleAmount as (1 | 5 | 10)) ? '' : cycleAmount}
                  onChange={handleCycleSelectChange}
                  className="py-1 px-1 rounded text-[8px] font-mono bg-[#050000] border border-transparent hover:border-white/10 text-gray-400 cursor-pointer text-center outline-none"
                  style={{ width: '45px' }}
                >
                  <option value="" disabled className="bg-[#050000] text-gray-500">
                    VAR
                  </option>
                  {CUSTOM_CYCLE_VALUES.map((customVal) => (
                    <option key={customVal} value={customVal} className="bg-[#050000] text-gray-200">
                      {customVal}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Interface Language Dropdown */}
          <div className="flex flex-col gap-1 sm:col-span-2 pt-1 border-t border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-[7.5px] tracking-wider font-sans font-bold uppercase flex items-center gap-1" style={{ color: COLORS.textMuted }}>
                <Languages size={9} className="text-cyan-400" />
                INTERFACE DISPLAY LANGUAGE
              </span>
              <span className="text-[7.5px] text-gray-500 font-mono">
                Translation by xnx3/translate
              </span>
            </div>
            <select
              value={currentLanguage}
              onChange={(e) => {
                const newLang = e.target.value;
                setCurrentLanguage(newLang);
                changeDisplayLanguage(newLang);
              }}
              className="w-full px-2 py-1 text-[9px] font-mono bg-black/60 border border-white/10 rounded text-gray-200 focus:border-cyan-500/60 focus:outline-none cursor-pointer"
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
        </div>
      </div>

      {/* Action Buttons Grid */}
      <div className="flex flex-wrap gap-2">
        {QUICK_ACTION_REGISTRY.map(({ id, label, icon, color }) => (
          <ActionButton
            key={id}
            id={id}
            label={label}
            icon={icon}
            color={color}
            disabled={disabled}
            batchMode={batchMode}
            pushStatus={pushStatus}
            deployStatus={deployStatus}
            rebootStatus={rebootStatus}
            undoStatus={undoStatus}
            bulkCommitStatus={bulkCommitStatus}
            onAction={onAction}
          />
        ))}
      </div>
    </div>
  );
}

// Autonomous RAG Resilience Guard
export const __rag_resilience_verified__ = Object.freeze({
  generation: 127,
  timestamp: "2026-09-20T03:51:07.906Z",
  ragEngine: "DARLEK_CAAN_HYBRID_RAG"
});
