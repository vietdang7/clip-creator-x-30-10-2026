# Kế Hoạch Kiến Trúc & Phát Triển Ứng Dụng Creatorize Studio (Opus 5.5 + Blender 3D Shorts Engine)

> Tài liệu này phân tích chi tiết 100% tính năng, luồng hoạt động (workflow), cấu hình (settings), và kiến trúc hệ thống dựa trên video hướng dẫn **"Opus 5.5 + Blender = MEGA Viral Zack D Films 3D Shorts Animations"** (`https://www.youtube.com/watch?v=UtYKuSbQPVA`), đồng thời cung cấp khung sườn hoàn chỉnh (Full-Stack Ready) để kết nối các tài khoản AI, tài khoản tạo model video/hình ảnh, giọng đọc và Blender.

---

## 1. Tổng Quan Kiến Trúc Hệ Thống (Core Architecture)

Ứng dụng **Creatorize Studio** hoạt động theo cơ chế **Audio-First 3D Spatial Pipeline** — biến một file âm thanh đầu vào (hoặc kịch bản tự sinh qua AI + ElevenLabs) thành video hoạt họa 3D phong cách **Zack D. Films** thông qua sự kết hợp giữa:
1. **Local Transcription & Word-Level Aligner**: Làm sạch âm thanh và đồng bộ từng từ (word-level timestamps) với từng khung hình (frames @ 30/60 FPS) trong ~20 giây.
2. **Google Flow Storyboard Engine**: Đọc lời thoại đã tách để tự động sinh ảnh định hướng bố cục (**5–7 Moments**) kết hợp với từ khóa phong cách tổng thể (**Global Style Key**).
3. **Claude Opus 5.5 (Low Effort) + Visual Verification Pass (`Ultra Edit`)**: Nhận bộ ảnh Storyboard + Global Style Key + Word-level Timestamps để viết mã Python (`bpy`) dựng cảnh 3D trong Blender, mô phỏng vật lý và tự kiểm tra bằng hình ảnh (visual verification pass).
4. **3D Viewport & Dual-Mode Timeline Cache**:
   - **Solid View (Khối thô)**: Cho phép phát trực tiếp theo thời gian thực (real-time playback) trên nền lưới xanh vô tận (bluish infinite grid).
   - **Rendered View (Kết xuất có Cache)**: Khi dừng con trỏ (playhead) tại một khung hình, hệ thống tạo bộ nhớ đệm (scene cache) cho phân cảnh đó rồi mới render khung hình chất lượng cao lên màn hình xem trước.
5. **Multi-Account Pool & Auto-Failover**: Quản lý các tài khoản Claude (Claude 20x, Claude Pro, Anthropic API), Google Flow, ElevenLabs, YouTube Data API và các tài khoản Video/Image AI (Seedance 2.5, Kling, Wan 3.0, KIE.ai), tự động chuyển đổi tài khoản khi chạm giới hạn phiên (session/weekly limit).

---

## 2. Đối Chiếu 100% Tính Năng & Chi Tiết Setting Theo Transcript

### Phần 1 & 4: Viewport, Cache & Timeline (00:00:00 – 00:02:21 & 00:07:38 – 00:09:28)
| Tính năng | Chi tiết kỹ thuật từ Video | Trạng thái trong App |
| :--- | :--- | :--- |
| **Chế độ xem 3D Viewport** | Chuyển đổi giữa **Solid View** (phát real-time mượt mà) và **Rendered Preview** (yêu cầu dừng con trỏ để tạo cache trước khi hiển thị ảnh render). | Đã tích hợp đầy đủ |
| **Cơ chế Frame Caching** | Khi kéo thanh timeline ở chế độ 3D, dừng con trỏ tại frame sẽ kích hoạt tiến trình tạo cache phân cảnh (`Caching shot frames...`) trước khi hiển thị bản kết xuất. | Đã tích hợp đầy đủ |
| **Theo dõi Token & Chi phí** | Hiển thị chi tiết lượng token tiêu thụ (VD: `5.4M tokens` hoặc `10.0M tokens`), thời gian dựng (`40m` / `2h 00m`), và % hạn mức gói **Claude 20x** (`~1% Weekly Limit`, `~4% Session Limit`) hoặc khả năng chạy trên **Claude Pro $20/tháng**. | Đã tích hợp đầy đủ |
| **Xuất Video (Export)** | Xuất MP4/WebM khung hình dọc (9:16 Shorts) hoặc ngang (16:9), độ phân giải 1080p / 4K (160 giây), kèm xuất script Python `.py` cho Blender và đưa sang DaVinci Resolve. | Đã tích hợp đầy đủ |

