import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AudioWaveform,
  Box,
  CheckCircle2,
  Clock,
  Code2,
  Columns,
  Cpu,
  Crown,
  Download,
  FileAudio,
  Film,
  FolderPlus,
  Key,
  Layers,
  Loader2,
  Play,
  RefreshCw,
  Settings,
  Sparkles,
  Wand2,
} from 'lucide-react';
import {
  AccountsState,
  AudioInputMode,
  CreatorizeProject,
  CustomStyleDefinition,
  ProjectSettings,
  QualityPassMode,
  RoutineSchedule,
  StoryboardStill,
  SubscriptionTier,
  TimeLimitOption,
  ViewportShadingMode,
} from './types/creatorize';
import {
  INITIAL_ACCOUNTS_STATE,
  INITIAL_CUSTOM_STYLES,
  INITIAL_ROUTINES,
  PRESET_PROJECTS,
  VISUAL_STYLES,
  generateWordTimestampsFromScript,
} from './data/presetProjects';
import {
  generateFullProjectBlenderScript,
} from './services/blenderScriptGenerator';
import {
  DEFAULT_NEW_PROJECT_SETTINGS,
  buildProviderExecutionPlan,
  buildTimelineShotsForProject,
  calculateBuildTelemetry,
  generateStoryboardStillsForProject,
  selectOrRotateClaudeAccount,
} from './services/aiPipelineService';
import { Viewport3D } from './components/Viewport3D';
import { ProjectSettingsModal } from './components/ProjectSettingsModal';
import { StoryboardFlowModal } from './components/StoryboardFlowModal';
import { AccountsManagerModal } from './components/AccountsManagerModal';
import { RoutinesAndStylesModal } from './components/RoutinesAndStylesModal';
import { ComparisonShowcase } from './components/ComparisonShowcase';
import { ModalDialog } from './components/ModalDialog';

