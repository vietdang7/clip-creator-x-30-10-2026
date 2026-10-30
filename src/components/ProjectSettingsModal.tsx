import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Cpu,
  FileAudio,
  Film,
  Mic,
  Sparkles,
  Upload,
  Wand2,
  Zap,
} from 'lucide-react';
import {
  AIModelId,
  AudioInputMode,
  CustomStyleDefinition,
  EffortLevel,
  ExportResolution,
  ProjectSettings,
  QualityPassMode,
  SubscriptionTier,
  TimeLimitOption,
  VisualStyleId,
} from '../types/creatorize';
import {
  SUPPORTED_LANGUAGES,
  VISUAL_STYLES,
  ZACK_D_DEFAULT_GLOBAL_STYLE_KEY,
} from '../data/presetProjects';
import { ModalDialog } from './ModalDialog';

interface ProjectSettingsModalProps {
  isOpen: boolean;
  mode: 'new-project' | 'edit-settings';
  initialProjectName: string;
  initialAudioFileName: string;
  initialScriptText: string;
  initialAudioInputMode: AudioInputMode;
  initialSettings: ProjectSettings;
  subscriptionTier: SubscriptionTier;
  customStyles: CustomStyleDefinition[];
  elevenLabsVoiceName: string;
  onClose: () => void;
  onSaveProject: (payload: {
    projectName: string;
    audioInputMode: AudioInputMode;
    audioFileName: string;
    scriptText: string;
    settings: ProjectSettings;
  }) => void;
}

const EFFORT_LEVELS: {
  id: EffortLevel;
  label: string;
  badge?: string;
  tokenEstimate: string;
  description: string;
  isDanger?: boolean;
}[] = [
  {
    id: 'low',
    label: 'Low (Mặc định & Khuyên dùng)',
    badge: 'RECOMMENDED',
    tokenEstimate: '~5.4M – 10M tokens (~1% Weekly Claude 20x)',
    description:
      'Opus 5.5 xử lý chuẩn xác không gian 3D ngay từ lần thử đầu tiên ở mức Low effort. Tốc độ nhanh, cực kỳ tiết kiệm token.',
  },
  {
    id: 'medium',
    label: 'Medium',
    tokenEstimate: '~12M – 16M tokens',
    description: 'Tăng thêm bước suy luận trung gian cho các cảnh nhiều vật thể phụ.',
  },
  {
    id: 'high',
    label: 'High',
    tokenEstimate: '~18M – 25M tokens',
    description: 'Dành cho các mô phỏng cơ khí phức tạp có nhiều khớp chuyển động.',
  },
  {
    id: 'extra-high',
    label: 'Extra High',
    badge: 'MAX QUALITY',
    tokenEstimate: '~28M – 38M tokens',
    description:
      'Rất đáng giá nếu bạn ưu tiên chất lượng tối đa cho video chủ lực (Hero Video).',
  },
  {
    id: 'max',
    label: 'Max (Không khuyên dùng)',
    badge: 'DO NOT USE',
    tokenEstimate: '60M+ tokens (Cực chậm)',
    description:
      'CẢNH BÁO: Tuyệt đối không nên chọn mức Max vì nó cực kỳ chậm và không đáng công chờ đợi!',
    isDanger: true,
  },
];

const TIME_LIMIT_OPTIONS: { id: TimeLimitOption; label: string; note: string }[] = [
  { id: 'unlimited', label: 'Unlimited (Không giới hạn)', note: 'Mặc định — để Opus tự do hoàn thiện Ultra Edit' },
  { id: '15m', label: '15 phút (Siêu tiết kiệm Token)', note: 'Gaslight Claude làm siêu gọn cho gói Pro $20' },
  { id: '30m', label: '30 phút (Gaslight Tối Ưu)', note: 'Buộc Claude tối ưu hóa quy trình dựng nhanh' },
  { id: '45m', label: '45 phút (Cân bằng)', note: 'Phù hợp chạy Routines ban đêm' },
  { id: '60m', label: '60 phút', note: 'Giới hạn an toàn cho cảnh 3D phức tạp' },
  { id: '90m', label: '90 phút', note: 'Đủ cho 6-7 Moments chi tiết' },
  { id: '120m', label: '120 phút (2 giờ)', note: 'Tương đương thời gian dựng bản mẫu cắt chai thủy tinh' },
];