### Phần 2: Khởi Tạo Dự Án & Toàn Bộ Chi Tiết Settings (00:02:21 – 00:04:58)
1. **Nguồn đầu vào Âm thanh / Kịch bản**:
   - **Kéo thả file âm thanh có sẵn** (`.mp3`, `.wav`, `.m4a`) trực tiếp vào giao diện (chế độ chỉ dùng âm thanh - *Audio-Only Input*).
   - **Tự viết kịch bản & Tạo giọng đọc ngay trong ứng dụng**: Tích hợp sẵn **ElevenLabs API** + AI Script Writer.
   - **Đính kèm Video / Ảnh tham chiếu (Tùy chọn)**: Hỗ trợ cả chế độ *Audio-Only* (như video cắt chai thủy tinh & viên đạn) lẫn chế độ *Có Video Tham Chiếu* (như video di dời núi Everest).
2. **Danh sách 8 Phong cách hình ảnh (Visual Styles) chuẩn 100%**:
   - `Pixel Art` *(Phong cách khởi nguồn của Creatorize)*
   - `Vox Collage` *(Phong cách cắt dán báo chí/tài liệu phổ biến)*
   - `Flat Explainer` *(Hoạt hình 2D phẳng giải thích)*
   - `Microsoft Paint Explainer` *(Phong cách vẽ MS Paint hài hước)*
   - `3D Reconstruction` *(Tái dựng hiện trường 3D cho phim tài liệu)*
   - `Low Poly Shorts` *(Hoạt hình 3D đa giác thấp triệu view)*
   - `3D Cartoon Shorts` *(Hoạt hình 3D nhân vật)*
   - `3D Informational (Zack D. like)` **[NEW]** *(Phong cách mô phỏng Zack D. Films với nền lưới vô tận màu xanh lam)*
3. **Thời lượng mục tiêu (Target Duration)**: Thiết lập mặc định `30 giây` (hỗ trợ tùy chỉnh 15s, 30s, 45s, 60s hoặc theo độ dài file âm thanh).
4. **Chế độ Kiểm duyệt & Làm mịn (Edit / Verification Pass Mode)**:
   - `Standard Verified` *(Kiểm duyệt tiêu chuẩn - khả dụng ở gói Standard & Premium)*
   - `Ultra Edit` / `Ultra Edit pass` *(Chỉnh sửa siêu cấp - bao gồm Visual Verification Pass tự soi lỗi không gian 3D và sửa code Blender)*.
5. **Cấu hình Mô hình AI (Model Selection)**:
   - `Claude Opus 5.5` *(Khuyên dùng: Nhận thức không gian 3D - spatial awareness vượt trội, xử lý chuẩn xác ngay từ lần thử đầu tiên ở mức Low)*.
   - `Claude Sonnet 5.5` *(Kèm cảnh báo: Kém nhận thức không gian 3D; khi chạy visual verification pass nhận ra lỗi nhưng lúng túng không biết sửa, gây tốn thời gian và đốt token)*.
6. **Mức thiết lập nỗ lực (Effort / Thinking Level)**:
   - `Low` *(Mặc định & Khuyên dùng cho Opus 5.5 — cân bằng hoàn hảo giữa tốc độ và chi phí token ~5.4M–10M)*.
   - `Medium`
   - `High`
   - `Extra High` *(Đáng giá nếu ưu tiên chất lượng tối đa)*.
   - `Max` *(Có cảnh báo đỏ: Tuyệt đối không nên chọn vì cực kỳ chậm và không đáng công chờ đợi)*.
