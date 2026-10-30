import {
  AccountsState,
  ClaudeAccount,
  CreatorizeProject,
  ProjectSettings,
  Scene3DType,
  StoryboardStill,
  TimelineShot,
  TimeLimitOption,
} from '../types/creatorize';
import {
  BOTTLE_STORYBOARD_STILLS,
  BULLET_STORYBOARD_STILLS,
  EVEREST_STORYBOARD_STILLS,
  ZACK_D_DEFAULT_GLOBAL_STYLE_KEY,
} from '../data/presetProjects';
import { generateShotBlenderScript } from './blenderScriptGenerator';

export const DEFAULT_NEW_PROJECT_SETTINGS: ProjectSettings = {
  styleId: '3d-informational-zack-d',
  targetDurationSec: 30,
  aspectRatio: '9:16',
  resolution: '4K',
  language: 'Tiếng Việt (Vietnamese)',
  qualityMode: 'ultra-edit',
  aiModel: 'claude-opus-5-5',
  effortLevel: 'low',
  timeLimit: 'unlimited',
  momentsCount: 5,
  globalStyleKey: ZACK_D_DEFAULT_GLOBAL_STYLE_KEY,
  useReferenceVideo: false,
  customReferenceImages: [],
};

const TIME_LIMIT_MULTIPLIER: Record<TimeLimitOption, number> = {
  unlimited: 1.0,
  '15m': 0.65,
  '30m': 0.76,
  '45m': 0.84,
  '60m': 0.9,
  '90m': 0.95,
  '120m': 1.0,
};

export interface BuildTelemetryResult {
  tokensUsedMillions: number;
  sessionLimitPercent: number;
  weeklyLimitPercent: number;
  buildElapsedSec: number;
  gaslightNote: string;
}

export function calculateBuildTelemetry(settings: ProjectSettings): BuildTelemetryResult {
  // Base token cost on Opus 5.5 Ultra Edit Unlimited for 5 moments (5.4M tokens in tutorial; 10.0M for 6 moments / 36s Everest)
  let baseTokens = 5.4;
  if (settings.effortLevel === 'low') {
    baseTokens = settings.momentsCount >= 6 || settings.targetDurationSec >= 36 ? 10.0 : 5.4;
  } else if (settings.effortLevel === 'medium') {
    baseTokens = 13.8;
  } else if (settings.effortLevel === 'high') {
    baseTokens = 21.5;
  } else if (settings.effortLevel === 'extra-high') {
    baseTokens = 31.2;
  } else if (settings.effortLevel === 'max') {
    baseTokens = 64.0;
  }

  // Sonnet 5.5 struggles with 3D spatial repairs during Visual Verification Pass, wasting tokens on retries
  const modelMultiplier = settings.aiModel === 'claude-sonnet-5-5' ? 1.32 : 1.0;

  // Standard Verified skips the multi-frame Ultra Edit visual verification loop
  const qualityMultiplier = settings.qualityMode === 'standard-verified' ? 0.78 : 1.0;

  // Time Limit ("Gaslight Claude") forces Claude to work more compactly and optimize token consumption
  const gaslightMultiplier = TIME_LIMIT_MULTIPLIER[settings.timeLimit] ?? 1.0;

  const tokensUsedMillions = Number(
    Math.max(2.1, baseTokens * modelMultiplier * qualityMultiplier * gaslightMultiplier).toFixed(1)
  );

  // On Claude 20x: 10.0M tokens = 4.0% session limit, 5.4M tokens = ~1.0% weekly limit
  const sessionLimitPercent = Number(((tokensUsedMillions / 10.0) * 4.0).toFixed(1));
  const weeklyLimitPercent = Number(((tokensUsedMillions / 5.4) * 1.0).toFixed(1));

  let buildElapsedSec = 2400;
  if (settings.timeLimit !== 'unlimited') {
    const minutes = parseInt(settings.timeLimit.replace('m', ''), 10) || 30;
    buildElapsedSec = minutes * 60;
  } else if (settings.effortLevel === 'max') {
    buildElapsedSec = 14400;
  } else if (settings.effortLevel === 'extra-high') {
    buildElapsedSec = 9600;
  }

  const gaslightNote =
    settings.timeLimit === 'unlimited'
      ? 'Unlimited time: Claude Opus 5.5 chạy đầy đủ chu trình kiểm tra không gian 3D.'
      : `Gaslight Mode (${settings.timeLimit}): Đã ép Claude tối ưu quy trình, tiết kiệm ~${Math.round(
          (1 - gaslightMultiplier) * 100
        )}% lượng token tiêu thụ.`;

  return {
    tokensUsedMillions,
    sessionLimitPercent,
    weeklyLimitPercent,
    buildElapsedSec,
    gaslightNote,
  };
}

