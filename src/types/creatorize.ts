export type VisualStyleId =
  | 'pixel-art'
  | 'vox-collage'
  | 'flat-explainer'
  | 'ms-paint-explainer'
  | '3d-reconstruction'
  | 'low-poly-shorts'
  | '3d-cartoon-shorts'
  | '3d-informational-zack-d';

export type AIModelId = 'claude-opus-5-5' | 'claude-sonnet-5-5';

export type EffortLevel = 'low' | 'medium' | 'high' | 'extra-high' | 'max';

export type QualityPassMode = 'standard-verified' | 'ultra-edit';

export type TimeLimitOption = 'unlimited' | '15m' | '30m' | '45m' | '60m' | '90m' | '120m';

export type SubscriptionTier = 'standard' | 'premium';

export type ViewportShadingMode = 'solid' | 'rendered';

export type AudioInputMode = 'upload-audio' | 'ai-script-elevenlabs';

export type ExportResolution = '1080p' | '4K';

export type AspectRatioOption = '9:16' | '16:9';

export interface VisualStyleMetadata {
  id: VisualStyleId;
  name: string;
  badge?: string;
  is3D: boolean;
  description: string;
  originNote: string;
  defaultGlobalStyleKey: string;
  accentGradient: string;
}

export interface WordTimestamp {
  word: string;
  startSec: number;
  endSec: number;
  startFrame: number;
  endFrame: number;
}

export interface StoryboardStill {
  id: string;
  momentIndex: number; // 1..7
  variantLabel: string; // e.g. "Option A", "Option B"
  timestampRange: string;
  title: string;
  prompt: string;
  dialogueSnippet: string;
  scenePreviewType: Scene3DType;
  selected: boolean;
  customImageUrl?: string;
}

export type Scene3DType =
  | 'bottle-string-fire'
  | 'bottle-rotate-heat'
  | 'bottle-ice-plunge'
  | 'bottle-thermal-crack'
  | 'bottle-sand-drink'
  | 'everest-trench'
  | 'everest-drill'
  | 'everest-mesh'
  | 'everest-pillars'
  | 'everest-maglev'
  | 'everest-ballast-alaska'
  | 'bullet-trigger-pin'
  | 'bullet-powder-cross'
  | 'bullet-ignition-gas'
  | 'bullet-barrel-exit'
  | 'custom-3d-scene';

export interface TimelineShot {
  id: string;
  shotNumber: number;
  title: string;
  narration: string;
  startSec: number;
  endSec: number;
  startFrame: number;
  endFrame: number;
  sceneType: Scene3DType;
  cacheStatus: 'uncached' | 'caching' | 'cached';
  cacheProgress: number;
  blenderPythonCode: string;
  visualVerificationNote: string;
  cameraPreset: string;
}

export interface ProjectSettings {
  styleId: VisualStyleId;
  customStyleId?: string;
  customAvatarName?: string;
  targetDurationSec: number;
  aspectRatio: AspectRatioOption;
  resolution: ExportResolution;
  language: string;
  qualityMode: QualityPassMode;
  aiModel: AIModelId;
  effortLevel: EffortLevel;
  timeLimit: TimeLimitOption;
  momentsCount: 5 | 6 | 7;
  globalStyleKey: string;
  useReferenceVideo: boolean;
  referenceVideoName?: string;
  customReferenceImages: string[];
}

export interface CreatorizeProject {
  id: string;
  name: string;
  topicSummary: string;
  createdAt: string;
  audioInputMode: AudioInputMode;
  audioFileName: string;
  audioDurationSec: number;
  scriptText: string;
  isAudioCleanedAndTimed: boolean;
  transcriptionTimeSec: number;
  wordTimestamps: WordTimestamp[];
  settings: ProjectSettings;
  storyboardGenerated: boolean;
  storyboardConfirmed: boolean;
  storyboardStills: StoryboardStill[];
  buildStatus: 'idle' | 'building' | 'completed';
  buildProgressPercent: number;
  buildElapsedSec: number;
  shots: TimelineShot[];
  tokensUsedMillions: number;
  sessionLimitPercent: number;
  weeklyLimitPercent: number;
  exportTimeSec: number;
  originalComparisonNotes: string;
}

export interface ClaudeAccount {
  id: string;
  label: string;
  planType: 'claude-20x' | 'claude-pro' | 'api-key';
  credential: string;
  sessionUsedPercent: number;
  weeklyUsedPercent: number;
  isActive: boolean;
  status: 'ready' | 'limit-reached';
}

export interface VideoModelAccount {
  id: string;
  provider: 'seedance-2.5' | 'kling-ai' | 'wan-3.0-kie' | 'runway-gen3';
  providerLabel: string;
  accountName: string;
  apiKey: string;
  endpointUrl: string;
  enabled: boolean;
  usageNote: string;
}

export interface AccountsState {
  claudeAccounts: ClaudeAccount[];
  autoSwitchClaudeAccount: boolean;
  googleFlow: {
    email: string;
    sessionToken: string;
    freeCreditsRemaining: number;
    connected: boolean;
  };
  elevenLabs: {
    apiKey: string;
    voiceId: string;
    voiceName: string;
    modelId: string;
    connected: boolean;
  };
  blenderBridge: {
    executablePath: string;
    renderEngine: 'EEVEE_NEXT' | 'CYCLES';
    fps: 30 | 60;
    localWhisperModel: string;
    connected: boolean;
  };
  youtubeApi: {
    channelName: string;
    clientId: string;
    apiKey: string;
    connected: boolean;
    autoAnalyzeRetention: boolean;
    autoReadComments: boolean;
    avgRetentionPercent: number;
    learnedInsights: string[];
  };
  videoModelAccounts: VideoModelAccount[];
  imageGenApi?: {
    provider: 'google-flow-imagen3' | 'flux-1.1-pro' | 'openai-gpt-image' | 'midjourney-bridge';
    apiKey: string;
    enabled: boolean;
  };
}

export interface RoutineSchedule {
  id: string;
  name: string;
  cronTime: string;
  topicQueue: string[];
  styleId: VisualStyleId;
  aiModel: AIModelId;
  effortLevel: EffortLevel;
  qualityMode: QualityPassMode;
  timeLimit: TimeLimitOption;
  autoUploadYoutube: boolean;
  enabled: boolean;
  lastRunResult: string;
}

export interface CustomStyleDefinition {
  id: string;
  name: string;
  createdFromScratch: boolean;
  baseStyleId?: VisualStyleId;
  globalStyleKey: string;
  characterAvatar: string;
  sampleReferenceCount: number;
}
