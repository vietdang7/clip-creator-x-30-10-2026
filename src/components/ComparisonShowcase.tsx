import React, { useState } from 'react';
import {
  CheckCircle2,
  Columns,
  Cpu,
  FileAudio,
  Film,
  Sparkles,
} from 'lucide-react';
import { CreatorizeProject } from '../types/creatorize';
import { ModalDialog } from './ModalDialog';

interface ComparisonShowcaseProps {
  isOpen: boolean;
  projects: CreatorizeProject[];
  activeProjectId: string;
  onSelectProjectIntoWorkspace: (projectId: string) => void;
  onClose: () => void;
}

export const ComparisonShowcase: React.FC<ComparisonShowcaseProps> = ({
  isOpen,
  projects,
  activeProjectId,
  onSelectProjectIntoWorkspace,
  onClose,
}) => {
  const [selectedProjId, setSelectedProjId] = useState(activeProjectId);
  const currentProject = projects.find((p) => p.id === selectedProjId) || projects[0];

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Trình Chiếu Đối Chiếu Trực Diện: Creatorize AI (Opus 5.5 + Blender) vs Zack D. Films Gốc"
      subtitle="Phần 6 (00:10:36 – 00:12:39): Kiểm chứng chất lượng thực tế giữa bản dựng chỉ nạp Audio của Creatorize và bản gốc Zack D. Films"
      maxWidthClass="max-w-5xl"
    >
      <div className="space-y-5 text-xs">
        {/* Selector for the 3 Comparison Videos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {projects.map((proj, index) => {
            const isSelected = proj.id === currentProject.id;
            return (
              <button
                key={proj.id}
                type="button"
                data-testid={`compare-proj-btn-${proj.id}`}
                onClick={() => setSelectedProjId(proj.id)}
                className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-950/70 border-blue-400 ring-2 ring-blue-500/30'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold text-[10px]">
                      Video So Sánh #{index + 1}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        proj.settings.useReferenceVideo
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {proj.settings.useReferenceVideo ? 'Có Video Tham Chiếu' : '100% Audio-Only Input'}
                    </span>
                  </div>
                  <div className="font-bold text-white text-sm mt-2">{proj.name}</div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{proj.topicSummary}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-300">
                  <span>⚡ {proj.tokensUsedMillions.toFixed(1)}M Tokens</span>
                  <span>{proj.shots.length} Shots 3D</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Side-by-Side Comparison Stage */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
          {/* Left: Creatorize AI Output (Opus 5.5 Low + Blender) */}
          <div className="bg-[#06102b] border-2 border-blue-500/40 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-md bg-blue-600 text-white font-extrabold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Creatorize AI (Opus 5.5 Low + Blender)
              </span>
              <span className="text-emerald-300 font-mono font-bold">
                {currentProject.tokensUsedMillions.toFixed(1)}M Tokens (~{currentProject.weeklyLimitPercent}% Weekly)
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/70 border border-blue-500/20 text-slate-200 space-y-1.5">
              <div className="font-semibold text-blue-300 flex items-center gap-1.5">
                <FileAudio className="w-3.5 h-3.5" />
                Chứng minh cốt lõi (Key Proof):
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {currentProject.originalComparisonNotes}
              </p>
            </div>

            <div className="space-y-2">
              <div className="font-bold text-white">Chuỗi phân cảnh 3D do Claude Opus 5.5 tự dựng trong Blender:</div>
              {currentProject.shots.map((shot) => (
                <div
                  key={shot.id}
                  className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-300">
                      Shot #{shot.shotNumber}: {shot.title}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {shot.startSec}s – {shot.endSec}s (Frames {shot.startFrame}–{shot.endFrame})
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-200">&ldquo;{shot.narration}&rdquo;</p>
                  <p className="text-[10px] text-emerald-400">{shot.visualVerificationNote}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Original Zack D. Films Benchmark */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-200 font-bold flex items-center gap-1.5">
                  <Columns className="w-3.5 h-3.5 text-amber-400" />
                  Video Gốc Phong Cách Zack D. Films (Đối Chiếu)
                </span>
                <span className="text-amber-400 font-semibold">Studio Freelancer ($300–$800 / clip)</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="font-bold text-white text-sm">Bảng So Sánh Hiệu Quả Sản Xuất</div>
                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                    <div className="text-slate-400">Làm thủ công / Thuê Freelancer</div>
                    <div className="font-bold text-red-400 text-sm mt-0.5">Hàng trăm USD & Chờ nhiều ngày</div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Rủi ro cao khi đăng lên kênh mới chưa có lượt xem.
                    </p>
                  </div>
                  <div className="p-2.5 rounded bg-emerald-950/40 border border-emerald-500/30">
                    <div className="text-emerald-300">Creatorize + Claude Opus 5.5 (Low)</div>
                    <div className="font-bold text-emerald-400 text-sm mt-0.5">Chi phí cố định • Tự động 100%</div>
                    <p className="text-[10px] text-emerald-200/80 mt-1">
                      Chỉ tốn ~1% hạn mức tuần trên Claude 20x (5.4M token) hoặc chạy ngay trên Claude Pro $20/tháng.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-blue-400" />
                  Lời thoại gốc tách từ âm thanh (Full Transcript Synced):
                </div>
                <p className="text-slate-300 leading-relaxed italic bg-slate-950 p-3 rounded-lg border border-slate-800">
                  &ldquo;{currentProject.scriptText}&rdquo;
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Sẵn sàng nạp dự án này vào Timeline chính để kiểm tra từng Frame
              </span>
              <button
                type="button"
                data-testid="btn-load-comparison-project"
                onClick={() => {
                  onSelectProjectIntoWorkspace(currentProject.id);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5 shadow-lg"
              >
                <Film className="w-4 h-4" />
                Mở Dự Án Này Trên Timeline
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalDialog>
  );
};