export function selectOrRotateClaudeAccount(
  accounts: AccountsState,
  sessionDeltaPercent: number,
  weeklyDeltaPercent: number
): {
  updatedAccounts: AccountsState;
  activeAccount: ClaudeAccount | undefined;
  switchedFromLabel?: string;
} {
  if (accounts.claudeAccounts.length === 0) {
    return { updatedAccounts: accounts, activeAccount: undefined };
  }

  let activeIdx = accounts.claudeAccounts.findIndex((a) => a.isActive);
  if (activeIdx === -1) activeIdx = 0;

  const currentAcc = accounts.claudeAccounts[activeIdx];
  const nextSessionUsed = Number(
    Math.min(100, currentAcc.sessionUsedPercent + sessionDeltaPercent).toFixed(1)
  );
  const nextWeeklyUsed = Number(
    Math.min(100, currentAcc.weeklyUsedPercent + weeklyDeltaPercent).toFixed(1)
  );
  const reachedLimit =
    nextSessionUsed >= 100 || nextWeeklyUsed >= 100 || currentAcc.status === 'limit-reached';

  let switchedFromLabel: string | undefined;
  let newActiveIdx = activeIdx;

  const updatedList = accounts.claudeAccounts.map((acc, idx) => {
    if (idx !== activeIdx) return { ...acc };
    return {
      ...acc,
      sessionUsedPercent: nextSessionUsed,
      weeklyUsedPercent: nextWeeklyUsed,
      status: reachedLimit ? ('limit-reached' as const) : ('ready' as const),
    };
  });

  if (reachedLimit && accounts.autoSwitchClaudeAccount && updatedList.length > 1) {
    // Find next ready account in pool
    for (let offset = 1; offset < updatedList.length; offset++) {
      const candidateIdx = (activeIdx + offset) % updatedList.length;
      const candidate = updatedList[candidateIdx];
      if (
        candidate.status === 'ready' &&
        candidate.sessionUsedPercent < 100 &&
        candidate.weeklyUsedPercent < 100
      ) {
        newActiveIdx = candidateIdx;
        switchedFromLabel = currentAcc.label;
        break;
      }
    }
  }

  const finalAccountsList = updatedList.map((acc, idx) => ({
    ...acc,
    isActive: idx === newActiveIdx,
  }));

  const updatedAccounts: AccountsState = {
    ...accounts,
    claudeAccounts: finalAccountsList,
  };

  return {
    updatedAccounts,
    activeAccount: finalAccountsList[newActiveIdx],
    switchedFromLabel,
  };
}

function splitScriptIntoSegments(script: string, count: number): string[] {
  const clean = script.trim();
  if (!clean) {
    return Array.from({ length: count }, (_, i) => `Phân cảnh 3D #${i + 1} được suy luận từ âm thanh`);
  }

  const sentences = clean
    .split(/(?<=[.!?।;])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length >= count) {
    const result: string[] = [];
    const chunkSize = sentences.length / count;
    for (let i = 0; i < count; i++) {
      const start = Math.floor(i * chunkSize);
      const end = i === count - 1 ? sentences.length : Math.floor((i + 1) * chunkSize);
      result.push(sentences.slice(start, Math.max(start + 1, end)).join(' '));
    }
    return result;
  }

  const words = clean.split(/\s+/).filter(Boolean);
  const wordsPerSegment = Math.max(1, Math.ceil(words.length / count));
  return Array.from({ length: count }, (_, i) => {
    const slice = words.slice(i * wordsPerSegment, (i + 1) * wordsPerSegment);
    return slice.length > 0 ? slice.join(' ') : clean;
  });
}

