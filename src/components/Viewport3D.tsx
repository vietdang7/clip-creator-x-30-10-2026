import React, { useEffect, useRef } from 'react';
import {
  Box,
  Cpu,
  Eye,
  Film,
  Flame,
  Layers,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import {
  CreatorizeProject,
  TimelineShot,
  ViewportShadingMode,
  WordTimestamp,
} from '../types/creatorize';
import { VISUAL_STYLES } from '../data/presetProjects';

interface Viewport3DProps {
  project: CreatorizeProject;
  activeShot: TimelineShot;
  currentTimeSec: number;
  isPlaying: boolean;
  shadingMode: ViewportShadingMode;
  isCachingFrame: boolean;
  cacheFrameProgress: number;
  activeWord?: WordTimestamp;
  onTogglePlay: () => void;
  onChangeShadingMode: (mode: ViewportShadingMode) => void;
  onForceCacheShot: (shotId: string) => void;
  onOpenExportModal: () => void;
}

export const Viewport3D: React.FC<Viewport3DProps> = ({
  project,
  activeShot,
  currentTimeSec,
  isPlaying,
  shadingMode,
  isCachingFrame,
  cacheFrameProgress,
  activeWord,
  onTogglePlay,
  onChangeShadingMode,
  onForceCacheShot,
  onOpenExportModal,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentFrame = Math.max(1, Math.min(project.audioDurationSec * 30, Math.round(currentTimeSec * 30) + 1));
  const is3DStyle = VISUAL_STYLES.find((s) => s.id === project.settings.styleId)?.is3D ?? true;
  const isShotCached = !is3DStyle || activeShot.cacheStatus === 'cached';
  const showRenderedOutput =
    !is3DStyle || (shadingMode === 'rendered' && isShotCached && !isCachingFrame);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = canvas.getContext('2d');
    } catch {
      ctx = null;
    }
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // 1. Background: Zack D. Films signature Bluish Infinite Grid vs Solid Viewport Grey-Blue
    if (shadingMode === 'solid') {
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, '#161e2e');
      bgGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);
    } else {
      const bgGrad = ctx.createRadialGradient(w * 0.5, h * 0.42, 30, w * 0.5, h * 0.5, h * 0.75);
      bgGrad.addColorStop(0, '#102a6b');
      bgGrad.addColorStop(0.55, '#081844');
      bgGrad.addColorStop(1, '#040b24');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);
    }

    // 2. Draw Perspective Infinite Grid (Zack D. Films signature floor & backdrop grid)
    const horizonY = h * 0.56;
    ctx.save();
    ctx.strokeStyle = shadingMode === 'solid' ? 'rgba(148, 163, 184, 0.18)' : 'rgba(59, 130, 246, 0.32)';
    ctx.lineWidth = 1;

    // Back wall subtle grid in rendered mode
    if (shadingMode === 'rendered') {
      const wallStep = 28;
      for (let x = 0; x <= w; x += wallStep) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, horizonY);
        ctx.stroke();
      }
      for (let y = 0; y <= horizonY; y += wallStep) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    }

    // Floor perspective grid lines
    const numFloorLines = 18;
    for (let i = -numFloorLines; i <= numFloorLines; i++) {
      ctx.beginPath();
      ctx.moveTo(w / 2 + i * 14, horizonY);
      ctx.lineTo(w / 2 + i * 75, h);
      ctx.stroke();
    }
    for (let r = 1; r <= 12; r++) {
      const t = Math.pow(r / 12, 1.65);
      const y = horizonY + t * (h - horizonY);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.restore();

    // 3. Draw Centerpiece 3D Subject according to activeShot.sceneType and local shot progress
    const shotDuration = Math.max(0.1, activeShot.endSec - activeShot.startSec);
    const localProgress = Math.max(0, Math.min(1, (currentTimeSec - activeShot.startSec) / shotDuration));
    const cx = w / 2;
    const cy = h * 0.47;

    ctx.save();
    const isSolid = shadingMode === 'solid' || !showRenderedOutput;

    if (activeShot.sceneType.startsWith('bottle-')) {
      // Draw 3D Glass Bottle / Thermal Shock simulation
      const splitOffset = activeShot.sceneType === 'bottle-thermal-crack' ? localProgress * 34 : 0;
      const rotationTilt =
        activeShot.sceneType === 'bottle-rotate-heat' ? Math.sin(localProgress * Math.PI * 4) * 0.18 : 0;

      ctx.translate(cx, cy);
      ctx.rotate(rotationTilt);

      // Ice water basin for shot 3
      if (activeShot.sceneType === 'bottle-ice-plunge') {
        ctx.fillStyle = isSolid ? 'rgba(148, 163, 184, 0.25)' : 'rgba(56, 189, 248, 0.28)';
        ctx.strokeStyle = isSolid ? '#94a3b8' : '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-95, 25, 190, 115, 12);
        ctx.fill();
        ctx.stroke();

        // Ice cubes floating
        for (let ic = -2; ic <= 2; ic++) {
          ctx.fillStyle = isSolid ? '#cbd5e1' : 'rgba(224, 242, 254, 0.78)';
          ctx.fillRect(ic * 32 - 12, 34 + ((ic * 7) % 9), 22, 18);
        }
      }

      // Bottom half of glass bottle (Cup)
      if (activeShot.sceneType !== 'bottle-sand-drink') {
        // Top half of bottle
        ctx.save();
        ctx.translate(0, -splitOffset);
        ctx.fillStyle = isSolid ? '#64748b' : 'rgba(16, 185, 129, 0.58)';
        ctx.strokeStyle = isSolid ? '#e2e8f0' : '#6ee7b7';
        ctx.lineWidth = 2.2;
        // Bottle neck
        ctx.beginPath();
        ctx.roundRect(-20, -135, 40, 52, 6);
        ctx.fill();
        ctx.stroke();
        // Upper body
        ctx.beginPath();
        ctx.roundRect(-48, -85, 96, 85, [18, 18, 0, 0]);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // Lower half of bottle (the cup)
      ctx.save();
      ctx.translate(0, splitOffset * 0.4);
      ctx.fillStyle = isSolid ? '#475569' : 'rgba(16, 185, 129, 0.65)';
      ctx.strokeStyle = isSolid ? '#cbd5e1' : '#a7f3d0';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.roundRect(-48, 0, 96, 92, [0, 0, 14, 14]);
      ctx.fill();
      ctx.stroke();

      // If shot 5: Pouring dark soda into polished glass cup
      if (activeShot.sceneType === 'bottle-sand-drink') {
        const fillHeight = Math.min(72, 25 + localProgress * 50);
        ctx.fillStyle = isSolid ? '#334155' : 'rgba(120, 53, 15, 0.88)';
        ctx.beginPath();
        ctx.roundRect(-42, 86 - fillHeight, 84, fillHeight, [0, 0, 10, 10]);
        ctx.fill();

        // Pouring stream
        if (!isSolid) {
          ctx.strokeStyle = '#92400e';
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.moveTo(8, -110);
          ctx.lineTo(0, 86 - fillHeight);
          ctx.stroke();
        }
      }
      ctx.restore();

      // Cotton string & Flame (Shots 1 & 2)
      if (activeShot.sceneType === 'bottle-string-fire' || activeShot.sceneType === 'bottle-rotate-heat') {
        ctx.strokeStyle = isSolid ? '#f8fafc' : '#fef08a';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(-50, 0);
        ctx.lineTo(50, 0);
        ctx.stroke();

        // Flame halo
        if (!isSolid) {
          const flameGrad = ctx.createRadialGradient(0, -8, 6, 0, -12, 68);
          flameGrad.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
          flameGrad.addColorStop(0.45, 'rgba(249, 115, 22, 0.75)');
          flameGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
          ctx.fillStyle = flameGrad;
          ctx.beginPath();
          ctx.ellipse(0, -10, 62, 34 + Math.sin(localProgress * 25) * 6, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Thermal crack line (Shot 4)
      if (activeShot.sceneType === 'bottle-thermal-crack') {
        ctx.strokeStyle = isSolid ? '#ffffff' : '#22d3ee';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-54, 0);
        ctx.lineTo(-18, -4);
        ctx.lineTo(14, 4);
        ctx.lineTo(54, 0);
        ctx.stroke();
      }
    } else if (activeShot.sceneType.startsWith('everest-')) {
      // Mount Everest 3D Cutaway Diorama on Zack D. Grid
      ctx.translate(cx, cy + 20);
      const liftY = activeShot.sceneType === 'everest-maglev' ? -16 : 0;
      ctx.translate(0, liftY);

      // Crust block base
      ctx.fillStyle = isSolid ? '#475569' : '#334155';
      ctx.strokeStyle = isSolid ? '#cbd5e1' : '#60a5fa';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-105, 10, 210, 58, 8);
      ctx.fill();
      ctx.stroke();

      // Mountain peak geometry
      ctx.fillStyle = isSolid ? '#64748b' : '#94a3b8';
      ctx.beginPath();
      ctx.moveTo(-95, 10);
      ctx.lineTo(-22, -115);
      ctx.lineTo(18, -92);
      ctx.lineTo(42, -125);
      ctx.lineTo(95, 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Snow cap or Steel Mesh
      if (activeShot.sceneType === 'everest-mesh' || !isSolid) {
        ctx.strokeStyle = activeShot.sceneType === 'everest-mesh' ? '#38bdf8' : 'rgba(226, 232, 240, 0.6)';
        ctx.lineWidth = 1.2;
        for (let m = -70; m <= 70; m += 20) {
          ctx.beginPath();
          ctx.moveTo(m, 10);
          ctx.lineTo(m * 0.3, -105);
          ctx.stroke();
        }
      }

      // Thermal drills / Maglev glow
      if (activeShot.sceneType === 'everest-drill' && !isSolid) {
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-125, 36);
        ctx.lineTo(-105 + localProgress * 210, 36);
        ctx.stroke();
      }
    } else {
      // Bullet Cross-Section 3D Cutaway
      ctx.translate(cx, cy);
      // Brass Casing cutaway
      ctx.fillStyle = isSolid ? '#475569' : '#d97706';
      ctx.strokeStyle = isSolid ? '#cbd5e1' : '#fcd34d';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(-95, -36, 115, 72, 6);
      ctx.fill();
      ctx.stroke();

      // Smokeless powder chamber inside cutaway
      ctx.fillStyle = isSolid ? '#1e293b' : '#27272a';
      ctx.fillRect(-78, -26, 88, 52);

      // Ignition flash if shot 3 or 4
      if ((activeShot.sceneType === 'bullet-ignition-gas' || activeShot.sceneType === 'bullet-barrel-exit') && !isSolid) {
        const gasGrad = ctx.createRadialGradient(-40, 0, 4, -20, 0, 70);
        gasGrad.addColorStop(0, '#fef08a');
        gasGrad.addColorStop(0.5, '#f97316');
        gasGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = gasGrad;
        ctx.fillRect(-78, -26, 88, 52);
      }

      // Copper Bullet Projectile
      const bulletOffset = activeShot.sceneType === 'bullet-barrel-exit' ? localProgress * 75 : 0;
      ctx.fillStyle = isSolid ? '#94a3b8' : '#b45309';
      ctx.strokeStyle = isSolid ? '#f8fafc' : '#fde68a';
      ctx.beginPath();
      ctx.moveTo(20 + bulletOffset, -32);
      ctx.quadraticCurveTo(88 + bulletOffset, -28, 108 + bulletOffset, 0);
      ctx.quadraticCurveTo(88 + bulletOffset, 28, 20 + bulletOffset, 32);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Solid wireframe overlay indicator
    if (isSolid) {
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(-65, -145, 130, 250);
      ctx.setLineDash([]);
    }
    ctx.restore();
  }, [activeShot, currentTimeSec, shadingMode, showRenderedOutput]);

  return (
    <div className="flex flex-col h-full bg-[#070d1c] border border-slate-800/90 rounded-xl overflow-hidden shadow-2xl">
      {/* Viewport Top Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 bg-[#0c1428] border-b border-slate-800/80 text-xs">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/15 text-blue-300 border border-blue-500/30 font-semibold">
            <Box className="w-3.5 h-3.5" />
            Blender 4.3 Viewport Bridge
          </span>
          <span className="text-slate-400 hidden sm:inline">
            Shot #{activeShot.shotNumber}: <strong className="text-slate-200">{activeShot.title}</strong>
          </span>
        </div>

        {/* Viewport Shading Switcher (Solid View Real-time vs Rendered Cached) */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => onChangeShadingMode('solid')}
            data-testid="shading-mode-solid"
            className={`px-2.5 py-1 rounded-md font-medium transition flex items-center gap-1.5 ${
              shadingMode === 'solid'
                ? 'bg-slate-700 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Chế độ khối thô (Solid View): Phát trực tiếp theo thời gian thực (Real-time playback)"
          >
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            Solid View (Real-Time)
          </button>
          <button
            type="button"
            onClick={() => onChangeShadingMode('rendered')}
            data-testid="shading-mode-rendered"
            className={`px-2.5 py-1 rounded-md font-medium transition flex items-center gap-1.5 ${
              shadingMode === 'rendered'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Chế độ Kết xuất 3D (Rendered): Cần dừng con trỏ để tạo bộ nhớ đệm (Cache) trước khi hiển thị"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Rendered Preview (Cached)
          </button>
        </div>
      </div>

      {/* Main 3D Viewport Area (9:16 Vertical Shorts Frame inside Studio Monitor) */}
      <div className="relative flex-1 flex items-center justify-center bg-[#050914] p-3 overflow-hidden min-h-[340px]">
        {/* Left Overlay HUD: Zack D. Style & Camera Metadata */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-none max-w-[230px]">
          <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800/90 rounded-lg px-2.5 py-2 text-[11px] text-slate-300 space-y-1">
            <div className="flex items-center justify-between text-blue-400 font-semibold">
              <span>{project.settings.styleId === '3d-informational-zack-d' ? 'Zack D. 3D Grid' : project.settings.styleId}</span>
              <span>{project.settings.aspectRatio} • {project.settings.resolution}</span>
            </div>
            <div className="text-slate-400 truncate">Cam: {activeShot.cameraPreset}</div>
            <div className="flex items-center gap-2 text-[10px]">
              <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Frame {currentFrame} / {project.audioDurationSec * 30}
              </span>
              <span
                className={`px-1.5 py-0.5 rounded border ${
                  isShotCached
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                }`}
              >
                {isShotCached ? 'Shot Cached ✓' : 'Uncached Shot'}
              </span>
            </div>
          </div>

          {project.settings.qualityMode === 'ultra-edit' && (
            <div className="bg-emerald-950/75 backdrop-blur-md border border-emerald-500/30 rounded-lg px-2.5 py-1.5 text-[10px] text-emerald-200">
              <div className="font-semibold text-emerald-300 flex items-center gap-1">
                <Eye className="w-3 h-3" /> Visual Verification Pass (Opus 5.5)
              </div>
              <p className="line-clamp-2 text-emerald-100/80 mt-0.5">{activeShot.visualVerificationNote}</p>
            </div>
          )}
        </div>

        {/* 9:16 Vertical Shorts Canvas Container */}
        <div className="relative h-full max-h-[430px] aspect-[9/16] rounded-xl overflow-hidden border-2 border-blue-500/40 shadow-[0_0_40px_rgba(29,78,216,0.28)] bg-[#06102b]">
          <canvas
            ref={canvasRef}
            width={340}
            height={604}
            className="w-full h-full object-cover"
          />

          {/* Overlay when in Rendered mode & Shot is currently Caching or Uncached */}
          {shadingMode === 'rendered' && (!isShotCached || isCachingFrame) && (
            <div
              data-testid="viewport-cache-overlay"
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-5 text-center"
            >
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin mb-2.5" />
              <p className="text-xs font-semibold text-white">
                {isCachingFrame
                  ? `Đang tạo bộ nhớ đệm (Caching Shot #${activeShot.shotNumber})... ${cacheFrameProgress}%`
                  : `Phân cảnh 3D chưa có Cache ở chế độ Rendered`}
              </p>
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                Khác với 2D, phong cách 3D Zack D. cần dừng con trỏ để tạo cache phân cảnh trước khi kết xuất khung hình.
              </p>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-3">
                <div
                  className="bg-blue-500 h-full transition-all duration-200"
                  style={{ width: `${isCachingFrame ? cacheFrameProgress : 25}%` }}
                />
              </div>
              {!isCachingFrame && (
                <button
                  type="button"
                  onClick={() => onForceCacheShot(activeShot.id)}
                  data-testid="btn-force-cache-shot"
                  className="mt-3 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Tạo Cache & Render Khung Hình Ngay
                </button>
              )}
            </div>
          )}

          {/* Synchronized Word-Level Subtitle Overlay inside 9:16 Preview */}
          <div className="absolute bottom-5 inset-x-3 text-center pointer-events-none">
            <div className="inline-block bg-black/75 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/15">
              <p className="text-xs font-bold tracking-wide text-white leading-snug">
                {activeShot.narration}
              </p>
              {activeWord && (
                <span className="mt-1 inline-block text-[11px] font-extrabold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded">
                  ⚡ &ldquo;{activeWord.word}&rdquo; (Frame {activeWord.startFrame})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Overlay HUD: Token Cost & Export to DaVinci Resolve */}
        <div className="absolute bottom-3 right-3 z-10 flex flex-col items-end gap-1.5">
          <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800/90 rounded-lg px-3 py-2 text-[11px] text-right">
            <div className="text-slate-400 flex items-center justify-end gap-1">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              <span>Model:</span>
              <strong className="text-white">
                {project.settings.aiModel === 'claude-opus-5-5' ? 'Opus 5.5' : 'Sonnet 5.5'} ({project.settings.effortLevel.toUpperCase()})
              </strong>
            </div>
            <div className="text-emerald-400 font-semibold mt-0.5">
              {project.tokensUsedMillions.toFixed(1)}M Tokens • ~{project.weeklyLimitPercent}% Weekly (Claude 20x)
            </div>
          </div>
        </div>
      </div>

      {/* Viewport Transport Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-[#0c1428] border-t border-slate-800/80 text-xs">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onTogglePlay}
            data-testid="viewport-play-toggle"
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1.5 transition shadow"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isPlaying ? 'Tạm dừng (Pause)' : 'Phát (Play Solid Real-Time)'}
          </button>

          <span className="font-mono text-slate-300 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
            {currentTimeSec.toFixed(2)}s / {project.audioDurationSec.toFixed(2)}s
          </span>

          {shadingMode === 'rendered' && (
            <span className="text-[11px] text-amber-300/90 hidden md:inline">
              💡 Mẹo: Phát trực tiếp dùng <strong>Solid View</strong>; dừng con trỏ để nạp Cache xem <strong>Rendered Preview</strong> hoặc xuất sang DaVinci Resolve.
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onForceCacheShot(activeShot.id)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition"
          >
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            Cache Shot #{activeShot.shotNumber}
          </button>
          <button
            type="button"
            onClick={onOpenExportModal}
            data-testid="btn-export-video"
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 transition shadow"
          >
            <Film className="w-3.5 h-3.5" />
            Export MP4 ({project.exportTimeSec}s) / DaVinci Resolve
          </button>
        </div>
      </div>
    </div>
  );
};
