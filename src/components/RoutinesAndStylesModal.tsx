import React, { useState } from 'react';
import {
  Check,
  Clock,
  Crown,
  MessageSquare,
  Moon,
  Palette,
  Plus,
  Sparkles,
  TrendingUp,
  UserCheck,
  Youtube,
} from 'lucide-react';
import {
  CustomStyleDefinition,
  RoutineSchedule,
  SubscriptionTier,
  VisualStyleId,
} from '../types/creatorize';
import { VISUAL_STYLES } from '../data/presetProjects';
import { ModalDialog } from './ModalDialog';

interface RoutinesAndStylesModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptionTier: SubscriptionTier;
  onChangeTier: (tier: SubscriptionTier) => void;
  routines: RoutineSchedule[];
  onAddRoutine: (routine: RoutineSchedule) => void;
  onToggleRoutine: (id: string) => void;
  customStyles: CustomStyleDefinition[];
  onAddCustomStyle: (style: CustomStyleDefinition) => void;
  youtubeInsights: string[];
  avgRetentionPercent: number;
}

export const RoutinesAndStylesModal: React.FC<RoutinesAndStylesModalProps> = ({
  isOpen,
  onClose,
  subscriptionTier,
  onChangeTier,
  routines,
  onAddRoutine,
  onToggleRoutine,
  customStyles,
  onAddCustomStyle,
  youtubeInsights,
  avgRetentionPercent,
}) => {
  const [activeTab, setActiveTab] = useState<'plans' | 'routines' | 'custom-styles' | 'support'>('plans');

  // New Routine Form
  const [routineName, setRoutineName] = useState('');
  const [routineTime, setRoutineTime] = useState('02:00 AM (Mỗi đêm)');
  const [routineTopic, setRoutineTopic] = useState('');

  // New Custom Style Form
  const [styleName, setStyleName] = useState('');
  const [fromScratch, setFromScratch] = useState(false);
  const [baseStyleId, setBaseStyleId] = useState<VisualStyleId>('3d-informational-zack-d');
  const [stylePrompt, setStylePrompt] = useState('');
  const [avatarName, setAvatarName] = useState('Zack D. Anatomical Dummy');

  // 1-on-1 Author Support Message
  const [supportType, setSupportType] = useState<'style-help' | 'bug-report' | 'feature-request'>('style-help');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSent, setSupportSent] = useState(false);

  const handleCreateRoutine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!routineName.trim()) return;
    onAddRoutine({
      id: `routine-${Date.now()}`,
      name: routineName.trim(),
      cronTime: routineTime,
      topicQueue: [routineTopic.trim() || 'Chủ đề tự động từ bình luận YouTube'],
      styleId: '3d-informational-zack-d',
      aiModel: 'claude-opus-5-5',
      effortLevel: 'low',
      qualityMode: 'ultra-edit',
      timeLimit: '45m',
      autoUploadYoutube: true,
      enabled: true,
      lastRunResult: 'Đang chờ lịch chạy đêm nay',
    });
    setRoutineName('');
    setRoutineTopic('');
  };

  const handleCreateCustomStyle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!styleName.trim()) return;
    onAddCustomStyle({
      id: `custom-style-${Date.now()}`,
      name: styleName.trim(),
      createdFromScratch: fromScratch,
      baseStyleId: fromScratch ? undefined : baseStyleId,
      globalStyleKey:
        stylePrompt.trim() ||
        'Custom 3D informational style with studio grid floor, macro camera motion, and custom avatar.',
      characterAvatar: avatarName.trim() || 'Default 3D Host Avatar',
      sampleReferenceCount: 5,
    });
    setStyleName('');
    setStylePrompt('');
  };

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Gói Cước (Standard vs Premium), Routines Tự Động, Custom Styles & Hỗ Trợ 1-1"
      subtitle="Toàn bộ tính năng nâng cao từ Phần 5 của video: Flat Subscription, Unlimited Exports, Routines ngủ đêm, Custom Styles & YouTube Retention AI"
      maxWidthClass="max-w-5xl"
    >
      <div className="space-y-5 text-xs">
        {/* Sub-navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
          <button
            type="button"
            data-testid="tab-btn-plans"
            onClick={() => setActiveTab('plans')}
            className={`px-3.5 py-2 rounded-lg font-bold flex items-center gap-1.5 transition ${
              activeTab === 'plans'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <Crown className="w-4 h-4 text-amber-300" />
            Gói Cước (Standard vs Premium)
          </button>
          <button
            type="button"
            data-testid="tab-btn-routines"
            onClick={() => setActiveTab('routines')}
            className={`px-3.5 py-2 rounded-lg font-bold flex items-center gap-1.5 transition ${
              activeTab === 'routines'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <Moon className="w-4 h-4 text-indigo-300" />
            Routines (Tự động dựng khi ngủ)
          </button>
          <button
            type="button"
            data-testid="tab-btn-custom-styles"
            onClick={() => setActiveTab('custom-styles')}
            className={`px-3.5 py-2 rounded-lg font-bold flex items-center gap-1.5 transition ${
              activeTab === 'custom-styles'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <Palette className="w-4 h-4 text-pink-300" />
            Custom Styles & Nhân Vật Đại Diện
          </button>
          <button
            type="button"
            data-testid="tab-btn-support"
            onClick={() => setActiveTab('support')}
            className={`px-3.5 py-2 rounded-lg font-bold flex items-center gap-1.5 transition ${
              activeTab === 'support'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-300" />
            YouTube AI & Hỗ Trợ 1-1 (24h)
          </button>
        </div>

        {/* TAB 1: Standard vs Premium Comparison */}
        {activeTab === 'plans' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Standard Tier */}
            <div
              className={`p-5 rounded-2xl border flex flex-col justify-between ${
                subscriptionTier === 'standard'
                  ? 'bg-slate-900 border-blue-400 ring-2 ring-blue-500/30'
                  : 'bg-slate-950/80 border-slate-800'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-base font-extrabold text-white">Gói Tiêu Chuẩn (Standard)</span>
                  <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-bold text-[11px]">
                    Flat Subscription
                  </span>
                </div>
                <p className="text-slate-400">
                  Phù hợp làm quen quy trình dựng video tự động với chi phí thuê bao cố định (không tính phí theo lượt gọi API).
                </p>
                <ul className="space-y-2 pt-2 text-slate-200">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    Mở khóa toàn bộ 8 phong cách đồ họa (bao gồm 3D Informational Zack D. like)
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    Hỗ trợ xuất video khung hình dọc (Vertical Export 9:16 Shorts)
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    Xuất tối đa <strong>12 video mỗi tháng</strong> (Chế độ Standard Verified)
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    Quyền nhắn tin hỗ trợ trực tiếp 1-1 với tác giả (phản hồi trong 24 giờ)
                  </li>
                  <li className="flex items-center gap-2 text-slate-500">
                    <span>✕ Không bao gồm chế độ làm mịn cao cấp Ultra Edit</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                data-testid="select-tier-standard"
                onClick={() => onChangeTier('standard')}
                className={`mt-5 w-full py-2.5 rounded-xl font-bold transition ${
                  subscriptionTier === 'standard'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {subscriptionTier === 'standard' ? 'Đang kích hoạt Gói Standard ✓' : 'Chuyển sang Gói Standard'}
              </button>
            </div>

            {/* Premium Tier */}
            <div
              className={`p-5 rounded-2xl border flex flex-col justify-between ${
                subscriptionTier === 'premium'
                  ? 'bg-gradient-to-b from-blue-950/70 to-slate-900 border-amber-400 ring-2 ring-amber-400/30'
                  : 'bg-slate-950/80 border-slate-800'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-base font-extrabold text-white flex items-center gap-2">
                    <Crown className="w-5 h-5 text-amber-400" />
                    Gói Cao Cấp (Premium)
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-extrabold text-[10px]">
                    UNLIMITED EXPORTS
                  </span>
                </div>
                <p className="text-slate-300">
                  Mở khóa 100% sức mạnh tự động hóa hàng loạt — miễn là tài khoản Claude Code còn hạn mức (hoặc chuyển tài khoản), xuất bao nhiêu video tùy thích.
                </p>
                <ul className="space-y-2 pt-2 text-slate-100">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-400 shrink-0" />
                    <strong>Unlimited Exports (Xuất video không giới hạn)</strong> + Chuyển đổi nhiều tài khoản Claude
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-400 shrink-0" />
                    Mở khóa <strong>Ultra Edit</strong> (Visual Verification Pass trau chuốt 3D mượt nhất)
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-400 shrink-0" />
                    <strong>Routines</strong>: Lịch trình tự động treo máy làm video trong lúc bạn đang ngủ
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-400 shrink-0" />
                    <strong>Custom Styles & Custom Character</strong>: Huấn luyện phong cách từ mẫu có sẵn hoặc từ con số 0
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-400 shrink-0" />
                    Xuất độ phân giải <strong>4K</strong>, <strong>30+ ngôn ngữ</strong> & Kết nối <strong>YouTube Data API</strong> (Retention + Comments AI)
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-400 shrink-0" />
                    Hỗ trợ nhắn tin 1-1 trực tiếp với tác giả trong vòng 24 giờ
                  </li>
                </ul>
              </div>

              <button
                type="button"
                data-testid="select-tier-premium"
                onClick={() => onChangeTier('premium')}
                className={`mt-5 w-full py-2.5 rounded-xl font-bold transition ${
                  subscriptionTier === 'premium'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
              >
                {subscriptionTier === 'premium' ? 'Đang kích hoạt Gói Premium ✓' : 'Kích Hoạt Gói Premium'}
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: Routines (Overnight Automated Batch Production) */}
        {activeTab === 'routines' && (
          <div className="space-y-4">
            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Moon className="w-4 h-4 text-indigo-400" />
                Lịch Trình Tự Động (Routines — Treo máy tự động làm video khi đang ngủ)
              </h3>
              <div className="space-y-2.5">
                {routines.map((rt) => (
                  <div
                    key={rt.id}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{rt.name}</span>
                        <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {rt.cronTime}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Hàng đợi chủ đề: {rt.topicQueue.join(' • ')}
                      </p>
                      <p className="text-[10px] text-emerald-400 mt-1">{rt.lastRunResult}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onToggleRoutine(rt.id)}
                      className={`px-3 py-1.5 rounded-lg font-bold ${
                        rt.enabled
                          ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {rt.enabled ? 'Đang Bật (Active)' : 'Đang Tắt'}
                    </button>
                  </div>
                ))}
              </div>

              <form onSubmit={handleCreateRoutine} className="grid grid-cols-1 md:grid-cols-12 gap-2 pt-3 border-t border-slate-800">
                <input
                  type="text"
                  data-testid="input-routine-name"
                  value={routineName}
                  onChange={(e) => setRoutineName(e.target.value)}
                  placeholder="Tên lịch trình (VD: Batch 5 Shorts Zack D. Đêm Thứ 6)"
                  className="md:col-span-4 px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
                />
                <input
                  type="text"
                  value={routineTime}
                  onChange={(e) => setRoutineTime(e.target.value)}
                  placeholder="Giờ chạy (VD: 01:30 AM)"
                  className="md:col-span-3 px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
                />
                <input
                  type="text"
                  value={routineTopic}
                  onChange={(e) => setRoutineTopic(e.target.value)}
                  placeholder="Chủ đề hàng đợi..."
                  className="md:col-span-3 px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
                />
                <button
                  type="submit"
                  data-testid="btn-add-routine"
                  className="md:col-span-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Thêm Routine
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: Custom Styles Trainer & Custom Character Avatar */}
        {activeTab === 'custom-styles' && (
          <div className="space-y-4">
            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Palette className="w-4 h-4 text-pink-400" />
                Huấn Luyện Phong Cách Riêng (Custom Styles) & Nhân Vật Đại Diện (Custom Avatar)
              </h3>
              <p className="text-[11px] text-slate-400">
                Tự huấn luyện phong cách riêng dựa trên các mẫu có sẵn hoặc tạo một phong cách mới hoàn toàn từ con số không (From Scratch), kèm nhân vật đại diện riêng cho từng video.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {customStyles.map((cs) => (
                  <div key={cs.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{cs.name}</span>
                      <span className="px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 text-[10px] font-bold">
                        {cs.createdFromScratch ? 'From Scratch (Từ con số 0)' : `Base: ${cs.baseStyleId}`}
                      </span>
                    </div>
                    <div className="text-[11px] text-amber-300 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5" /> Nhân vật đại diện: <strong>{cs.characterAvatar}</strong>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono line-clamp-2">{cs.globalStyleKey}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleCreateCustomStyle} className="space-y-3 pt-3 border-t border-slate-800">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Tên Phong Cách Mới</label>
                    <input
                      type="text"
                      data-testid="input-custom-style-name"
                      value={styleName}
                      onChange={(e) => setStyleName(e.target.value)}
                      placeholder="VD: Cyber Medical 3D Cutaway"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Phương Thức Khởi Tạo</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFromScratch(false)}
                        className={`flex-1 py-1.5 px-2 rounded-lg border font-semibold ${
                          !fromScratch ? 'bg-blue-600/30 border-blue-400 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        Từ mẫu có sẵn
                      </button>
                      <button
                        type="button"
                        data-testid="btn-style-from-scratch"
                        onClick={() => setFromScratch(true)}
                        className={`flex-1 py-1.5 px-2 rounded-lg border font-semibold ${
                          fromScratch ? 'bg-pink-600/30 border-pink-400 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        Từ con số 0 (Scratch)
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Nhân Vật Đại Diện (Custom Character)</label>
                    <input
                      type="text"
                      value={avatarName}
                      onChange={(e) => setAvatarName(e.target.value)}
                      placeholder="VD: Glass Mannequin / Host"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white"
                    />
                  </div>
                </div>

                {!fromScratch && (
                  <div>
                    <label className="block text-slate-400 mb-1">Chọn Phong Cách Gốc (Base Template)</label>
                    <select
                      value={baseStyleId}
                      onChange={(e) => setBaseStyleId(e.target.value as VisualStyleId)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white"
                    >
                      {VISUAL_STYLES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={stylePrompt}
                    onChange={(e) => setStylePrompt(e.target.value)}
                    placeholder="Mô tả Global Style Key cho phong cách mới..."
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
                  />
                  <button
                    type="submit"
                    data-testid="btn-save-custom-style"
                    className="px-4 py-2 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-bold flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" /> Huấn Luyện & Lưu Style
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 4: YouTube Retention AI & 1-on-1 Author Support (24h SLA) */}
        {activeTab === 'support' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Youtube className="w-4 h-4 text-red-500" />
                  YouTube Data API Retention & Comment Learner
                </h3>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                  Retention TB: {avgRetentionPercent}%
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Phần mềm tự động phân tích dữ liệu giữ chân người xem (retention analytics) và đọc bình luận trên kênh để tự học hỏi, cải thiện cho các video sau:
              </p>
              <div className="space-y-2">
                {youtubeInsights.map((insight, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-2 text-slate-200"
                  >
                    <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{insight}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-400" />
                  Nhắn Tin Hỗ Trợ Trực Tiếp 1-1 Với Tác Giả (Cam Kết 24 Giờ)
                </h3>
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold text-[10px]">
                  STANDARD & PREMIUM
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Dù đăng ký gói Standard hay Premium, mọi người dùng đều nhận được quyền nhắn tin trực tiếp 1-1 với tác giả (phản hồi trong vòng 24 giờ cho mọi thắc mắc, báo lỗi, yêu cầu tính năng hay nhờ hỗ trợ tạo phong cách mới).
              </p>

              <div className="flex gap-2">
                {[
                  { id: 'style-help', label: 'Hỗ trợ tạo Style mới' },
                  { id: 'bug-report', label: 'Báo lỗi (Bug report)' },
                  { id: 'feature-request', label: 'Yêu cầu tính năng' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSupportType(t.id as typeof supportType)}
                    className={`flex-1 py-1.5 px-2 rounded-lg border text-[11px] font-semibold ${
                      supportType === t.id
                        ? 'bg-blue-600/30 border-blue-400 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <textarea
                rows={3}
                value={supportMessage}
                onChange={(e) => {
                  setSupportMessage(e.target.value);
                  setSupportSent(false);
                }}
                placeholder="Nhập nội dung cần tác giả hỗ trợ 1-1 (VD: Nhờ tối ưu Global Style Key cho kênh giải phẫu 3D)..."
                className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white"
              />

              <button
                type="button"
                data-testid="btn-send-author-support"
                onClick={() => setSupportSent(true)}
                className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold"
              >
                {supportSent ? 'Đã gửi tin nhắn 1-1 (Phản hồi trong < 24h) ✓' : 'Gửi Tin Nhắn Trực Tiếp Cho Tác Giả'}
              </button>
            </div>
          </div>
        )}
      </div>
    </ModalDialog>
  );
};
