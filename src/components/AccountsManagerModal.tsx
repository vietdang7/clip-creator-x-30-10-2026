import React, { useEffect, useState } from 'react';
import {
  Box,
  CheckCircle2,
  Cpu,
  Mic,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  Video,
  Youtube,
} from 'lucide-react';
import { AccountsState, ClaudeAccount, VideoModelAccount } from '../types/creatorize';
import { ModalDialog } from './ModalDialog';

interface AccountsManagerModalProps {
  isOpen: boolean;
  accounts: AccountsState;
  onClose: () => void;
  onSaveAccounts: (updated: AccountsState) => void;
}

const VIDEO_PROVIDER_DEFAULTS: Record<
  VideoModelAccount['provider'],
  { label: string; endpoint: string; note: string }
> = {
  'seedance-2.5': {
    label: 'Seedance 2.5 API',
    endpoint: 'https://api.seedance.ai/v2.5/generate',
    note: 'Tài khoản tạo video Seedance 2.5 bổ trợ (B-roll / Reference clip).',
  },
  'kling-ai': {
    label: 'Kling AI (1.6 / 2.0)',
    endpoint: 'https://api.klingai.com/v1/videos',
    note: 'Tài khoản tạo video Kling AI bổ trợ.',
  },
  'wan-3.0-kie': {
    label: 'KIE.ai / Wan 3.0 Video Prime',
    endpoint: 'https://api.kie.ai/api/v1/wan/3-0-video-prime',
    note: 'Tài khoản tạo video Wan 3.0 qua KIE.ai.',
  },
  'runway-gen3': {
    label: 'Runway Gen-3 Alpha Turbo',
    endpoint: 'https://api.dev.runwayml.com/v1/image_to_video',
    note: 'Tài khoản tạo video Runway Gen-3 bổ trợ.',
  },
};