function inferSceneTypeFromText(text: string, fallbackIndex: number): Scene3DType {
  const lower = text.toLowerCase();
  if (lower.includes('everest') || lower.includes('núi') || lower.includes('alaska') || lower.includes('bể dằn')) {
    const everestTypes: Scene3DType[] = [
      'everest-trench',
      'everest-drill',
      'everest-mesh',
      'everest-pillars',
      'everest-maglev',
      'everest-ballast-alaska',
    ];
    return everestTypes[fallbackIndex % everestTypes.length];
  }
  if (lower.includes('đạn') || lower.includes('súng') || lower.includes('kim hỏa') || lower.includes('bullet')) {
    const bulletTypes: Scene3DType[] = [
      'bullet-trigger-pin',
      'bullet-powder-cross',
      'bullet-ignition-gas',
      'bullet-barrel-exit',
    ];
    return bulletTypes[fallbackIndex % bulletTypes.length];
  }
  if (lower.includes('chai') || lower.includes('thủy tinh') || lower.includes('nước đá') || lower.includes('bottle')) {
    const bottleTypes: Scene3DType[] = [
      'bottle-string-fire',
      'bottle-rotate-heat',
      'bottle-ice-plunge',
      'bottle-thermal-crack',
      'bottle-sand-drink',
    ];
    return bottleTypes[fallbackIndex % bottleTypes.length];
  }
  return 'custom-3d-scene';
}

function formatSecToTimestamp(sec: number): string {
  const mins = Math.floor(sec / 60);
  const rem = Math.floor(sec % 60);
  return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}

export function generateStoryboardStillsForProject(
  project: CreatorizeProject,
  momentsCount: 5 | 6 | 7,
  globalStyleKey: string
): StoryboardStill[] {
  // Check if project matches one of the 3 canonical tutorial topics
  const lowerNameAndScript = `${project.name} ${project.scriptText}`.toLowerCase();
  let presetBase: StoryboardStill[] | null = null;

  if (project.id === 'proj-glass-bottle') {
    presetBase = BOTTLE_STORYBOARD_STILLS;
  } else if (project.id === 'proj-mount-everest') {
    presetBase = EVEREST_STORYBOARD_STILLS;
  } else if (project.id === 'proj-bullet-mechanism') {
    presetBase = BULLET_STORYBOARD_STILLS;
  }

  if (presetBase && presetBase.length > 0) {
    let picked = 0;
    return presetBase.map((still) => {
      const canSelect =
        picked < momentsCount &&
        still.momentIndex <= momentsCount &&
        !still.variantLabel.includes('Option B');
      if (canSelect) picked++;
      return {
        ...still,
        selected: canSelect,
      };
    });
  }

  // Dynamic Google Flow Storyboard generator from transcribed scriptText for any custom project
  const totalSlots = 7;
  const segments = splitScriptIntoSegments(project.scriptText, momentsCount);
  const duration = project.audioDurationSec || project.settings.targetDurationSec || 30;
  const stepSec = duration / momentsCount;

  const generated: StoryboardStill[] = [];

  for (let i = 0; i < totalSlots; i++) {
    const momentNumber = i + 1;
    const isWithinCount = momentNumber <= momentsCount;
    const segText = segments[Math.min(i, segments.length - 1)];
    const startSec = isWithinCount ? (momentNumber - 1) * stepSec : duration - 3;
    const endSec = isWithinCount ? momentNumber * stepSec : duration;
    const timeRange = `${formatSecToTimestamp(startSec)} – ${formatSecToTimestamp(endSec)}`;
    const sceneType = inferSceneTypeFromText(`${ lowerNameAndScript } ${ segText }`, i);
    const shortTitle =
      segText.length > 54 ? `${segText.slice(0, 52).trim()}...` : segText;

    generated.push({
      id: `still-${project.id}-${momentNumber}a`,
      momentIndex: momentNumber,
      variantLabel: isWithinCount ? `Moment ${momentNumber} • Option A` : `Moment ${momentNumber} • Bonus`,
      timestampRange: timeRange,
      title: shortTitle,
      prompt: `Google Flow 3D Still (Moment #${momentNumber}): ${segText} — Style: ${globalStyleKey}`,
      dialogueSnippet: segText,
      scenePreviewType: sceneType,
      selected: isWithinCount,
    });

    if (momentNumber === 1) {
      generated.push({
        id: `still-${project.id}-1b`,
        momentIndex: 1,
        variantLabel: 'Moment 1 • Option B',
        timestampRange: timeRange,
        title: `[Góc Cận Cảnh Macro] ${shortTitle}`,
        prompt: `Google Flow Macro Cutaway Variant (Moment #1): ${segText} — Style: ${globalStyleKey}`,
        dialogueSnippet: segText,
        scenePreviewType: sceneType,
        selected: false,
      });
    }
  }

  return generated;
}