7. **Làm sạch và căn chỉnh thời gian âm thanh (`Clean and time the audio`)**:
   - Kích hoạt **Local Transcription Model** chạy cục bộ, đồng bộ chính xác từng từ được phát âm với từng khung hình trong ~20 giây.

### Phần 3: Storyboard với Google Flow & Chạy Tiến Trình Dựng (00:04:58 – 00:07:38)
1. **Số lượng khoảnh khắc (`Moments`)**:
   - Thanh chọn từ **5 đến 7 mốc** (`5`, `6`, `7` Moments — mặc định là `5`).
2. **Tích hợp `Google Flow`**:
   - Đăng nhập bằng tài khoản Google cá nhân, tận dụng lượng credit miễn phí có sẵn trong Google Flow (chi phí phát sinh $0).
3. **Từ khóa phong cách tổng thể (`Global Style Key`)**:
   - Cài đặt sẵn prompt tối ưu cho phong cách Zack D. Films: *Phông nền lưới vô tận màu xanh lam (bluish infinite grid) cùng vật thể chính được trưng bày ở ngay trung tâm, vật liệu bóng bẩy, mặt cắt trực quan và mô phỏng vật lý*.
   - Nút **Edit** để tự chỉnh sửa.
   - Nút **Ask Claude to Suggest Style** (nhờ chính Claude gợi ý phong cách cụ thể).
   - Tùy chọn **Upload Custom Reference Images** (tải lên ảnh mẫu riêng).
4. **Quy trình `Make the stills` -> `Use those five`**:
   - Phân tích lời thoại vừa tách từ âm thanh để hiểu chủ đề video.
   - Khởi chạy Google Flow sinh hàng loạt phương án ảnh tĩnh minh họa cho từng phân đoạn.
   - Cho phép người dùng tự tay tick chọn đúng 5 bức ảnh ưng ý nhất và nhấn **`Use those five`** (hoặc `Use those 6` / `Use those 7` tùy số Moments đã chọn).
5. **Giới hạn thời gian (`Time Limit` - Mẹo "Gaslight" Claude)**:
   - Tùy chọn: `Unlimited` (Không giới hạn - mặc định trong bài test) hoặc giới hạn thời gian cụ thể (`15m`, `30m`, `45m`, `60m`, `90m`).
   - Giải thích rõ cơ chế: Đặt giới hạn thời gian sẽ "thao túng tâm lý" (gaslight) Claude khi ngân sách token hạn hẹp, buộc Claude làm việc gọn gàng và tối ưu hóa quy trình hơn.
6. **Nút `Start build` & Đồng hồ bấm giờ (Live Build Stopwatch)**:
   - Chạy tiến trình dựng tự động kèm đồng hồ đếm thời gian trực tiếp và nhật ký sinh mã Blender + kiểm tra hình ảnh.

### Phần 5: Gói Cước (Standard vs Premium), Routines, Custom Styles & YouTube API (00:09:28 – 00:10:36)
- **Quản lý Gói cước (Standard vs Premium)**:
  - **Standard**: Mở khóa toàn bộ 8 phong cách đồ họa, xuất video dọc (Vertical Export 9:16), tối đa 12 video/tháng, chế độ `Standard Verified`, hỗ trợ nhắn tin 1-1 với tác giả.
  - **Premium**: Toàn bộ quyền lợi Standard + **Routines** (lịch trình tự động làm video khi đang ngủ), mở khóa **Ultra Edit**, **Custom Styles** (huấn luyện phong cách riêng từ mẫu có sẵn hoặc tạo mới từ con số 0), **Custom Character / Avatar** riêng cho từng video, xuất video **4K**, **30+ ngôn ngữ**, kết nối **YouTube Data API** (tự động đọc retention analytics & bình luận để tự học hỏi cải thiện video sau), **Unlimited Exports** và chuyển đổi nhiều tài khoản Claude liên tục.