export const AccountsManagerModal: React.FC<AccountsManagerModalProps> = ({
  isOpen,
  accounts,
  onClose,
  onSaveAccounts,
}) => {
  const [formState, setFormState] = useState<AccountsState>(accounts);
  const [newClaudeLabel, setNewClaudeLabel] = useState('');
  const [newClaudePlan, setNewClaudePlan] = useState<'claude-20x' | 'claude-pro' | 'api-key'>('claude-20x');
  const [newClaudeCred, setNewClaudeCred] = useState('');

  // State for adding a new Video Model Account
  const [newVideoProvider, setNewVideoProvider] =
    useState<VideoModelAccount['provider']>('wan-3.0-kie');
  const [newVideoAccName, setNewVideoAccName] = useState('');
  const [newVideoApiKey, setNewVideoApiKey] = useState('');

  useEffect(() => {
    setFormState(accounts);
  }, [accounts]);

  const handleAddClaudeAccount = () => {
    if (!newClaudeLabel.trim()) return;
    const newAcc: ClaudeAccount = {
      id: `claude-acc-${Date.now()}`,
      label: newClaudeLabel.trim(),
      planType: newClaudePlan,
      credential: newClaudeCred.trim() || 'sk-ant-sid01-configured-token',
      sessionUsedPercent: 0,
      weeklyUsedPercent: 0,
      isActive: formState.claudeAccounts.length === 0,
      status: 'ready',
    };
    setFormState((prev) => ({
      ...prev,
      claudeAccounts: [...prev.claudeAccounts, newAcc],
    }));
    setNewClaudeLabel('');
    setNewClaudeCred('');
  };

  const handleSelectActiveClaude = (id: string) => {
    setFormState((prev) => ({
      ...prev,
      claudeAccounts: prev.claudeAccounts.map((acc) => ({
        ...acc,
        isActive: acc.id === id,
      })),
    }));
  };

  const handleDeleteClaude = (id: string) => {
    setFormState((prev) => {
      const remaining = prev.claudeAccounts.filter((a) => a.id !== id);
      if (remaining.length > 0 && !remaining.some((a) => a.isActive)) {
        remaining[0] = { ...remaining[0], isActive: true };
      }
      return { ...prev, claudeAccounts: remaining };
    });
  };

  const handleRotateNextClaudeAccount = () => {
    setFormState((prev) => {
      const idx = prev.claudeAccounts.findIndex((a) => a.isActive);
      if (idx === -1 || prev.claudeAccounts.length < 2) return prev;
      const nextIdx = (idx + 1) % prev.claudeAccounts.length;
      return {
        ...prev,
        claudeAccounts: prev.claudeAccounts.map((a, i) => ({
          ...a,
          isActive: i === nextIdx,
        })),
      };
    });
  };

  const handleAddVideoModelAccount = () => {
    if (!newVideoAccName.trim()) return;
    const meta = VIDEO_PROVIDER_DEFAULTS[newVideoProvider];
    const newVideoAcc: VideoModelAccount = {
      id: `vid-acc-${Date.now()}`,
      provider: newVideoProvider,
      providerLabel: meta.label,
      accountName: newVideoAccName.trim(),
      apiKey: newVideoApiKey.trim(),
      endpointUrl: meta.endpoint,
      enabled: true,
      usageNote: meta.note,
    };
    setFormState((prev) => ({
      ...prev,
      videoModelAccounts: [...prev.videoModelAccounts, newVideoAcc],
    }));
    setNewVideoAccName('');
    setNewVideoApiKey('');
  };

  const handleDeleteVideoModelAccount = (id: string) => {
    setFormState((prev) => ({
      ...prev,
      videoModelAccounts: prev.videoModelAccounts.filter((v) => v.id !== id),
    }));
  };

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Trung Tâm Quản Lý Tài Khoản AI, Video Models & API (Accounts & Credentials Hub)"
      subtitle="Nạp các tài khoản Claude (20x / Pro / API), Google Flow, ElevenLabs, Blender, YouTube Data API và các tài khoản Video Model"
      maxWidthClass="max-w-5xl"
    >
      <div className="space-y-6 text-xs">
        {/* 1. Claude Multi-Account Pool & Auto-Failover */}
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-400" />
                1. Claude Opus 5.5 Accounts Pool (Hỗ trợ chuyển đổi nhiều tài khoản không ngừng nghỉ)
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Khi một tài khoản Claude hết hạn mức (session/weekly limit), bạn chỉ việc chuyển sang tài khoản khác hoặc bật tự động chuyển đổi.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  data-testid="checkbox-auto-switch-claude"
                  checked={formState.autoSwitchClaudeAccount}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      autoSwitchClaudeAccount: e.target.checked,
                    }))
                  }
                  className="rounded border-slate-700 bg-slate-900 text-blue-600"
                />
                <span className="font-semibold text-slate-200">Auto-Switch Khi Hết Hạn Mức</span>
              </label>

              <button
                type="button"
                data-testid="btn-rotate-claude-account"
                onClick={handleRotateNextClaudeAccount}
                className="px-3 py-1.5 rounded-lg bg-blue-600/25 hover:bg-blue-600/40 text-blue-200 border border-blue-500/40 font-semibold flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Đổi Tài Khoản Claude Ngay
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {formState.claudeAccounts.map((acc) => (
              <div
                key={acc.id}
                data-testid={`claude-account-card-${acc.id}`}
                className={`p-3 rounded-xl border transition flex flex-col justify-between ${
                  acc.isActive
                    ? 'bg-blue-950/60 border-blue-400 ring-2 ring-blue-500/30'
                    : 'bg-slate-950/80 border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-white leading-snug">{acc.label}</span>
                    {acc.isActive && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-extrabold shrink-0">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 font-mono truncate">
                    Key/Token: {acc.credential}
                  </div>
                  <div className="mt-2 space-y-1 text-[10px]">
                    <div className="flex justify-between text-slate-300">
                      <span>Session Limit (~4% / video):</span>
                      <span className="font-bold text-blue-300">{acc.sessionUsedPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-500 h-full"
                        style={{ width: `${Math.min(100, acc.sessionUsedPercent)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-slate-300 pt-1">
                      <span>Weekly Limit (~1% / video):</span>
                      <span className="font-bold text-emerald-300">{acc.weeklyUsedPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full"
                        style={{ width: `${Math.min(100, acc.weeklyUsedPercent)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleSelectActiveClaude(acc.id)}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold ${
                      acc.isActive
                        ? 'bg-emerald-600/20 text-emerald-300'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    {acc.isActive ? 'Đang sử dụng ✓' : 'Chọn tài khoản này'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteClaude(acc.id)}
                    aria-label={`Delete ${acc.label}`}
                    className="p-1 text-slate-500 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add New Claude Account Row */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-2 border-t border-slate-800/80">
            <input
              type="text"
              data-testid="input-new-claude-label"
              value={newClaudeLabel}
              onChange={(e) => setNewClaudeLabel(e.target.value)}
              placeholder="Tên tài khoản (VD: Claude 20x #3)"
              className="sm:col-span-4 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white"
            />
            <select
              value={newClaudePlan}
              onChange={(e) =>
                setNewClaudePlan(e.target.value as 'claude-20x' | 'claude-pro' | 'api-key')
              }
              className="sm:col-span-3 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white"
            >
              <option value="claude-20x">Gói Claude 20x Max</option>
              <option value="claude-pro">Gói Claude Pro ($20/tháng)</option>
              <option value="api-key">Anthropic API Key</option>
            </select>
            <input
              type="text"
              data-testid="input-new-claude-cred"
              value={newClaudeCred}
              onChange={(e) => setNewClaudeCred(e.target.value)}
              placeholder="Session Token / API Key (sk-ant-...)"
              className="sm:col-span-3 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono"
            />
            <button
              type="button"
              data-testid="btn-add-claude-account"
              onClick={handleAddClaudeAccount}
              className="sm:col-span-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm
            </button>
          </div>
        </div>

        {/* 2. Google Flow + Image Generation API, ElevenLabs & Blender Bridge */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Google Flow & Built-in Image APIs */}
          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Google Flow & Image APIs
              </h4>
              <span className="text-[10px] text-emerald-400 font-bold">FREE CREDITS</span>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Google Account Email</label>
              <input
                type="email"
                value={formState.googleFlow.email}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    googleFlow: { ...prev.googleFlow, email: e.target.value },
                  }))
                }
                className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Google Flow OAuth / Cookie Token</label>
              <input
                type="text"
                value={formState.googleFlow.sessionToken}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    googleFlow: { ...prev.googleFlow, sessionToken: e.target.value },
                  }))
                }
                className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-700 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Built-in Image API Provider</label>
              <select
                aria-label="Image Generation API Provider"
                value={formState.imageGenApi?.provider || 'google-flow-imagen3'}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    imageGenApi: {
                      provider: e.target.value as NonNullable<AccountsState['imageGenApi']>['provider'],
                      apiKey: prev.imageGenApi?.apiKey || '',
                      enabled: true,
                    },
                  }))
                }
                className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-700 text-white"
              >
                <option value="google-flow-imagen3">Google Flow Imagen 3 (0đ Free Credits)</option>
                <option value="flux-1.1-pro">Flux 1.1 Pro API</option>
                <option value="openai-gpt-image">OpenAI GPT-Image-1 API</option>
                <option value="midjourney-bridge">Midjourney Reference Bridge</option>
              </select>
            </div>
          </div>

          {/* ElevenLabs Voice API */}
          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white flex items-center gap-1.5">
                <Mic className="w-4 h-4 text-purple-400" />
                ElevenLabs Voice API
              </h4>
              <span className="text-[10px] text-purple-300 font-bold">BUILT-IN TTS</span>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">ElevenLabs API Key</label>
              <input
                type="text"
                data-testid="input-elevenlabs-key"
                value={formState.elevenLabs.apiKey}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    elevenLabs: { ...prev.elevenLabs, apiKey: e.target.value },
                  }))
                }
                className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-700 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Voice ID & Narrator Name</label>
              <input
                type="text"
                value={formState.elevenLabs.voiceName}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    elevenLabs: { ...prev.elevenLabs, voiceName: e.target.value },
                  }))
                }
                className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">ElevenLabs Voice ID</label>
              <input
                type="text"
                value={formState.elevenLabs.voiceId}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    elevenLabs: { ...prev.elevenLabs, voiceId: e.target.value },
                  }))
                }
                className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-700 text-white font-mono"
              />
            </div>
          </div>

          {/* Local Blender + Local Whisper Transcription */}
          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white flex items-center gap-1.5">
                <Box className="w-4 h-4 text-amber-400" />
                Blender & Local Audio Aligner
              </h4>
              <span className="text-[10px] text-amber-300 font-bold">LOCAL ENGINE</span>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Đường dẫn Blender Executable</label>
              <input
                type="text"
                value={formState.blenderBridge.executablePath}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    blenderBridge: { ...prev.blenderBridge, executablePath: e.target.value },
                  }))
                }
                className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-700 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Local Transcription Model (20s Sync)</label>
              <input
                type="text"
                value={formState.blenderBridge.localWhisperModel}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    blenderBridge: { ...prev.blenderBridge, localWhisperModel: e.target.value },
                  }))
                }
                className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-700 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-400 mb-1">Render Engine</label>
                <select
                  aria-label="Blender Render Engine"
                  value={formState.blenderBridge.renderEngine}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      blenderBridge: {
                        ...prev.blenderBridge,
                        renderEngine: e.target.value as 'EEVEE_NEXT' | 'CYCLES',
                      },
                    }))
                  }
                  className="w-full px-2 py-1.5 rounded bg-slate-950 border border-slate-700 text-white"
                >
                  <option value="EEVEE_NEXT">EEVEE Next</option>
                  <option value="CYCLES">Cycles GPU</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Timeline FPS</label>
                <select
                  aria-label="Blender Timeline FPS"
                  value={formState.blenderBridge.fps}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      blenderBridge: {
                        ...prev.blenderBridge,
                        fps: Number(e.target.value) as 30 | 60,
                      },
                    }))
                  }
                  className="w-full px-2 py-1.5 rounded bg-slate-950 border border-slate-700 text-white"
                >
                  <option value={30}>30 FPS</option>
                  <option value={60}>60 FPS</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 3. External Video Model Accounts (Seedance 2.5, Kling AI, Wan 3.0 / KIE.ai, Runway Gen-3) */}
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Video className="w-4 h-4 text-pink-400" />
                3. Tài Khoản Tạo Model Video Bổ Trợ (Seedance 2.5 / Kling AI / Wan 3.0 KIE / Runway)
              </h3>
              <p className="text-[11px] text-slate-400">
                Khung sườn kết nối sẵn cho các tài khoản tạo video AI của bạn (dùng khi muốn tạo video tham chiếu hoặc kết hợp B-roll cùng Blender 3D).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {formState.videoModelAccounts.map((vAcc, idx) => (
              <div
                key={vAcc.id}
                data-testid={`video-account-card-${vAcc.id}`}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-white">{vAcc.providerLabel}</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        aria-label={`Enable ${vAcc.providerLabel}`}
                        checked={vAcc.enabled}
                        onChange={(e) => {
                          const next = [...formState.videoModelAccounts];
                          next[idx] = { ...vAcc, enabled: e.target.checked };
                          setFormState((prev) => ({ ...prev, videoModelAccounts: next }));
                        }}
                        className="rounded border-slate-700 bg-slate-900 text-blue-600"
                      />
                      <button
                        type="button"
                        aria-label={`Delete ${vAcc.accountName}`}
                        onClick={() => handleDeleteVideoModelAccount(vAcc.id)}
                        className="p-0.5 text-slate-500 hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    aria-label={`${vAcc.providerLabel} Account Name`}
                    placeholder="Tên tài khoản..."
                    value={vAcc.accountName}
                    onChange={(e) => {
                      const next = [...formState.videoModelAccounts];
                      next[idx] = { ...vAcc, accountName: e.target.value };
                      setFormState((prev) => ({ ...prev, videoModelAccounts: next }));
                    }}
                    className="w-full px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-200 text-[11px]"
                  />
                  <input
                    type="text"
                    placeholder="API Key / Token..."
                    value={vAcc.apiKey}
                    onChange={(e) => {
                      const next = [...formState.videoModelAccounts];
                      next[idx] = { ...vAcc, apiKey: e.target.value };
                      setFormState((prev) => ({ ...prev, videoModelAccounts: next }));
                    }}
                    className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-white font-mono text-[11px]"
                  />
                  <input
                    type="text"
                    aria-label={`${vAcc.providerLabel} Endpoint URL`}
                    placeholder="Endpoint URL..."
                    value={vAcc.endpointUrl}
                    onChange={(e) => {
                      const next = [...formState.videoModelAccounts];
                      next[idx] = { ...vAcc, endpointUrl: e.target.value };
                      setFormState((prev) => ({ ...prev, videoModelAccounts: next }));
                    }}
                    className="w-full px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400 font-mono text-[10px]"
                  />
                </div>
                <p className="text-[10px] text-slate-400 pt-1">{vAcc.usageNote}</p>
              </div>
            ))}
          </div>

          {/* Add New Video Model Account Row */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-2 border-t border-slate-800/80">
            <select
              aria-label="New video model provider"
              data-testid="select-new-video-provider"
              value={newVideoProvider}
              onChange={(e) =>
                setNewVideoProvider(e.target.value as VideoModelAccount['provider'])
              }
              className="sm:col-span-3 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white"
            >
              <option value="wan-3.0-kie">KIE.ai / Wan 3.0 Video</option>
              <option value="seedance-2.5">Seedance 2.5 API</option>
              <option value="kling-ai">Kling AI (1.6 / 2.0)</option>
              <option value="runway-gen3">Runway Gen-3 Alpha</option>
            </select>
            <input
              type="text"
              data-testid="input-new-video-account-name"
              value={newVideoAccName}
              onChange={(e) => setNewVideoAccName(e.target.value)}
              placeholder="Tên tài khoản Video Model (VD: KIE Wan 3.0 #2)"
              className="sm:col-span-4 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white"
            />
            <input
              type="text"
              data-testid="input-new-video-api-key"
              value={newVideoApiKey}
              onChange={(e) => setNewVideoApiKey(e.target.value)}
              placeholder="API Key / Bearer Token..."
              className="sm:col-span-3 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono"
            />
            <button
              type="button"
              data-testid="btn-add-video-account"
              onClick={handleAddVideoModelAccount}
              className="sm:col-span-2 px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-bold flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm Model
            </button>
          </div>
        </div>

        {/* 4. YouTube Data API v3 Connection (Retention Analytics & Comment Learning) */}
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Youtube className="w-4 h-4 text-red-500" />
                4. Kết Nối Kênh YouTube Qua YouTube Data API (Gói Premium)
              </h3>
              <p className="text-[11px] text-slate-400">
                Tự động phân tích dữ liệu giữ chân người xem (Retention Analytics) và đọc bình luận để tự học hỏi, cải thiện cho các video sau.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded bg-red-500/15 text-red-300 border border-red-500/30 font-bold">
              Avg Retention: {formState.youtubeApi.avgRetentionPercent}%
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Tên Kênh YouTube</label>
              <input
                type="text"
                value={formState.youtubeApi.channelName}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    youtubeApi: { ...prev.youtubeApi, channelName: e.target.value },
                  }))
                }
                className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">YouTube Data API v3 Key / OAuth</label>
              <input
                type="text"
                value={formState.youtubeApi.apiKey}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    youtubeApi: { ...prev.youtubeApi, apiKey: e.target.value },
                  }))
                }
                className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-700 text-white font-mono"
              />
            </div>
            <div className="flex flex-col justify-center gap-1.5 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formState.youtubeApi.autoAnalyzeRetention}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      youtubeApi: { ...prev.youtubeApi, autoAnalyzeRetention: e.target.checked },
                    }))
                  }
                />
                <span className="text-slate-200">Tự động học từ Retention Analytics</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formState.youtubeApi.autoReadComments}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      youtubeApi: { ...prev.youtubeApi, autoReadComments: e.target.checked },
                    }))
                  }
                />
                <span className="text-slate-200">Tự động đọc Bình luận để tối ưu kịch bản</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
          >
            Đóng
          </button>
          <button
            type="button"
            data-testid="btn-save-accounts"
            onClick={() => {
              onSaveAccounts(formState);
              onClose();
            }}
            className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-2 shadow-lg"
          >
            <CheckCircle2 className="w-4 h-4" />
            Lưu Cấu Hình Tài Khoản & API
          </button>
        </div>
      </div>
    </ModalDialog>
  );
};