export function App() {
  const [projects, setProjects] = useState<CreatorizeProject[]>(PRESET_PROJECTS);
  const [activeProjectId, setActiveProjectId] = useState<string>(PRESET_PROJECTS[0].id);
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>('premium');
  const [monthlyExportsCount, setMonthlyExportsCount] = useState<number>(3);
  const [accounts, setAccounts] = useState<AccountsState>(INITIAL_ACCOUNTS_STATE);
  const [routines, setRoutines] = useState<RoutineSchedule[]>(INITIAL_ROUTINES);
  const [customStyles, setCustomStyles] = useState<CustomStyleDefinition[]>(INITIAL_CUSTOM_STYLES);

  // Playback & Viewport State
  const [currentTimeSec, setCurrentTimeSec] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [shadingMode, setShadingMode] = useState<ViewportShadingMode>('rendered');
  const [isCachingFrame, setIsCachingFrame] = useState<boolean>(false);
  const [cacheFrameProgress, setCacheFrameProgress] = useState<number>(0);

  // Audio Clean & Time State
  const [isCleaningAudio, setIsCleaningAudio] = useState<boolean>(false);
  const [cleanAudioProgress, setCleanAudioProgress] = useState<number>(100);

  // Build Stopwatch & Simulation State
  const [isBuilding3D, setIsBuilding3D] = useState<boolean>(false);
  const [buildStopwatchSec, setBuildStopwatchSec] = useState<number>(0);

  // Right Inspector Tab
  const [inspectorTab, setInspectorTab] = useState<'words' | 'blender-code' | 'tokens'>('words');

  // Modals State
  const [settingsModalMode, setSettingsModalMode] = useState<'closed' | 'new-project' | 'edit-settings'>('closed');
  const [isStoryboardOpen, setIsStoryboardOpen] = useState<boolean>(false);
  const [isAccountsOpen, setIsAccountsOpen] = useState<boolean>(false);
  const [isRoutinesOpen, setIsRoutinesOpen] = useState<boolean>(false);
  const [isComparisonOpen, setIsComparisonOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(100);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) || projects[0],
    [projects, activeProjectId]
  );

  const activeShot = useMemo(() => {
    const found = activeProject.shots.find(
      (s) => currentTimeSec >= s.startSec && currentTimeSec <= s.endSec
    );
    return found || activeProject.shots[0];
  }, [activeProject, currentTimeSec]);

  const activeWord = useMemo(() => {
    return activeProject.wordTimestamps.find(
      (w) => currentTimeSec >= w.startSec && currentTimeSec <= w.endSec
    );
  }, [activeProject, currentTimeSec]);

  const activeClaudeAccount = useMemo(
    () => accounts.claudeAccounts.find((a) => a.isActive) || accounts.claudeAccounts[0],
    [accounts]
  );

  const activeStyleMeta = useMemo(
    () => VISUAL_STYLES.find((s) => s.id === activeProject.settings.styleId) || VISUAL_STYLES[7],
    [activeProject.settings.styleId]
  );

  const executionPlan = useMemo(
    () => buildProviderExecutionPlan(activeProject, accounts),
    [activeProject, accounts]
  );

  // Real-time playback loop
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentTimeSec((prev) => {
        const next = prev + 0.2;
        if (next >= activeProject.audioDurationSec) {
          setIsPlaying(false);
          return 0;
        }
        return Number(next.toFixed(2));
      });
    }, 200);
    return () => clearInterval(interval);
  }, [isPlaying, activeProject.audioDurationSec]);

  // Live Build Stopwatch when building 3D scenes
  useEffect(() => {
    if (!isBuilding3D) return;
    const timer = setInterval(() => {
      setBuildStopwatchSec((prev) => prev + 1);
    }, 250);
    return () => clearInterval(timer);
  }, [isBuilding3D]);

  // Step 1: Clean and time the audio (Local transcription model ~20s sync)
  const handleCleanAndTimeAudio = () => {
    setIsCleaningAudio(true);
    setCleanAudioProgress(15);
    setTimeout(() => {
      setCleanAudioProgress(65);
    }, 120);
    setTimeout(() => {
      setCleanAudioProgress(100);
      setIsCleaningAudio(false);
      setProjects((prev) =>
        prev.map((p) =>
          p.id === activeProject.id
            ? {
                ...p,
                isAudioCleanedAndTimed: true,
                transcriptionTimeSec: 20,
                wordTimestamps: generateWordTimestampsFromScript(
                  p.scriptText,
                  p.audioDurationSec,
                  accounts.blenderBridge.fps
                ),
              }
            : p
        )
      );
    }, 280);
  };

  // Force Cache a 3D Shot when playhead parks on it
  const handleForceCacheShot = (shotId: string) => {
    setIsCachingFrame(true);
    setCacheFrameProgress(20);
    setTimeout(() => {
      setCacheFrameProgress(75);
    }, 120);
    setTimeout(() => {
      setCacheFrameProgress(100);
      setIsCachingFrame(false);
      setProjects((prev) =>
        prev.map((proj) =>
          proj.id === activeProject.id
            ? {
                ...proj,
                shots: proj.shots.map((s) =>
                  s.id === shotId ? { ...s, cacheStatus: 'cached', cacheProgress: 100 } : s
                ),
              }
            : proj
        )
      );
    }, 260);
  };

  const handleCacheAllShots = () => {
    setProjects((prev) =>
      prev.map((proj) =>
        proj.id === activeProject.id
          ? {
              ...proj,
              shots: proj.shots.map((s) => ({ ...s, cacheStatus: 'cached', cacheProgress: 100 })),
            }
          : proj
      )
    );
  };

  // Start 3D Build Pipeline (from Storyboard or Sidebar) + Multi-Account Failover
  const handleStart3DBuild = () => {
    setIsBuilding3D(true);
    setBuildStopwatchSec(0);
    setProjects((prev) =>
      prev.map((p) =>
        p.id === activeProject.id
          ? { ...p, buildStatus: 'building', buildProgressPercent: 35 }
          : p
      )
    );

    setTimeout(() => {
      // Consume Claude session/weekly quota and auto-rotate if limit reached
      setAccounts((prevAcc) => {
        const { updatedAccounts } = selectOrRotateClaudeAccount(
          prevAcc,
          activeProject.sessionLimitPercent,
          activeProject.weeklyLimitPercent
        );
        return updatedAccounts;
      });

      setProjects((prev) =>
        prev.map((p) =>
          p.id === activeProject.id
            ? {
                ...p,
                buildStatus: 'completed',
                buildProgressPercent: 100,
                storyboardConfirmed: true,
              }
            : p
        )
      );
      setIsBuilding3D(false);
    }, 450);
  };

  const handleSaveProjectFromModal = (payload: {
    projectName: string;
    audioInputMode: AudioInputMode;
    audioFileName: string;
    scriptText: string;
    settings: ProjectSettings;
  }) => {
    const telemetry = calculateBuildTelemetry(payload.settings);
    const fps = accounts.blenderBridge.fps;
    const renderEngine = accounts.blenderBridge.renderEngine;

    if (settingsModalMode === 'new-project') {
      const newId = `proj-${Date.now()}`;
      const duration = payload.settings.targetDurationSec || 30;
      const baseProject: CreatorizeProject = {
        id: newId,
        name: payload.projectName,
        topicSummary: payload.scriptText.slice(0, 120) || 'Dự án 3D Shorts mới khởi tạo',
        createdAt: 'Vừa xong',
        audioInputMode: payload.audioInputMode,
        audioFileName: payload.audioFileName,
        audioDurationSec: duration,
        scriptText: payload.scriptText,
        isAudioCleanedAndTimed: false,
        transcriptionTimeSec: 20,
        wordTimestamps: generateWordTimestampsFromScript(payload.scriptText, duration, fps),
        settings: payload.settings,
        storyboardGenerated: false,
        storyboardConfirmed: false,
        storyboardStills: [],
        buildStatus: 'idle',
        buildProgressPercent: 0,
        buildElapsedSec: telemetry.buildElapsedSec,
        shots: [],
        tokensUsedMillions: telemetry.tokensUsedMillions,
        sessionLimitPercent: telemetry.sessionLimitPercent,
        weeklyLimitPercent: telemetry.weeklyLimitPercent,
        exportTimeSec: 160,
        originalComparisonNotes:
          'Dự án mới khởi tạo với cấu hình tùy chỉnh trên Creatorize Studio.',
      };

      const initialStills = generateStoryboardStillsForProject(
        baseProject,
        payload.settings.momentsCount,
        payload.settings.globalStyleKey
      );
      const initialShots = buildTimelineShotsForProject(
        baseProject,
        initialStills,
        payload.settings.momentsCount,
        payload.settings.globalStyleKey,
        fps,
        renderEngine
      );

      const newProj: CreatorizeProject = {
        ...baseProject,
        storyboardStills: initialStills,
        shots: initialShots,
      };

      setProjects((prev) => [newProj, ...prev]);
      setActiveProjectId(newId);
      setCurrentTimeSec(0);
    } else {
      // Update existing project settings
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== activeProject.id) return p;
          const updatedProj: CreatorizeProject = {
            ...p,
            name: payload.projectName,
            audioInputMode: payload.audioInputMode,
            audioFileName: payload.audioFileName,
            scriptText: payload.scriptText,
            audioDurationSec: payload.settings.targetDurationSec,
            wordTimestamps: generateWordTimestampsFromScript(
              payload.scriptText,
              payload.settings.targetDurationSec,
              fps
            ),
            settings: payload.settings,
            tokensUsedMillions: telemetry.tokensUsedMillions,
            sessionLimitPercent: telemetry.sessionLimitPercent,
            weeklyLimitPercent: telemetry.weeklyLimitPercent,
            buildElapsedSec: telemetry.buildElapsedSec,
          };
          const rebuiltShots = buildTimelineShotsForProject(
            updatedProj,
            updatedProj.storyboardStills,
            payload.settings.momentsCount,
            payload.settings.globalStyleKey,
            fps,
            renderEngine
          );
          return {
            ...updatedProj,
            shots: rebuiltShots,
          };
        })
      );
    }
  };

  const handleUpdateStoryboardAndStartBuild = (payload: {
    momentsCount: 5 | 6 | 7;
    globalStyleKey: string;
    selectedStills: StoryboardStill[];
    qualityMode: QualityPassMode;
    timeLimit: TimeLimitOption;
    customReferenceImages: string[];
    startBuildImmediately: boolean;
  }) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== activeProject.id) return p;
        const nextSettings: ProjectSettings = {
          ...p.settings,
          momentsCount: payload.momentsCount,
          globalStyleKey: payload.globalStyleKey,
          qualityMode: payload.qualityMode,
          timeLimit: payload.timeLimit,
          customReferenceImages: payload.customReferenceImages,
        };
        const telemetry = calculateBuildTelemetry(nextSettings);
        const nextProj: CreatorizeProject = {
          ...p,
          storyboardGenerated: true,
          storyboardConfirmed: true,
          storyboardStills: payload.selectedStills,
          settings: nextSettings,
          tokensUsedMillions: telemetry.tokensUsedMillions,
          sessionLimitPercent: telemetry.sessionLimitPercent,
          weeklyLimitPercent: telemetry.weeklyLimitPercent,
          buildElapsedSec: telemetry.buildElapsedSec,
        };
        nextProj.shots = buildTimelineShotsForProject(
          nextProj,
          payload.selectedStills,
          payload.momentsCount,
          payload.globalStyleKey,
          accounts.blenderBridge.fps,
          accounts.blenderBridge.renderEngine
        );
        return nextProj;
      })
    );
    if (payload.startBuildImmediately) {
      handleStart3DBuild();
    }
  };

  const handleDownloadBlenderScript = () => {
    const scriptContent = generateFullProjectBlenderScript(
      activeProject,
      accounts.blenderBridge.renderEngine,
      accounts.blenderBridge.fps
    );
    const blob = new Blob([scriptContent], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeProject.id}_opus55_blender.py`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRunExport = () => {
    if (subscriptionTier === 'standard' && monthlyExportsCount >= 12) return;
    setIsExporting(true);
    setExportProgress(25);
    setTimeout(() => setExportProgress(75), 150);
    setTimeout(() => {
      setExportProgress(100);
      setIsExporting(false);
      setMonthlyExportsCount((c) => c + 1);
    }, 320);
  };

  const handleChangeSubscriptionTier = (tier: SubscriptionTier) => {
    setSubscriptionTier(tier);
    if (tier === 'standard') {
      // Standard plan does not include Ultra Edit or 4K export per Part 5 of transcript
      setProjects((prev) =>
        prev.map((p) =>
          p.id === activeProject.id
            ? {
                ...p,
                settings: {
                  ...p.settings,
                  qualityMode: 'standard-verified',
                  resolution: '1080p',
                },
              }
            : p
        )
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#060b16] text-slate-100">
      {/* ================= TOP STUDIO NAVIGATION HEADER ================= */}
      <header className="sticky top-0 z-30 bg-[#0a1224]/95 backdrop-blur-md border-b border-slate-800/90 px-4 py-2.5">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Brand & Active Plan Badge */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Box className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base tracking-tight text-white">
                  Creatorize Studio
                </h1>
                <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold text-[10px]">
                  Opus 5.5 + Blender 3D
                </span>
                <button
                  type="button"
                  onClick={() => setIsRoutinesOpen(true)}
                  data-testid="badge-subscription-tier"
                  className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] flex items-center gap-1 border ${
                    subscriptionTier === 'premium'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  <Crown className="w-3 h-3" />
                  {subscriptionTier === 'premium'
                    ? 'PREMIUM • UNLIMITED EXPORTS'
                    : `STANDARD • ${monthlyExportsCount}/12 VIDEOS/MO`}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                MEGA Viral Zack D. Films 3D Shorts Engine • Active Account:{' '}
                <strong className="text-emerald-300">{activeClaudeAccount?.label}</strong>
              </p>
            </div>
          </div>

          {/* Center Project Switcher */}
          <div className="flex items-center gap-2">
            <select
              aria-label="Select Active Project"
              data-testid="select-active-project"
              value={activeProject.id}
              onChange={(e) => {
                setActiveProjectId(e.target.value);
                setCurrentTimeSec(0);
                setIsPlaying(false);
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-semibold text-white focus:border-blue-500 focus:outline-none"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  📁 {p.name} ({p.tokensUsedMillions.toFixed(1)}M tokens)
                </option>
              ))}
            </select>

            <button
              type="button"
              data-testid="btn-new-project"
              onClick={() => setSettingsModalMode('new-project')}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              New Project
            </button>
          </div>

          {/* Right Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              type="button"
              data-testid="btn-open-project-settings"
              onClick={() => setSettingsModalMode('edit-settings')}
              className="px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold flex items-center gap-1.5 transition"
            >
              <Settings className="w-3.5 h-3.5 text-blue-400" />
              Project Settings
            </button>

            <button
              type="button"
              data-testid="btn-open-storyboard"
              onClick={() => setIsStoryboardOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 font-semibold flex items-center gap-1.5 transition"
            >
              <Wand2 className="w-3.5 h-3.5 text-indigo-300" />
              Scene Building / Storyboard
              <span className="px-1.5 py-0.2 rounded bg-blue-500 text-white text-[9px] font-extrabold">
                NEW
              </span>
            </button>

            <button
              type="button"
              data-testid="btn-open-comparison"
              onClick={() => setIsComparisonOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold flex items-center gap-1.5 transition"
            >
              <Columns className="w-3.5 h-3.5 text-amber-400" />
              So Sánh Video Gốc (3 Clips)
            </button>

            <button
              type="button"
              data-testid="btn-open-routines"
              onClick={() => setIsRoutinesOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold flex items-center gap-1.5 transition"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              Gói Cước & Routines
            </button>

            <button
              type="button"
              data-testid="btn-open-accounts"
              onClick={() => setIsAccountsOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600/25 hover:bg-emerald-600/40 text-emerald-200 border border-emerald-500/40 font-bold flex items-center gap-1.5 transition"
            >
              <Key className="w-3.5 h-3.5 text-emerald-400" />
              Accounts & API Hub
            </button>
          </div>
        </div>
      </header>

      {/* ================= MAIN WORKSPACE (3 COLUMNS + TIMELINE) ================= */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN (3 cols): Step-by-Step Creatorize Workflow & Settings Summary */}
        <aside className="lg:col-span-3 space-y-3.5 flex flex-col">
          {/* Card 1: Current Project Settings Summary */}
          <div className="bg-[#0b1326] border border-slate-800/90 rounded-xl p-3.5 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-400" />
                Cấu Hình Mô Hình Hiện Tại
              </span>
              <button
                type="button"
                onClick={() => setSettingsModalMode('edit-settings')}
                className="text-[11px] text-blue-400 hover:underline font-semibold"
              >
                Thay đổi
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                <div className="text-slate-400">Visual Style</div>
                <div className="font-bold text-blue-300 truncate" data-testid="summary-style-name">
                  {activeStyleMeta.name}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                <div className="text-slate-400">AI Model & Effort</div>
                <div className="font-bold text-emerald-300" data-testid="summary-model-effort">
                  {activeProject.settings.aiModel === 'claude-opus-5-5' ? 'Opus 5.5' : 'Sonnet 5.5'} ({activeProject.settings.effortLevel.toUpperCase()})
                </div>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                <div className="text-slate-400">Quality Pass</div>
                <div className="font-bold text-amber-300" data-testid="summary-quality-mode">
                  {activeProject.settings.qualityMode === 'ultra-edit' ? 'Ultra Edit Pass' : 'Standard Verified'}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                <div className="text-slate-400">Time Limit / Duration</div>
                <div className="font-bold text-white" data-testid="summary-timelimit-duration">
                  {activeProject.settings.timeLimit.toUpperCase()} • {activeProject.audioDurationSec}s
                </div>
              </div>
            </div>

            <div className="px-2.5 py-1.5 rounded-lg bg-slate-950/90 border border-slate-800/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Đầu vào:</span>
              <span className="font-semibold text-emerald-300">
                {activeProject.settings.useReferenceVideo
                  ? `📹 Có Video Tham Chiếu (${activeProject.settings.referenceVideoName})`
                  : '🎙️ 100% Audio-Only (Không dùng video mẫu)'}
              </span>
            </div>
          </div>

          {/* Card 2: STEP 1 — Clean and time the audio (Local Transcription Model ~20s) */}
          <div className="bg-[#0b1326] border border-slate-800/90 rounded-xl p-3.5 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5">
                <AudioWaveform className="w-4 h-4 text-emerald-400" />
                Bước 1: Clean & Time Audio
              </span>
              <span
                data-testid="audio-timed-status"
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  activeProject.isAudioCleanedAndTimed
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {activeProject.isAudioCleanedAndTimed
                  ? `Synced (${activeProject.transcriptionTimeSec}s) ✓`
                  : 'Chưa đồng bộ'}
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Kích hoạt mô hình nhận diện giọng nói chạy cục bộ (<strong>Local Transcription Model</strong>), đồng bộ chính xác từng từ phát âm với từng khung hình Blender (~20 giây).
            </p>

            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-blue-300 truncate">
              🎵 {activeProject.audioFileName} ({activeProject.wordTimestamps.length} từ đã gắn Frame)
            </div>

            {isCleaningAudio && (
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all duration-150"
                  style={{ width: `${cleanAudioProgress}%` }}
                />
              </div>
            )}

            <button
              type="button"
              data-testid="btn-clean-time-audio"
              onClick={handleCleanAndTimeAudio}
              className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-1.5 shadow transition"
            >
              {isCleaningAudio ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Đang chạy Local Transcription...
                </>
              ) : (
                <>
                  <FileAudio className="w-3.5 h-3.5" />
                  Clean and time the audio
                </>
              )}
            </button>
          </div>

          {/* Card 3: STEP 2 — Scene Building & Storyboard with Google Flow */}
          <div className="bg-[#0b1326] border border-slate-800/90 rounded-xl p-3.5 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Wand2 className="w-4 h-4 text-indigo-400" />
                Bước 2: Scene Building (Storyboard)
              </span>
              <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold">
                {activeProject.settings.momentsCount} Moments
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Sử dụng <strong>Google Flow</strong> (miễn phí credit) kết hợp <strong>Global Style Key</strong> (nền lưới xanh vô tận Zack D.) để sinh {activeProject.settings.momentsCount} ảnh định hướng bố cục.
            </p>

            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-[10px] text-slate-300 line-clamp-2 font-mono">
              Key: {activeProject.settings.globalStyleKey}
            </div>

            <button
              type="button"
              data-testid="sidebar-btn-storyboard"
              onClick={() => setIsStoryboardOpen(true)}
              className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center justify-center gap-1.5 shadow transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Mở Storyboard & Make the Stills
            </button>
          </div>

          {/* Card 4: STEP 3 — Start Build, Stopwatch & Token Cost Telemetry */}
          <div className="bg-[#0b1326] border border-slate-800/90 rounded-xl p-3.5 space-y-2.5 text-xs flex-1 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-blue-400" />
                  Bước 3: Tiến Trình Dựng 3D & Chi Phí Token
                </span>
                <span className="font-mono text-[11px] text-amber-300 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {isBuilding3D
                    ? `${buildStopwatchSec}s`
                    : `${Math.round(activeProject.buildElapsedSec / 60)}m`}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Tổng Token tiêu thụ:</span>
                  <strong className="text-emerald-400" data-testid="telemetry-tokens">
                    {activeProject.tokensUsedMillions.toFixed(1)}M Tokens
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Hạn mức Tuần (Claude 20x):</span>
                  <strong className="text-blue-300">~{activeProject.weeklyLimitPercent}% Weekly Limit</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Hạn mức Phiên (Session):</span>
                  <strong className="text-slate-200">~{activeProject.sessionLimitPercent}% Session Limit</strong>
                </div>
                <div className="pt-1 border-t border-slate-800/80 text-[10px] text-slate-400">
                  ✓ Tương thích chạy trực tiếp trên cả gói <strong>Claude Pro $20/tháng</strong>.
                </div>
              </div>
            </div>

            <button
              type="button"
              data-testid="sidebar-btn-start-build"
              onClick={handleStart3DBuild}
              className="mt-2 w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold flex items-center justify-center gap-1.5 shadow-lg transition"
            >
              {isBuilding3D ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Opus 5.5 Đang Dựng Cảnh Blender...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  Start build (Chạy dựng 3D)
                </>
              )}
            </button>
          </div>
        </aside>

        {/* CENTER COLUMN (5 cols): 3D Viewport (Bluish Infinite Grid + Solid vs Rendered Cache) */}
        <section className="lg:col-span-5 flex flex-col">
          <Viewport3D
            project={activeProject}
            activeShot={activeShot}
            currentTimeSec={currentTimeSec}
            isPlaying={isPlaying}
            shadingMode={shadingMode}
            isCachingFrame={isCachingFrame}
            cacheFrameProgress={cacheFrameProgress}
            activeWord={activeWord}
            onTogglePlay={() => setIsPlaying((p) => !p)}
            onChangeShadingMode={(mode) => setShadingMode(mode)}
            onForceCacheShot={handleForceCacheShot}
            onOpenExportModal={() => setIsExportModalOpen(true)}
          />
        </section>

        {/* RIGHT COLUMN (4 cols): Word-Level Aligner, Blender Python Code & Token Analysis */}
        <aside className="lg:col-span-4 bg-[#0b1326] border border-slate-800/90 rounded-xl flex flex-col overflow-hidden">
          <div className="flex border-b border-slate-800 bg-[#0e1830] p-1.5 gap-1 text-xs">
            <button
              type="button"
              data-testid="inspector-tab-words"
              onClick={() => setInspectorTab('words')}
              className={`flex-1 py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition ${
                inspectorTab === 'words'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <AudioWaveform className="w-3.5 h-3.5" />
              Word-Frame Sync
            </button>
            <button
              type="button"
              data-testid="inspector-tab-blender"
              onClick={() => setInspectorTab('blender-code')}
              className={`flex-1 py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition ${
                inspectorTab === 'blender-code'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              Blender Python (.py)
            </button>
            <button
              type="button"
              data-testid="inspector-tab-tokens"
              onClick={() => setInspectorTab('tokens')}
              className={`flex-1 py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition ${
                inspectorTab === 'tokens'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Opus vs Sonnet
            </button>
          </div>

          <div className="p-4 flex-1 overflow-y-auto space-y-3 text-xs max-h-[520px]">
            {inspectorTab === 'words' && (
              <>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-300">
                      Phân cảnh hiện tại: Shot #{activeShot.shotNumber}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      Frames {activeShot.startFrame} – {activeShot.endFrame}
                    </span>
                  </div>
                  <div className="font-bold text-white text-sm">{activeShot.title}</div>
                  <p className="text-slate-300 leading-relaxed">{activeShot.narration}</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-200">
                      Đồng bộ từng từ với khung hình (Click từ để nhảy tới Frame):
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold">
                      30 FPS Frame-Accurate
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-[260px] overflow-y-auto p-2.5 rounded-xl bg-slate-950/90 border border-slate-800">
                    {activeProject.wordTimestamps.map((wt, idx) => {
                      const isCurrent =
                        currentTimeSec >= wt.startSec && currentTimeSec <= wt.endSec;
                      return (
                        <button
                          key={`${wt.word}-${idx}`}
                          type="button"
                          onClick={() => setCurrentTimeSec(wt.startSec)}
                          className={`px-2 py-1 rounded-md text-[11px] font-medium border transition ${
                            isCurrent
                              ? 'bg-amber-500 text-slate-950 border-amber-300 font-bold shadow'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-blue-500/50'
                          }`}
                          title={`${wt.startSec}s - ${wt.endSec}s (Frame ${wt.startFrame})`}
                        >
                          {wt.word}{' '}
                          <span className="text-[9px] opacity-70 font-mono">F{wt.startFrame}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {inspectorTab === 'blender-code' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white">
                      Mã Python Blender (`bpy`) do Opus 5.5 (Low) sinh tự động
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Tự động dựng lưới xanh vô tận (Bluish Infinite Grid), vật thể 3D & keyframe theo lời thoại
                    </div>
                  </div>
                  <button
                    type="button"
                    data-testid="btn-download-blender-py"
                    onClick={handleDownloadBlenderScript}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5 shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Tải file .py
                  </button>
                </div>

                <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto leading-relaxed max-h-[380px]">
                  {activeShot.blenderPythonCode}
                </pre>
              </div>
            )}

            {inspectorTab === 'tokens' && (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 space-y-1.5">
                  <div className="font-bold text-blue-300">
                    Tại sao chọn Claude Opus 5.5 (Low) thay vì Sonnet 5.5?
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    • <strong>Opus 5.5 (Low effort)</strong> có khả năng nhận thức không gian 3D (spatial awareness) vượt trội, dựng đúng toạ độ Blender ngay từ lần thử đầu tiên.
                  </p>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    • <strong>Sonnet 5.5</strong> khi chạy <em>Visual Verification Pass</em> nhận ra lỗi trong cảnh dựng nhưng lúng túng không biết cách sửa, dẫn tới đốt nhiều thời gian và token loay hoay vá lỗi vặt mà chất lượng vẫn kém xa Opus ở mức Low.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="font-bold text-white">
                    So Sánh Chế Độ Kiểm Duyệt: Standard Verified vs Ultra Edit
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="font-bold text-slate-200">Standard Verified</div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Kiểm tra cú pháp script & render cơ bản. Tiết kiệm token nhưng chuyển động vật lý chưa được làm mịn tối đa.
                      </p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30">
                      <div className="font-bold text-emerald-300">Ultra Edit Pass</div>
                      <p className="text-[10px] text-emerald-200/80 mt-1">
                        Opus 5.5 tự chụp ảnh khung hình Blender để kiểm tra không gian 3D và tinh chỉnh vật lý mượt mà nhất (chỉ tốn 5.4M token).
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="font-bold text-white flex items-center justify-between">
                    <span>Chuỗi Lệnh Thực Thi & Kết Nối Tài Khoản (Live Pipeline)</span>
                    <span className="text-[10px] text-emerald-400 font-mono">
                      {executionPlan.length} Steps Ready
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {executionPlan.map((step) => (
                      <div
                        key={`${step.stepNumber}-${step.serviceName}`}
                        className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 text-[10px] space-y-0.5"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-blue-300">{step.serviceName}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded font-bold ${
                              step.status === 'ready'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}
                          >
                            {step.status === 'ready' ? 'Ready ✓' : 'Need Key'}
                          </span>
                        </div>
                        <div className="text-slate-400 truncate">Account: {step.accountUsed}</div>
                        <div className="font-mono text-slate-300 truncate">{step.endpointOrCommand}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* ================= BOTTOM FULL-WIDTH TIMELINE & SHOT CACHE BAR ================= */}
        <section className="lg:col-span-12 bg-[#0b1326] border border-slate-800/90 rounded-xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-400" />
                3D Scene Timeline & Frame Cache Manager
              </span>
              <span className="text-[11px] text-slate-400">
                Dừng con trỏ trên phân cảnh để tạo bộ nhớ đệm (Cache) trước khi kết xuất ở chế độ Rendered Preview
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                data-testid="btn-cache-all-shots"
                onClick={handleCacheAllShots}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                Cache Toàn Bộ {activeProject.shots.length} Cảnh
              </button>
            </div>
          </div>

          {/* Interactive Timeline Range Slider */}
          <div className="space-y-1.5">
            <input
              type="range"
              aria-label="Timeline playhead scrubber"
              data-testid="timeline-scrubber"
              min={0}
              max={activeProject.audioDurationSec}
              step={0.1}
              value={currentTimeSec}
              onChange={(e) => {
                const nextTime = Number(e.target.value);
                setCurrentTimeSec(nextTime);
                setIsPlaying(false);
              }}
              className="w-full accent-blue-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
          </div>

          {/* Multi-Shot Track Blocks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
            {activeProject.shots.map((shot) => {
              const isCurrent = shot.id === activeShot.id;
              const isCached = shot.cacheStatus === 'cached';
              return (
                <button
                  key={shot.id}
                  type="button"
                  data-testid={`timeline-shot-${shot.shotNumber}`}
                  onClick={() => {
                    setCurrentTimeSec(shot.startSec + 0.5);
                    setIsPlaying(false);
                  }}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                    isCurrent
                      ? 'bg-blue-950/75 border-blue-400 ring-2 ring-blue-500/30'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 text-[10px]">
                      <span className="font-bold text-blue-300">Shot #{shot.shotNumber}</span>
                      <span className="font-mono text-slate-400">
                        {shot.startSec}s–{shot.endSec}s
                      </span>
                    </div>
                    <div className="font-bold text-white text-xs mt-1 line-clamp-1">
                      {shot.title}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">
                      {shot.narration}
                    </p>
                  </div>

                  <div className="mt-2.5 pt-1.5 border-t border-slate-800/90 flex items-center justify-between text-[10px]">
                    <span className="font-mono text-slate-400">
                      F{shot.startFrame}–F{shot.endFrame}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded font-bold ${
                        isCached
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {isCached ? 'Cached ✓' : 'Uncached'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </main>

      {/* ================= MODALS ================= */}
      {settingsModalMode !== 'closed' && (
        <ProjectSettingsModal
          isOpen={true}
          mode={settingsModalMode}
          initialProjectName={
            settingsModalMode === 'new-project'
              ? 'New Zack D. 3D Shorts Project'
              : activeProject.name
          }
          initialAudioFileName={
            settingsModalMode === 'new-project'
              ? 'glass_bottle_cup_narration.wav'
              : activeProject.audioFileName
          }
          initialScriptText={
            settingsModalMode === 'new-project'
              ? PRESET_PROJECTS[0].scriptText
              : activeProject.scriptText
          }
          initialAudioInputMode={
            settingsModalMode === 'new-project'
              ? 'upload-audio'
              : activeProject.audioInputMode
          }
          initialSettings={
            settingsModalMode === 'new-project'
              ? {
                  ...DEFAULT_NEW_PROJECT_SETTINGS,
                  qualityMode:
                    subscriptionTier === 'standard' ? 'standard-verified' : 'ultra-edit',
                  resolution: subscriptionTier === 'standard' ? '1080p' : '4K',
                }
              : activeProject.settings
          }
          subscriptionTier={subscriptionTier}
          customStyles={customStyles}
          elevenLabsVoiceName={accounts.elevenLabs.voiceName}
          onClose={() => setSettingsModalMode('closed')}
          onSaveProject={handleSaveProjectFromModal}
        />
      )}

      {isStoryboardOpen && (
        <StoryboardFlowModal
          isOpen={isStoryboardOpen}
          project={activeProject}
          googleFlowEmail={accounts.googleFlow.email}
          googleFlowCredits={accounts.googleFlow.freeCreditsRemaining}
          subscriptionTier={subscriptionTier}
          onDeductGoogleFlowCredits={(used) =>
            setAccounts((prev) => ({
              ...prev,
              googleFlow: {
                ...prev.googleFlow,
                freeCreditsRemaining: Math.max(0, prev.googleFlow.freeCreditsRemaining - used),
              },
            }))
          }
          onClose={() => setIsStoryboardOpen(false)}
          onUpdateStoryboardAndStartBuild={handleUpdateStoryboardAndStartBuild}
        />
      )}

      {isAccountsOpen && (
        <AccountsManagerModal
          isOpen={isAccountsOpen}
          accounts={accounts}
          onClose={() => setIsAccountsOpen(false)}
          onSaveAccounts={(updated) => setAccounts(updated)}
        />
      )}

      {isRoutinesOpen && (
        <RoutinesAndStylesModal
          isOpen={isRoutinesOpen}
          onClose={() => setIsRoutinesOpen(false)}
          subscriptionTier={subscriptionTier}
          onChangeTier={handleChangeSubscriptionTier}
          routines={routines}
          onAddRoutine={(r) => setRoutines((prev) => [...prev, r])}
          onToggleRoutine={(id) =>
            setRoutines((prev) =>
              prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
            )
          }
          customStyles={customStyles}
          onAddCustomStyle={(cs) => setCustomStyles((prev) => [...prev, cs])}
          youtubeInsights={accounts.youtubeApi.learnedInsights}
          avgRetentionPercent={accounts.youtubeApi.avgRetentionPercent}
        />
      )}

      {isComparisonOpen && (
        <ComparisonShowcase
          isOpen={isComparisonOpen}
          projects={projects}
          activeProjectId={activeProject.id}
          onSelectProjectIntoWorkspace={(id) => {
            setActiveProjectId(id);
            setCurrentTimeSec(0);
          }}
          onClose={() => setIsComparisonOpen(false)}
        />
      )}

      {/* Export Video / DaVinci Resolve Bridge Modal */}
      {isExportModalOpen && (
        <ModalDialog
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          title="Xuất Video 3D Hoàn Chỉnh (Export MP4 & DaVinci Resolve Bridge)"
          subtitle="Kết xuất toàn bộ các phân cảnh đã Cache ra file MP4 chất lượng cao để phát mượt mà trong DaVinci Resolve hoặc đăng YouTube Shorts"
          maxWidthClass="max-w-2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Dự án xuất:</span>
                <strong className="text-white">{activeProject.name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Định dạng & Độ phân giải:</span>
                <strong className="text-blue-300">
                  MP4 (H.264 / ProRes) • {activeProject.settings.aspectRatio} • {activeProject.settings.resolution}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Thời gian kết xuất dự kiến:</span>
                <strong className="text-emerald-300">{activeProject.exportTimeSec} giây (160s chuẩn video)</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tổng chi phí Token:</span>
                <strong className="text-amber-300">
                  {activeProject.tokensUsedMillions.toFixed(1)}M Tokens (Opus 5.5 {activeProject.settings.effortLevel.toUpperCase()})
                </strong>
              </div>
            </div>

            {isExporting && (
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-blue-300">
                  <span>Đang kết xuất chuỗi khung hình Blender 3D sang MP4...</span>
                  <span>{exportProgress}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-150"
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleDownloadBlenderScript}
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1.5"
              >
                <Download className="w-4 h-4 text-blue-400" />
                Tải Script Blender (.py)
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRunExport}
                  data-testid="btn-confirm-export"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 shadow-lg"
                >
                  <Film className="w-4 h-4" />
                  {isExporting ? 'Đang Xuất MP4...' : 'Bắt Đầu Xuất MP4 (Send to DaVinci Resolve)'}
                </button>
              </div>
            </div>
          </div>
        </ModalDialog>
      )}
    </div>
  );
}

export default App;
