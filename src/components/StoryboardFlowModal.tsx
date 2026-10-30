import React, { useEffect, useState } from 'react';
import {
  Check,
  Clock,
  Edit3,
  Image as ImageIcon,
  Info,
  Play,
  Sparkles,
  Upload,
  Wand2,
} from 'lucide-react';
import {
  CreatorizeProject,
  QualityPassMode,
  StoryboardStill,
  SubscriptionTier,
  TimeLimitOption,
} from '../types/creatorize';
import { CLAUDE_STYLE_SUGGESTIONS } from '../data/presetProjects';
import { generateStoryboardStillsForProject } from '../services/aiPipelineService';
import { ModalDialog } from './ModalDialog';

interface StoryboardFlowModalProps {
  isOpen: boolean;
  project: CreatorizeProject;
  googleFlowEmail: string;
  googleFlowCredits: number;
  subscriptionTier?: SubscriptionTier;
  onDeductGoogleFlowCredits?: (creditsUsed: number) => void;
  onClose: () => void;
  onUpdateStoryboardAndStartBuild: (payload: {
    momentsCount: 5 | 6 | 7;
    globalStyleKey: string;
    selectedStills: StoryboardStill[];
    qualityMode: QualityPassMode;
    timeLimit: TimeLimitOption;
    customReferenceImages: string[];
    startBuildImmediately: boolean;
  }) => void;
}