const CAMERA_PRESETS = [
  'Macro Isometric Push-in (35mm)',
  'Side Orbit Tracking (50mm)',
  'Front Cross-Section Cutaway (40mm)',
  'Extreme Macro Fracture View (65mm)',
  'Hero Beauty Turntable (50mm)',
  'Low-Angle Structural View (32mm)',
  'Dynamic Barrel Follow (35mm)',
];

export function buildTimelineShotsForProject(
  project: CreatorizeProject,
  stills: StoryboardStill[],
  momentsCount: 5 | 6 | 7,
  globalStyleKey: string,
  fps: 30 | 60 = 30,
  renderEngine: 'EEVEE_NEXT' | 'CYCLES' = 'EEVEE_NEXT'
): TimelineShot[] {
  const chosenStills = stills.filter((s) => s.selected);
  const effectiveCount = chosenStills.length > 0 ? chosenStills.length : momentsCount;
  const duration = project.audioDurationSec || project.settings.targetDurationSec || 30;
  const shotSpan = duration / effectiveCount;
  const segments = splitScriptIntoSegments(project.scriptText, effectiveCount);
  const modelLabel =
    project.settings.aiModel === 'claude-opus-5-5' ? 'Opus 5.5' : 'Sonnet 5.5';
  const effortLabel = project.settings.effortLevel.toUpperCase();
  const passLabel =
    project.settings.qualityMode === 'ultra-edit'
      ? 'Ultra Edit Visual Verification'
      : 'Standard Verified';

  return Array.from({ length: effectiveCount }, (_, idx) => {
    const still = chosenStills[idx];
    const startSec = Number((idx * shotSpan).toFixed(1));
    const endSec = Number(((idx + 1) * shotSpan).toFixed(1));
    const startFrame = Math.round(startSec * fps) + 1;
    const endFrame = Math.max(startFrame + 1, Math.round(endSec * fps));
    const narration = still?.dialogueSnippet || segments[idx] || project.scriptText;
    const title = still?.title || `Phân cảnh 3D #${idx + 1}`;
    const sceneType =
      still?.scenePreviewType || inferSceneTypeFromText(`${project.name} ${narration}`, idx);

    const shot: TimelineShot = {
      id: `${project.id}-shot-${idx + 1}`,
      shotNumber: idx + 1,
      title,
      narration,
      startSec,
      endSec,
      startFrame,
      endFrame,
      sceneType,
      cacheStatus: idx < 2 ? 'cached' : 'uncached',
      cacheProgress: idx < 2 ? 100 : 0,
      visualVerificationNote: `${modelLabel} (${effortLabel}) ${passLabel}: Đã đồng bộ toạ độ không gian 3D khớp lời thoại (${startSec}s–${endSec}s) trên nền lưới xanh vô tận.`,
      cameraPreset: CAMERA_PRESETS[idx % CAMERA_PRESETS.length],
      blenderPythonCode: '',
    };

    shot.blenderPythonCode = generateShotBlenderScript(shot, globalStyleKey, fps, {
      fps,
      resolution: project.settings.resolution,
      aspectRatio: project.settings.aspectRatio,
      renderEngine,
      customAvatarName: project.settings.customAvatarName,
    });

    return shot;
  });
}