### Phần 6: Trình Chiếu So Sánh Trực Diện (AI vs Zack D. Films Gốc) (00:10:36 – 00:12:39)
- Tích hợp sẵn 3 dự án mẫu từ video để đối chiếu trực tiếp:
  1. **Cắt chai thủy tinh làm cốc bằng lửa và nước đá** *(Audio-Only, 5.4M tokens, 5 Moments, Ultra Edit)*.
  2. **Viễn cảnh di dời đỉnh núi Everest sang nước Mỹ** *(Có dùng Video tham chiếu + Audio, 10.0M tokens, 6 Shots)*.
  3. **Cơ chế kích nổ bên trong viên đạn khi bóp cò súng** *(Audio-Only, 4 Shots giải phẫu mặt cắt 3D)*.

---

## 3. Cấu Trúc Thư Mục & Điểm Kết Nối Tài Khoản (Account Integration Points)

```text
clip-creator-x-30-10-2026/
├── PLAN.md                          # Bản kế hoạch & kiến trúc hệ thống chi tiết
├── package.json                     # Cấu hình dependencies & scripts (Vite + React + Three.js + Vitest)
├── src/
│   ├── types/
│   │   └── creatorize.ts            # Định nghĩa toàn bộ kiểu dữ liệu Settings, Styles, Storyboard, Accounts
│   ├── data/
│   │   └── presetProjects.ts        # 3 dự án mẫu chuẩn từ video + 8 phong cách + Global Style Keys
│   ├── services/
│   │   ├── aiPipelineService.ts     # Khung sườn kết nối Claude Opus 5.5, Google Flow, ElevenLabs, Blender & Video Models
│   │   └── blenderScriptGenerator.ts# Bộ sinh mã Python (bpy) thực tế cho Blender 4.x theo từng phân cảnh
│   ├── components/
│   │   ├── Viewport3D.tsx           # Màn hình 3D Three.js/Blender với lưới xanh vô tận, Solid View & Frame Cache
│   │   ├── ProjectSettingsModal.tsx # Toàn bộ cấu hình dự án chuẩn 100% theo video
│   │   ├── StoryboardFlowModal.tsx  # Bảng điều khiển Storyboard (5-7 Moments, Google Flow, Global Style Key)
│   │   ├── AccountsManagerModal.tsx # Trung tâm nạp tài khoản Claude, Google Flow, ElevenLabs, Seedance/Kling/Wan, YouTube API
│   │   ├── RoutinesAndStylesModal.tsx # Lịch trình tự động (Routines), Huấn luyện Custom Styles & YouTube Retention AI
│   │   └── ComparisonShowcase.tsx   # Chế độ đặt 2 video cạnh nhau (Creatorize AI vs Zack D. Films gốc)
│   ├── App.tsx                      # Giao diện chính Creatorize Studio
│   └── __tests__/
│       └── creatorize.test.tsx      # Bộ kiểm thử tự động xác minh 100% tính năng & settings
```

### Cách Nạp Tài Khoản Thực Tế Của Bạn
Khi mở ứng dụng, nhấp vào nút **"Accounts & API Hub"** trên thanh công cụ trên cùng để điền:
1. **Claude Accounts Pool**: Thêm 1 hoặc nhiều tài khoản Claude (`Claude 20x`, `Claude Pro`, hoặc `Anthropic API Key` / `Claude Code OAuth Token`). Bật **Auto-Switch Account on Limit** để tự động đổi tài khoản khi hết hạn mức phiên.
2. **Google Flow Account**: Điền Google Session / OAuth hoặc Vertex Imagen Key để tạo ảnh tĩnh Storyboard miễn phí.
3. **ElevenLabs & Audio Transcription**: Điền ElevenLabs API Key + Voice ID và cấu hình đường dẫn Whisper cục bộ.
4. **Video Model Accounts (Mở rộng)**: Hỗ trợ sẵn khe cắm cho `Seedance 2.5`, `Kling AI`, `Wan 3.0 / KIE.ai` nếu muốn kết hợp render hybrid.
5. **Blender Executable & YouTube Data API**: Cấu hình đường dẫn Blender (`/Applications/Blender.app/Contents/MacOS/Blender`) và YouTube Channel OAuth để tự động phân tích Retention & Comments.