export const StoryboardFlowModal: React.FC<StoryboardFlowModalProps> = ({
  isOpen,
  project,
  googleFlowEmail,
  googleFlowCredits,
  subscriptionTier = 'premium',
  onDeductGoogleFlowCredits,
  onClose,
  onUpdateStoryboardAndStartBuild,
}) => {
  const [momentsCount, setMomentsCount] = useState<5 | 6 | 7>(project.settings.momentsCount);
  const [globalStyleKey, setGlobalStyleKey] = useState(project.settings.globalStyleKey);
  const [isEditingStyleKey, setIsEditingStyleKey] = useState(false);
  const [stillsGenerated, setStillsGenerated] = useState(true);
  const [isGeneratingStills, setIsGeneratingStills] = useState(false);
  const [stills, setStills] = useState<StoryboardStill[]>(() =>
    project.storyboardStills.length > 0
      ? project.storyboardStills
      : generateStoryboardStillsForProject(
          project,
          project.settings.momentsCount,
          project.settings.globalStyleKey
        )
  );
  const [confirmedStills, setConfirmedStills] = useState(project.storyboardConfirmed);
  const [qualityMode, setQualityMode] = useState<QualityPassMode>(
    subscriptionTier === 'standard' ? 'standard-verified' : project.settings.qualityMode
  );
  const [timeLimit, setTimeLimit] = useState<TimeLimitOption>(project.settings.timeLimit);
  const [customRefs, setCustomRefs] = useState<string[]>(project.settings.customReferenceImages);
  const [suggestionIdx, setSuggestionIdx] = useState(0);

  useEffect(() => {
    setMomentsCount(project.settings.momentsCount);
    setGlobalStyleKey(project.settings.globalStyleKey);
    setQualityMode(
      subscriptionTier === 'standard' ? 'standard-verified' : project.settings.qualityMode
    );
    setTimeLimit(project.settings.timeLimit);
    setCustomRefs(project.settings.customReferenceImages);
    setConfirmedStills(project.storyboardConfirmed);
    setStills(
      project.storyboardStills.length > 0
        ? project.storyboardStills
        : generateStoryboardStillsForProject(
            project,
            project.settings.momentsCount,
            project.settings.globalStyleKey
          )
    );
  }, [project, subscriptionTier]);

  const selectedCount = stills.filter((s) => s.selected).length;

  const handleMomentsChange = (count: 5 | 6 | 7) => {
    setMomentsCount(count);
    // Automatically adjust selected count to match target momentsCount
    let picked = 0;
    const baseStills =
      stills.length >= count
        ? stills
        : generateStoryboardStillsForProject(project, count, globalStyleKey);
    const updated = baseStills.map((still) => {
      if (picked < count && still.momentIndex <= count) {
        if (still.variantLabel.includes('Option A') || still.variantLabel.includes('Bonus')) {
          picked++;
          return { ...still, selected: true };
        }
      }
      return { ...still, selected: false };
    });
    setStills(updated);
    setConfirmedStills(false);
  };

  const handleAskClaudeStyleSuggestion = () => {
    const nextIdx = (suggestionIdx + 1) % CLAUDE_STYLE_SUGGESTIONS.length;
    setSuggestionIdx(nextIdx);
    setGlobalStyleKey(CLAUDE_STYLE_SUGGESTIONS[nextIdx].styleKey);
    setIsEditingStyleKey(true);
  };

  const handleMakeTheStills = () => {
    setIsGeneratingStills(true);
    setConfirmedStills(false);
    setTimeout(() => {
      const freshlyGenerated = generateStoryboardStillsForProject(
        project,
        momentsCount,
        globalStyleKey
      );
      setStills(freshlyGenerated);
      setStillsGenerated(true);
      setIsGeneratingStills(false);
      onDeductGoogleFlowCredits?.(momentsCount * 2);
    }, 300);
  };

  const toggleStillSelection = (id: string) => {
    setStills((prev) =>
      prev.map((s) => (s.id === id ? { ...s, selected: !s.selected } : s))
    );
    setConfirmedStills(false);
  };

  const handleConfirmSelectedStills = () => {
    // Ensure exactly `momentsCount` stills are selected if current selection count differs
    if (selectedCount !== momentsCount) {
      let count = 0;
      setStills((prev) =>
        prev.map((s) => {
          if (s.selected && count < momentsCount) {
            count++;
            return s;
          }
          if (!s.selected && count < momentsCount && !s.variantLabel.includes('Option B')) {
            count++;
            return { ...s, selected: true };
          }
          return { ...s, selected: false };
        })
      );
    }
    setConfirmedStills(true);
  };

  const handleAddCustomRefImage = () => {
    const newRef = `custom_style_ref_${customRefs.length + 1}.png`;
    setCustomRefs((prev) => [...prev, newRef]);
  };

  const numberWordMap: Record<5 | 6 | 7, string> = {
    5: 'five',
    6: 'six',
    7: 'seven',
  };

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Scene Building & Storyboard (Google Flow + Global Style Key)"
      subtitle="Thiết lập phong cách (Style) và định hướng hình ảnh (Vision) trước khi Claude Opus 5.5 viết code dựng cảnh Blender 3D"
      maxWidthClass="max-w-5xl"
    >
      <div className="space-y-5 text-xs">
        {/* Top Row: Moments (5-7) & Google Flow Account Status */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
          <div className="md:col-span-6 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-white text-sm flex items-center gap-2">
                <span>1. Số lượng khoảnh khắc (Moments: 5 – 7)</span>
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px]">
                  Mặc định: 5
                </span>
              </label>
            </div>
            <p className="text-[11px] text-slate-400">
              Bộ ảnh tham chiếu định hướng sẽ được nạp cho Claude trước khi toàn bộ quá trình viết code dựng cảnh 3D bắt đầu.
            </p>
            <div className="flex items-center gap-2 pt-1">
              {([5, 6, 7] as const).map((num) => (
                <button
                  key={num}
                  type="button"
                  data-testid={`moments-btn-${num}`}
                  onClick={() => handleMomentsChange(num)}
                  className={`flex-1 py-2 px-3 rounded-lg font-bold border transition ${
                    momentsCount === num
                      ? 'bg-blue-600 border-blue-400 text-white shadow-lg'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {num} Moments {num === 5 ? '(Recommended)' : ''}
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-6 flex flex-col justify-between bg-slate-950/90 p-3.5 rounded-xl border border-emerald-500/30">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                Google Flow Image Engine (0đ Chi Phí Phát Sinh)
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                Connected ✓
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1">
              Tài khoản Google cá nhân: <strong>{googleFlowEmail}</strong> • Tận dụng{' '}
              <strong className="text-emerald-300" data-testid="google-flow-credits-count">
                {googleFlowCredits} Free Credits
              </strong>{' '}
              có sẵn trong Google Flow.
            </p>
            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-800">
              <span>Nguồn phân tích: Lời thoại vừa tách từ âm thanh ({project.wordTimestamps.length} từ)</span>
              <span className="text-blue-300 font-semibold">Auto-Prompting Enabled</span>
            </div>
          </div>
        </div>

        {/* 2. Global Style Key (Pre-tuned for Zack D. Films + Edit + Ask Claude + Custom Reference Upload) */}
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                2. Từ Khóa Phong Cách Tổng Thể (Global Style Key)
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px]">
                  Zack D. Films Bluish Infinite Grid Preset
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Đặc trưng: Phông nền lưới vô tận màu xanh lam (bluish infinite grid) cùng vật thể chính được trưng bày ở ngay trung tâm.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                data-testid="btn-edit-style-key"
                onClick={() => setIsEditingStyleKey((prev) => !prev)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 font-semibold"
              >
                <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                {isEditingStyleKey ? 'Khóa (Lock)' : 'Chỉnh sửa (Edit)'}
              </button>
              <button
                type="button"
                data-testid="btn-ask-claude-style"
                onClick={handleAskClaudeStyleSuggestion}
                className="px-2.5 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 flex items-center gap-1.5 font-semibold"
              >
                <Wand2 className="w-3.5 h-3.5 text-indigo-300" />
                Nhờ Claude Gợi Ý Phong Cách
              </button>
              <button
                type="button"
                data-testid="btn-upload-custom-ref"
                onClick={handleAddCustomRefImage}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 font-semibold"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                Tải Ảnh Mẫu Riêng ({customRefs.length})
              </button>
            </div>
          </div>

          <textarea
            data-testid="textarea-global-style-key"
            rows={2}
            readOnly={!isEditingStyleKey}
            value={globalStyleKey}
            onChange={(e) => setGlobalStyleKey(e.target.value)}
            className={`w-full p-3 rounded-lg border font-mono text-xs leading-relaxed transition ${
              isEditingStyleKey
                ? 'bg-slate-950 border-blue-500 text-white'
                : 'bg-slate-950/60 border-slate-800 text-blue-200'
            }`}
          />

          {customRefs.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] text-slate-400">Ảnh tham chiếu đã đính kèm:</span>
              {customRefs.map((ref) => (
                <span
                  key={ref}
                  className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px]"
                >
                  🖼️ {ref}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 3. Make the Stills & Select Favorite Moments ("Make the stills" -> "Use those five") */}
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-400" />
                3. Khởi Chạy Google Flow & Chọn Ảnh Định Hướng Storyboard
              </h3>
              <p className="text-[11px] text-slate-400">
                Đã chọn <strong className="text-blue-300">{selectedCount} / {momentsCount}</strong> bức ảnh định hướng cho Claude Opus 5.5.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                data-testid="btn-make-the-stills"
                onClick={handleMakeTheStills}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5 shadow"
              >
                <Sparkles className="w-4 h-4" />
                {isGeneratingStills ? 'Google Flow đang tạo ảnh...' : 'Make the stills (Tạo ảnh tĩnh)'}
              </button>

              {stillsGenerated && (
                <button
                  type="button"
                  data-testid="btn-use-those-stills"
                  onClick={handleConfirmSelectedStills}
                  className={`px-4 py-2 rounded-lg font-bold flex items-center gap-1.5 transition shadow ${
                    confirmedStills
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  {confirmedStills
                    ? `Đã xác nhận ${momentsCount} ảnh (Use those ${numberWordMap[momentsCount]}) ✓`
                    : `Use those ${numberWordMap[momentsCount]} (Sử dụng ${momentsCount} ảnh này)`}
                </button>
              )}
            </div>
          </div>

          {/* Important Note from Transcript about Diffusion vs Blender 3D */}
          <div className="p-2.5 rounded-lg bg-blue-950/50 border border-blue-500/30 text-blue-200 flex items-start gap-2 text-[11px]">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <span>
              <strong>Lưu ý từ tác giả:</strong> Những bức ảnh tĩnh từ Google Flow chỉ đóng vai trò <em>định hướng bố cục tổng thể (kim chỉ nam)</em> cho quá trình dựng. Video 3D cuối cùng sẽ không giống 100% ảnh tĩnh bởi cơ chế tạo ảnh khuếch tán (diffusion models) khác hoàn toàn cách Claude Opus 5.5 viết code dựng hình học trong Blender.
            </span>
          </div>

          {/* Grid of Generated Candidate Stills */}
          {stillsGenerated && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
              {stills.map((still) => (
                <div
                  key={still.id}
                  data-testid={`still-card-${still.id}`}
                  onClick={() => toggleStillSelection(still.id)}
                  className={`cursor-pointer p-3 rounded-xl border transition flex flex-col justify-between ${
                    still.selected
                      ? 'bg-blue-950/60 border-blue-400 ring-2 ring-blue-500/30'
                      : 'bg-slate-950/80 border-slate-800 opacity-75 hover:opacity-100'
                  }`}
                >
                  <div>
                    {/* Simulated Zack D. Bluish Infinite Grid Still Thumbnail */}
                    <div className="h-24 rounded-lg bg-gradient-to-b from-[#0f296b] to-[#06102e] border border-blue-500/30 p-2 flex flex-col justify-between relative overflow-hidden mb-2">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="px-1.5 py-0.5 rounded bg-black/60 text-blue-300 font-semibold">
                          {still.variantLabel}
                        </span>
                        <span className="font-mono text-slate-300 bg-black/60 px-1.5 py-0.5 rounded">
                          {still.timestampRange}
                        </span>
                      </div>
                      <div className="text-[10px] text-center text-blue-100 font-semibold line-clamp-2 px-1">
                        [3D Blue Grid] {still.title}
                      </div>
                      <div className="flex justify-end">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            still.selected
                              ? 'bg-blue-500 text-white'
                              : 'bg-slate-800 text-slate-400 border border-slate-600'
                          }`}
                        >
                          {still.selected ? '✓' : '+'}
                        </span>
                      </div>
                    </div>

                    <div className="font-bold text-white text-xs leading-snug">{still.title}</div>
                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{still.prompt}</p>
                  </div>

                  <div className="mt-2 pt-1.5 border-t border-slate-800/80 text-[10px] text-emerald-300 truncate">
                    🎙️ &ldquo;{still.dialogueSnippet}&rdquo;
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. Quality Level (Ultra Edit) & Time Limit (Unlimited / Gaslight Claude) + Start Build */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-[#0d1832] p-4 rounded-xl border border-blue-500/30 items-center">
          <div className="md:col-span-4 space-y-1">
            <label htmlFor="storyboard-quality-select" className="block font-bold text-white">
              Quality Level (Cấp độ chất lượng)
            </label>
            <select
              id="storyboard-quality-select"
              data-testid="storyboard-quality-select"
              value={qualityMode}
              onChange={(e) => setQualityMode(e.target.value as QualityPassMode)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-semibold"
            >
              <option value="ultra-edit" disabled={subscriptionTier === 'standard'}>
                Ultra Edit (Làm mịn cao cấp + Visual Verification){subscriptionTier === 'standard' ? ' — Yêu cầu Premium' : ''}
              </option>
              <option value="standard-verified">Standard Verified (Kiểm duyệt tiêu chuẩn)</option>
            </select>
          </div>

          <div className="md:col-span-4 space-y-1">
            <label htmlFor="storyboard-timelimit-select" className="block font-bold text-white flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Time Limit (Giới hạn thời gian)
            </label>
            <select
              id="storyboard-timelimit-select"
              data-testid="storyboard-timelimit-select"
              value={timeLimit}
              onChange={(e) => setTimeLimit(e.target.value as TimeLimitOption)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-semibold"
            >
              <option value="unlimited">Unlimited (Không giới hạn — Chuẩn Tutorial)</option>
              <option value="15m">15 mins (Gaslight Claude tiết kiệm token tối đa)</option>
              <option value="30m">30 mins (Gaslight Claude làm gọn)</option>
              <option value="45m">45 mins</option>
              <option value="60m">60 mins</option>
              <option value="90m">90 mins</option>
              <option value="120m">120 mins (2 giờ)</option>
            </select>
          </div>

          <div className="md:col-span-4 flex flex-col justify-end gap-2">
            <button
              type="button"
              data-testid="btn-start-build"
              onClick={() => {
                onUpdateStoryboardAndStartBuild({
                  momentsCount,
                  globalStyleKey,
                  selectedStills: stills,
                  qualityMode,
                  timeLimit,
                  customReferenceImages: customRefs,
                  startBuildImmediately: true,
                });
                onClose();
              }}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl"
            >
              <Play className="w-4 h-4 fill-current" />
              Start build (Bắt đầu dựng 3D)
            </button>
          </div>
        </div>
      </div>
    </ModalDialog>
  );
};