export interface ProviderExecutionStep {
  stepNumber: number;
  serviceName: string;
  accountUsed: string;
  endpointOrCommand: string;
  status: 'ready' | 'missing-credential' | 'optional-disabled';
}

export function buildProviderExecutionPlan(
  project: CreatorizeProject,
  accounts: AccountsState
): ProviderExecutionStep[] {
  const activeClaude =
    accounts.claudeAccounts.find((a) => a.isActive) || accounts.claudeAccounts[0];
  const enabledVideoModels = accounts.videoModelAccounts.filter((v) => v.enabled);

  const steps: ProviderExecutionStep[] = [
    {
      stepNumber: 1,
      serviceName: 'Local Whisper Audio Transcription & Word-Frame Aligner (20s)',
      accountUsed: accounts.blenderBridge.localWhisperModel,
      endpointOrCommand: `whisper "${project.audioFileName}" --model large-v3-turbo --word_timestamps True --fps ${accounts.blenderBridge.fps}`,
      status: accounts.blenderBridge.connected ? 'ready' : 'missing-credential',
    },
    {
      stepNumber: 2,
      serviceName: `Google Flow Storyboard Generator (${project.settings.momentsCount} Moments)`,
      accountUsed: `${accounts.googleFlow.email} (${accounts.googleFlow.freeCreditsRemaining} Free Credits)`,
      endpointOrCommand: `POST https://labs.google/fx/api/flow/generate-stills [moments=${project.settings.momentsCount}]`,
      status: accounts.googleFlow.sessionToken ? 'ready' : 'missing-credential',
    },
    {
      stepNumber: 3,
      serviceName: `Claude ${
        project.settings.aiModel === 'claude-opus-5-5' ? 'Opus 5.5' : 'Sonnet 5.5'
      } (${project.settings.effortLevel.toUpperCase()}) + ${
        project.settings.qualityMode === 'ultra-edit' ? 'Ultra Edit' : 'Standard Verified'
      }`,
      accountUsed: activeClaude
        ? `${activeClaude.label} (${activeClaude.planType})`
        : 'Chưa cấu hình tài khoản Claude',
      endpointOrCommand: `claude-code --model ${project.settings.aiModel} --effort ${project.settings.effortLevel} --mode ${project.settings.qualityMode} --time-limit ${project.settings.timeLimit}`,
      status: activeClaude?.credential ? 'ready' : 'missing-credential',
    },
    {
      stepNumber: 4,
      serviceName: `Blender 3D Headless Scene Cache & Render (${accounts.blenderBridge.renderEngine})`,
      accountUsed: accounts.blenderBridge.executablePath,
      endpointOrCommand: `"${accounts.blenderBridge.executablePath}" -b -P "${project.id}_opus55_blender.py" -E ${accounts.blenderBridge.renderEngine} -f 1..${
        project.audioDurationSec * accounts.blenderBridge.fps
      }`,
      status: accounts.blenderBridge.executablePath ? 'ready' : 'missing-credential',
    },
  ];

  if (project.audioInputMode === 'ai-script-elevenlabs') {
    steps.unshift({
      stepNumber: 0,
      serviceName: 'ElevenLabs AI Voiceover Synthesis',
      accountUsed: accounts.elevenLabs.voiceName,
      endpointOrCommand: `POST https://api.elevenlabs.io/v1/text-to-speech/${accounts.elevenLabs.voiceId}`,
      status: accounts.elevenLabs.apiKey ? 'ready' : 'missing-credential',
    });
  }

  if (enabledVideoModels.length > 0) {
    enabledVideoModels.forEach((vm, idx) => {
      steps.push({
        stepNumber: steps.length + 1 + idx,
        serviceName: `Hybrid Video Model: ${vm.providerLabel}`,
        accountUsed: vm.accountName,
        endpointOrCommand: `POST ${vm.endpointUrl}`,
        status: vm.apiKey ? 'ready' : 'missing-credential',
      });
    });
  }

  return steps;
}