export const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({
  isOpen,
  mode,
  initialProjectName,
  initialAudioFileName,
  initialScriptText,
  initialAudioInputMode,
  initialSettings,
  subscriptionTier,
  customStyles,
  elevenLabsVoiceName,
  onClose,
  onSaveProject,
}) => {
  const [projectName, setProjectName] = useState(initialProjectName);
  const [audioInputMode, setAudioInputMode] = useState<AudioInputMode>(initialAudioInputMode);
  const [audioFileName, setAudioFileName] = useState(initialAudioFileName);
  const [scriptText, setScriptText] = useState(initialScriptText);
  const [settings, setSettings] = useState<ProjectSettings>(initialSettings);
  const [isDraggingAudio, setIsDraggingAudio] = useState(false);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);

  React.useEffect(() => {
    setProjectName(initialProjectName);
    setAudioInputMode(initialAudioInputMode);
    setAudioFileName(initialAudioFileName);
    setScriptText(initialScriptText);
    setSettings(initialSettings);
  }, [
    mode,
    initialProjectName,
    initialAudioInputMode,
    initialAudioFileName,
    initialScriptText,
    initialSettings,
  ]);

  const handleStyleChange = (styleId: VisualStyleId) => {
    const found = VISUAL_STYLES.find((s) => s.id === styleId);
    setSettings((prev) => ({
      ...prev,
      styleId,
      globalStyleKey:
        styleId === '3d-informational-zack-d'
          ? ZACK_D_DEFAULT_GLOBAL_STYLE_KEY
          : found?.defaultGlobalStyleKey || prev.globalStyleKey,
    }));
  };

  const handleDropAudio = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingAudio(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setAudioFileName(file.name);
      setAudioInputMode('upload-audio');
    }
  };

  const handleSelectAudioFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFileName(file.name);
      setAudioInputMode('upload-audio');
    }
  };

  const handleAutoGenerateElevenLabsScript = () => {
    setIsGeneratingScript(true);
    setTimeout(() => {
      setScriptText(
        'Buộc thật chặt một sợi dây cotton quanh thân chai thủy tinh, sau đó tẩm xăng bật lửa vào dây và châm lửa đốt. Trong lúc dây đang cháy, hãy xoay tròn cái chai đều tay để ngọn lửa làm nóng bề mặt thủy tinh một cách đồng đều. Ngay khi sợi dây vừa tắt lửa, hãy nhúng thẳng chiếc chai vào chậu nước đá; phần thủy tinh đang nóng sẽ co lại đột ngột, tạo vết nứt tách chai làm đôi gọn gàng.'
      );
      setAudioFileName('elevenlabs_generated_voiceover_30s.mp3');
      setIsGeneratingScript(false);
    }, 250);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProject({
      projectName: projectName.trim() || 'Untitled Zack D. 3D Project',
      audioInputMode,
      audioFileName: audioFileName.trim() || 'input_narration_audio.wav',
      scriptText,
      settings,
    });
    onClose();
  };

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title={
        mode === 'new-project'
          ? 'Khởi Tạo Dự Án Mới (New Project) & Thiết Lập Mô Hình'
          : 'Cài Đặt Dự Án (Project Settings — Opus 5.5 + Blender)'
      }
      subtitle="Thiết lập âm thanh đầu vào, 8 phong cách hình ảnh, chế độ Ultra Edit và mô hình Claude Opus 5.5 (Low Effort)"
      maxWidthClass="max-w-5xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* 1. Project Name & Audio Source */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 bg-slate-900/70 p-4 rounded-xl border border-slate-800">
          <div className="lg:col-span-5 space-y-3">
            <div>
              <label htmlFor="project-name-input" className="block font-semibold text-slate-200 mb-1">
                Tên Dự Án (Project Name)
              </label>
              <input
                id="project-name-input"
                data-testid="input-project-name"
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-blue-500 focus:outline-none"
                placeholder="VD: Glass Bottle to Drinking Cup (Zack D. 3D)"
              />
            </div>

            <div>
              <span className="block font-semibold text-slate-200 mb-1.5">
                Phương Thức Nạp Âm Thanh / Kịch Bản
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  data-testid="audio-mode-upload"
                  onClick={() => setAudioInputMode('upload-audio')}
                  className={`p-2.5 rounded-lg border text-left transition flex items-center gap-2 ${
                    audioInputMode === 'upload-audio'
                      ? 'bg-blue-600/20 border-blue-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileAudio className="w-4 h-4 text-blue-400 shrink-0" />
                  <div>
                    <div className="font-semibold">Kéo Thả File Audio</div>
                    <div className="text-[10px] text-slate-400">Chỉ cần nạp âm thanh</div>
                  </div>
                </button>
                <button
                  type="button"
                  data-testid="audio-mode-elevenlabs"
                  onClick={() => setAudioInputMode('ai-script-elevenlabs')}
                  className={`p-2.5 rounded-lg border text-left transition flex items-center gap-2 ${
                    audioInputMode === 'ai-script-elevenlabs'
                      ? 'bg-purple-600/20 border-purple-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Mic className="w-4 h-4 text-purple-400 shrink-0" />
                  <div>
                    <div className="font-semibold">AI Script + ElevenLabs</div>
                    <div className="text-[10px] text-slate-400">Tự viết & tạo giọng đọc</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Reference Video Toggle (Explained in Part 1: Everest used reference video, Bottle & Bullet are Audio-Only) */}
            <div className="pt-1 border-t border-slate-800/80 space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  data-testid="checkbox-reference-video"
                  checked={settings.useReferenceVideo}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      useReferenceVideo: e.target.checked,
                      referenceVideoName: e.target.checked
                        ? prev.referenceVideoName || 'reference_sample_clip.mp4'
                        : undefined,
                    }))
                  }
                  className="mt-0.5 rounded border-slate-700 bg-slate-950 text-blue-600"
                />
                <div>
                  <span className="font-semibold text-slate-200">
                    Đính kèm Video Tham Chiếu (Optional Reference Video)
                  </span>
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                    Mặc định <strong>TẮT (Audio-Only)</strong> như dự án Cắt chai thủy tinh & Viên đạn để Creatorize tự suy luận 100% cảnh 3D từ âm thanh. Chỉ bật khi cần đối chiếu góc máy mẫu (như dự án Núi Everest).
                  </p>
                </div>
              </label>

              {settings.useReferenceVideo && (
                <div className="pl-6">
                  <input
                    type="text"
                    aria-label="Reference video file name"
                    data-testid="input-reference-video-name"
                    value={settings.referenceVideoName || ''}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        referenceVideoName: e.target.value,
                      }))
                    }
                    placeholder="Tên file video mẫu (VD: zack_d_everest_reference.mp4)"
                    className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-amber-500/40 text-amber-200 font-mono text-[11px]"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col justify-between space-y-3">
            {audioInputMode === 'upload-audio' ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingAudio(true);
                }}
                onDragLeave={() => setIsDraggingAudio(false)}
                onDrop={handleDropAudio}
                data-testid="audio-dropzone"
                className={`flex-1 flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed transition ${
                  isDraggingAudio
                    ? 'border-blue-400 bg-blue-500/10'
                    : 'border-slate-700 bg-slate-950/70 hover:border-blue-500/60'
                }`}
              >
                <Upload className="w-7 h-7 text-blue-400 mb-2" />
                <p className="font-semibold text-slate-200 text-center">
                  Kéo thả trực tiếp file âm thanh (.wav, .mp3, .m4a) vào đây
                </p>
                <p className="text-[11px] text-slate-400 mt-1 text-center">
                  Chỉ cần nạp duy nhất file âm thanh đầu vào — Creatorize + Claude Opus 5.5 sẽ tự suy luận toàn bộ hoạt họa 3D.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2 w-full max-w-lg">
                  <input
                    type="text"
                    aria-label="Audio file name"
                    value={audioFileName}
                    onChange={(e) => setAudioFileName(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-blue-300 font-mono text-[11px]"
                  />
                  <label className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold cursor-pointer">
                    Chọn File
                    <input
                      type="file"
                      accept=".wav,.mp3,.m4a,audio/*"
                      onChange={handleSelectAudioFile}
                      className="hidden"
                    />
                  </label>
                  <span className="px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
                    Audio Ready
                  </span>
                </div>
                <div className="mt-3 w-full">
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Lời thoại / Transcript của file Audio (Tự động nhận diện hoặc nhập nội dung để đồng bộ khung hình)
                  </label>
                  <textarea
                    rows={2}
                    data-testid="textarea-script-input"
                    value={scriptText}
                    onChange={(e) => setScriptText(e.target.value)}
                    className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:border-blue-500 focus:outline-none"
                    placeholder="Nội dung lời thoại của file âm thanh..."
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col space-y-2 bg-slate-950/80 p-3.5 rounded-xl border border-purple-500/30">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-purple-300 flex items-center gap-1.5">
                    <Wand2 className="w-3.5 h-3.5" />
                    Trình Viết Kịch Bản AI & Giọng Đọc ElevenLabs Tích Hợp ({elevenLabsVoiceName})
                  </span>
                  <button
                    type="button"
                    onClick={handleAutoGenerateElevenLabsScript}
                    className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white font-semibold text-[11px]"
                  >
                    {isGeneratingScript ? 'Đang sinh kịch bản...' : 'Tự Viết Kịch Bản & Tạo Voice'}
                  </button>
                </div>
                <textarea
                  rows={4}
                  data-testid="textarea-script-input"
                  value={scriptText}
                  onChange={(e) => setScriptText(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:border-purple-500 focus:outline-none"
                  placeholder="Nhập chủ đề hoặc lời thoại kịch bản để ElevenLabs tạo file âm thanh..."
                />
              </div>
            )}
          </div>
        </div>

        {/* 2. Choose Visual Style (All 8 Styles from Transcript + Custom Style Support) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              Chọn Phong Cách Hình Ảnh (8 Phong Cách Chuẩn Creatorize)
            </h3>
            <span className="text-[11px] text-slate-400">
              Đã chọn:{' '}
              <strong className="text-blue-300">
                {VISUAL_STYLES.find((s) => s.id === settings.styleId)?.name}
              </strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {VISUAL_STYLES.map((style) => {
              const isSelected = settings.styleId === style.id;
              return (
                <button
                  key={style.id}
                  type="button"
                  data-testid={`style-card-${style.id}`}
                  onClick={() => handleStyleChange(style.id)}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between bg-gradient-to-br ${
                    style.accentGradient
                  } ${
                    isSelected
                      ? 'border-blue-400 ring-2 ring-blue-500/40 shadow-lg'
                      : 'border-slate-800 hover:border-slate-600 opacity-85 hover:opacity-100'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-1">
                      <span className="font-bold text-white text-xs leading-snug">{style.name}</span>
                      {style.badge && (
                        <span className="px-1.5 py-0.5 rounded bg-blue-500 text-white font-extrabold text-[9px] tracking-wider shrink-0">
                          {style.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed">{style.description}</p>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
                    <span>{style.is3D ? '🧊 3D Blender Pipeline' : '🎨 2D Motion Pipeline'}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Optional Custom Style & Custom Character Avatar (Premium Feature) */}
          {customStyles.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 px-3.5 py-2.5 rounded-lg border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-[10px]">
                  PREMIUM CUSTOM STYLE & AVATAR
                </span>
                <span className="text-slate-300">Biến thể phong cách đã huấn luyện & Nhân vật đại diện riêng:</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label="Custom style preset"
                  value={settings.customStyleId || ''}
                  onChange={(e) => {
                    const cs = customStyles.find((c) => c.id === e.target.value);
                    setSettings((prev) => ({
                      ...prev,
                      customStyleId: e.target.value || undefined,
                      globalStyleKey: cs ? cs.globalStyleKey : prev.globalStyleKey,
                      customAvatarName: cs ? cs.characterAvatar : prev.customAvatarName,
                    }));
                  }}
                  className="px-2.5 py-1 rounded bg-slate-950 border border-slate-700 text-slate-200"
                >
                  <option value="">-- Mặc định chuẩn (Standard Preset) --</option>
                  {customStyles.map((cs) => (
                    <option key={cs.id} value={cs.id}>
                      {cs.name} ({cs.characterAvatar})
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  aria-label="Custom avatar character name"
                  data-testid="input-custom-avatar"
                  value={settings.customAvatarName || ''}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      customAvatarName: e.target.value || undefined,
                    }))
                  }
                  placeholder="Nhân vật đại diện (VD: Zack D. Dummy)"
                  className="px-2.5 py-1 rounded bg-slate-950 border border-slate-700 text-amber-200 text-[11px]"
                />
              </div>
            </div>
          )}
        </div>

        {/* 3. AI Model Selection (Claude Opus 5.5 vs Sonnet 5.5) & Effort Level (Low, Medium, High, Extra High, Max) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left: Model & Quality Pass Mode */}
          <div className="lg:col-span-6 space-y-4 bg-slate-900/70 p-4 rounded-xl border border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-400" />
              Mô Hình AI & Chế Độ Kiểm Duyệt (Model & Quality Pass)
            </h3>

            {/* AI Model: Opus 5.5 vs Sonnet 5.5 */}
            <div className="space-y-2">
              <label className="block font-semibold text-slate-300">Chọn Mô Hình Claude (Spatial 3D Engine)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  data-testid="model-select-opus"
                  onClick={() => setSettings((prev) => ({ ...prev, aiModel: 'claude-opus-5-5' }))}
                  className={`p-3 rounded-xl border text-left transition ${
                    settings.aiModel === 'claude-opus-5-5'
                      ? 'bg-blue-600/20 border-blue-400 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">Claude Opus 5.5</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                      BEST 3D SPATIAL
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed">
                    Khả năng tư duy và nhận thức không gian 3D (spatial awareness) vượt trội. Xử lý chuẩn xác ngay từ lần thử đầu tiên dù chỉ để mức <strong>Low effort</strong>.
                  </p>
                </button>

                <button
                  type="button"
                  data-testid="model-select-sonnet"
                  onClick={() => setSettings((prev) => ({ ...prev, aiModel: 'claude-sonnet-5-5' }))}
                  className={`p-3 rounded-xl border text-left transition ${
                    settings.aiModel === 'claude-sonnet-5-5'
                      ? 'bg-amber-600/20 border-amber-400 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">Claude Sonnet 5.5</span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                      WEAK 3D SPATIAL
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed">
                    Khi chạy bước <em>visual verification pass</em>, Sonnet nhận biết lỗi sai nhưng lúng túng không biết cách sửa, làm tốn thời gian & đốt token vá lỗi nhỏ.
                  </p>
                </button>
              </div>

              {settings.aiModel === 'claude-sonnet-5-5' && (
                <div
                  data-testid="sonnet-spatial-warning"
                  className="p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-200 flex items-start gap-2 text-[11px]"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Khuyến nghị từ tác giả:</strong> Nên gắn bó với <strong>Opus 5.5 ở mức Low</strong> nếu muốn sản phẩm 3D chỉn chu. Sonnet 5.5 kém xa Opus (Low) về nhận thức không gian 3D trong Blender.
                  </span>
                </div>
              )}
            </div>

            {/* Quality Pass Mode: Standard Verified vs Ultra Edit */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="block font-semibold text-slate-300">
                Chế Độ Kiểm Duyệt & Làm Mịn (Verification / Edit Pass Mode)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  data-testid="quality-mode-standard"
                  onClick={() => setSettings((prev) => ({ ...prev, qualityMode: 'standard-verified' }))}
                  className={`p-3 rounded-xl border text-left transition ${
                    settings.qualityMode === 'standard-verified'
                      ? 'bg-slate-800 border-slate-400 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="font-bold text-white">Standard Verified</div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Kiểm duyệt tiêu chuẩn. Khả dụng trên cả gói Standard & Premium.
                  </p>
                </button>

                <button
                  type="button"
                  data-testid="quality-mode-ultra"
                  onClick={() => setSettings((prev) => ({ ...prev, qualityMode: 'ultra-edit' }))}
                  className={`p-3 rounded-xl border text-left transition ${
                    settings.qualityMode === 'ultra-edit'
                      ? 'bg-emerald-600/20 border-emerald-400 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Ultra Edit (Ultra Edit Pass)</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold">
                      RECOMMENDED
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1">
                    Chế độ làm mịn siêu cấp: chạy bước tự kiểm tra bằng hình ảnh (Visual Verification Pass) để trau chuốt chuyển động 3D mượt nhất.
                  </p>
                </button>
              </div>
              {subscriptionTier === 'standard' && settings.qualityMode === 'ultra-edit' && (
                <p className="text-[11px] text-amber-300">
                  * Lưu ý: Tính năng Ultra Edit yêu cầu gói <strong>Premium</strong> (Hiện đã mở khóa thử nghiệm trong khung sườn).
                </p>
              )}
            </div>
          </div>

          {/* Right: Effort Setting (Low -> Max) & Duration/Time Limit */}
          <div className="lg:col-span-6 space-y-4 bg-slate-900/70 p-4 rounded-xl border border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Mức Thiết Lập Nỗ Lực (Effort Setting) & Giới Hạn Thời Gian
            </h3>

            <div className="space-y-1.5">
              {EFFORT_LEVELS.map((eff) => {
                const selected = settings.effortLevel === eff.id;
                return (
                  <button
                    key={eff.id}
                    type="button"
                    data-testid={`effort-level-${eff.id}`}
                    onClick={() => setSettings((prev) => ({ ...prev, effortLevel: eff.id }))}
                    className={`w-full p-2.5 rounded-lg border text-left transition flex items-start justify-between gap-2 ${
                      selected
                        ? eff.isDanger
                          ? 'bg-red-950/60 border-red-500 text-white'
                          : 'bg-blue-600/20 border-blue-400 text-white'
                        : 'bg-slate-950 border-slate-800/90 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white">{eff.label}</span>
                        {eff.badge && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold ${
                              eff.isDanger
                                ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                            }`}
                          >
                            {eff.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{eff.description}</p>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-300 shrink-0">{eff.tokenEstimate}</span>
                  </button>
                );
              })}
            </div>

            {settings.effortLevel === 'max' && (
              <div
                data-testid="max-effort-warning"
                className="p-2.5 rounded-lg bg-red-500/15 border border-red-500/40 text-red-200 flex items-center gap-2 text-[11px]"
              >
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>
                  <strong>Cảnh báo từ video:</strong> Tuyệt đối không nên chọn mức <strong>Max</strong> vì nó cực kỳ chậm và không đáng công chờ đợi! Hãy chọn <strong>Low</strong> (tốc độ nhanh, tối ưu) hoặc <strong>Extra High</strong> (chất lượng tối đa).
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 4. Duration (30s), Time Limit ("Gaslight Claude"), Resolution (4K), Aspect Ratio (9:16), Language (30+) */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 bg-slate-900/70 p-4 rounded-xl border border-slate-800">
          <div>
            <label htmlFor="select-duration" className="block font-semibold text-slate-300 mb-1">
              Thời Lượng Video (Duration)
            </label>
            <select
              id="select-duration"
              data-testid="select-duration"
              value={settings.targetDurationSec}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, targetDurationSec: Number(e.target.value) }))
              }
              className="w-full px-2.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
            >
              <option value={15}>15 giây (Shorts ngắn)</option>
              <option value={30}>30 giây (Chuẩn Zack D. Tutorial)</option>
              <option value={36}>36 giây (Everest Documentary)</option>
              <option value={45}>45 giây</option>
              <option value={60}>60 giây (Full Shorts)</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="select-time-limit" className="block font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Giới Hạn Thời Gian Dựng (Time Limit — Mẹo Gaslight Claude)
            </label>
            <select
              id="select-time-limit"
              data-testid="select-time-limit"
              value={settings.timeLimit}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, timeLimit: e.target.value as TimeLimitOption }))
              }
              className="w-full px-2.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
            >
              {TIME_LIMIT_OPTIONS.map((tl) => (
                <option key={tl.id} value={tl.id}>
                  {tl.label} — {tl.note}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-amber-300/90 mt-1">
              💡 Mẹo nhỏ: Nếu ngân sách token hạn hẹp, đặt giới hạn thời gian sẽ &ldquo;thao túng tâm lý&rdquo; (gaslight) Claude làm việc gọn gàng & tối ưu hơn.
            </p>
          </div>

          <div>
            <label htmlFor="select-resolution" className="block font-semibold text-slate-300 mb-1">
              Khung Hình & Độ Phân Giải
            </label>
            <div className="flex gap-1.5">
              <select
                aria-label="Aspect Ratio"
                value={settings.aspectRatio}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    aspectRatio: e.target.value as '9:16' | '16:9',
                  }))
                }
                className="w-1/2 px-2 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
              >
                <option value="9:16">9:16 (Vertical)</option>
                <option value="16:9">16:9 (Horizontal)</option>
              </select>
              <select
                id="select-resolution"
                data-testid="select-resolution"
                value={settings.resolution}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    resolution: e.target.value as ExportResolution,
                  }))
                }
                className="w-1/2 px-2 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
              >
                <option value="1080p">1080p HD</option>
                <option value="4K">4K Ultra (Premium)</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="select-language" className="block font-semibold text-slate-300 mb-1">
              Ngôn Ngữ (30+ Languages)
            </label>
            <select
              id="select-language"
              data-testid="select-language"
              value={settings.language}
              onChange={(e) => setSettings((prev) => ({ ...prev, language: e.target.value }))}
              className="w-full px-2.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <div className="text-[11px] text-slate-400">
            Chi phí cố định (Fixed Costs): Chạy thoải mái trên gói <strong>Claude 20x</strong> (~1% weekly limit/video) hoặc <strong>Claude Pro $20/tháng</strong>.
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
            >
              Hủy
            </button>
            <button
              type="submit"
              data-testid="btn-save-project-settings"
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-2 shadow-lg"
            >
              <Film className="w-4 h-4" />
              {mode === 'new-project' ? 'Create the project (Khởi tạo dự án)' : 'Lưu Cài Đặt Dự Án'}
            </button>
          </div>
        </div>
      </form>
    </ModalDialog>
  );
};
