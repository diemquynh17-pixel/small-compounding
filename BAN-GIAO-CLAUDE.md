# Bàn giao cho Claude: Small Compounding và vault Quinn's Board

File này tóm tắt những gì đã làm trong phiên cloud trước, để một phiên Claude chạy trên Mac (trong thư mục vault **Quinn's Board**) làm tiếp được ngay. Đọc hết trước khi sửa gì.

## Người dùng
- Viết và trả lời bằng **tiếng Việt**. Người dùng mới học lập trình: giải thích từng bước, dễ hiểu; nói rõ kết quả mong đợi, người dùng cần làm gì, Claude làm gì. Thiếu thông tin thì hỏi lại.
- Với tính năng chưa quen: **tìm dự án mã nguồn mở trên GitHub trước**, so sánh cách làm, rồi mới bắt tay làm.
- Máy: Mac **Ventura 13.7.8** (Safari không có "Add to Dock"), iPhone. Obsidian: vault **Quinn's Board**.

## App Small Compounding
- Repo: https://github.com/diemquynh17-pixel/small-compounding (nhánh `main`, đẩy lên là GitHub Pages tự cập nhật)
- App đang chạy: https://diemquynh17-pixel.github.io/small-compounding/
- Là một PWA, chỉ có HTML/CSS/JS thuần, không có bước build: `index.html` (toàn bộ app), `sw.js` (bộ nhớ đệm offline), `icons.js` (Tabler Icons), `fonts/` (Be Vietnam Pro, Newsreader), `obsidian-plugin/`.
- **Mỗi lần sửa app: tăng `CACHE` trong `sw.js`** (hiện là `sc-v5`), nếu không điện thoại sẽ giữ bản cũ.
- Chức năng: Hôm nay (Daily check thói quen, việc hôm nay, nhắc nhở, ghi nhanh), Việc trong tuần, Ghi chú (#tag), Sách, Tổng kết tuần (so sánh với tuần trước, biểu đồ "Lãi kép"), két Mật khẩu (AES-256-GCM, PBKDF2 600k), Cài đặt.
- Giao diện theo **taste-skill** (github.com/Leonxlnx/taste-skill), style *editorial-greeting*: màu xanh lá `#2f7a55` đặt trên dữ liệu và một nút chính; không emoji; panel một tông, không bóng đổ; có chế độ tối.

### Dữ liệu (localStorage `small-compounding.v1`)
`{ v, habits[{id,name,target}], habitsU, logs{ 'YYYY-MM-DD': { habitId: {done, min, u} } }, tasks[{id,title,date,done,doneAt,min,created,u}], notes[{id,text,created,pinned,u}], readings[...], reminders[...], vault{salt,iter,iv,ct,u}, del{ id: thờiĐiểmXóa } }`
- Mọi thay đổi phải đặt `u = Date.now()`; xóa thì ghi `del[id]`. Khi gộp dữ liệu, bản ghi có `u` lớn hơn thắng; mục bị xóa có `del[id] >= u` thì bỏ.

### Đồng bộ (GitHub Gist)
- Gist bí mật chứa file `small-compounding.sync.json` = `{app, v:1, salt, iter:310000, iv, ct, at}`. `ct` là toàn bộ dữ liệu, mã hóa AES-GCM bằng khóa PBKDF2-SHA256 sinh từ mật khẩu đồng bộ (dạng Unicode NFC; khi mở thì thử cả NFC, NFD và bản bỏ dấu cách thừa).
- **Mã kết nối** = `SC1.` + base64(JSON `{t: token, p: mật khẩu, g: gistId}`). Đây là **bí mật**: không bao giờ in ra, ghi vào note hay commit.
- Token và cài đặt đồng bộ lưu ở localStorage `sc.sync`, không nằm trong file sao lưu.
- Lỗi đã sửa (đừng để tái phát): hàm `canon()` trước đây chỉ so khóa ở tầng ngoài, nên việc tích ✓ không được đồng bộ. Giờ dùng `stable()` để so sâu ở mọi tầng.

## Plugin Obsidian: `obsidian-plugin/small-compounding-sync/` (main.js, manifest.json)
- Đồng bộ hai chiều **Việc hôm nay** của app với **Daily note hôm nay**. Đường dẫn note lấy từ plugin lõi Daily notes; với vault này là `Daily/YYYY-MM-DD.md`.
- Chỉ ghi giữa `%% small-compounding:start %%` và `%% small-compounding:end %%`. Lần đầu, khối được đặt ở cuối mục `## Việc hôm nay`. Mỗi dòng có dạng `- [ ] tiêu đề %%sc:<id>%%`.
- Một dòng chỉ được coi là người dùng sửa trong Obsidian khi nó khác với lần plugin ghi trước (`lastWritten`). Ngoài trường hợp đó, app thắng.
- Cài đặt plugin lưu ở `.obsidian/plugins/small-compounding-sync/data.json` (có token, **không chia sẻ, không commit**).
- **Chưa được thử trên Obsidian thật**, mới chạy trên Obsidian giả lập. Việc cần làm đầu tiên là cài vào vault và kiểm tra cùng người dùng.

### Cài plugin vào vault (làm từ thư mục gốc của vault)
```bash
mkdir -p ".obsidian/plugins/small-compounding-sync"
curl -fsSL -o ".obsidian/plugins/small-compounding-sync/main.js" https://raw.githubusercontent.com/diemquynh17-pixel/small-compounding/main/obsidian-plugin/small-compounding-sync/main.js
curl -fsSL -o ".obsidian/plugins/small-compounding-sync/manifest.json" https://raw.githubusercontent.com/diemquynh17-pixel/small-compounding/main/obsidian-plugin/small-compounding-sync/manifest.json
```
Sau đó người dùng làm trong Obsidian: Settings → Community plugins → bật Community plugins → ↻ → bật **Small Compounding Sync** → ⚙️ → dán mã kết nối (trong app: Cài đặt → Sao chép mã kết nối). Đừng tự sửa `community-plugins.json` khi Obsidian đang mở; để người dùng bật trong giao diện.

## Vault Quinn's Board (đã thấy qua ảnh chụp)
- Thư mục: `Claude/`, `Daily/` (Daily note `2026-10-31` có properties `type: daily`, `date`, `tags: daily`…), `Projects/`, `TaskNotes/`, `Templates/`; file `CLAUDE`, `Hướng dẫn sử dụng`, `Insights Desk`, `My Board` (Base), `Welcome`.
- Dùng plugin **TaskNotes**. Daily note có mục "Việc hôm nay" liệt kê task của TaskNotes ("Scheduled: Today").
- Vault đã có file **CLAUDE** riêng của người dùng: đọc và tôn trọng file đó, không ghi đè.
- Chưa biết vault đồng bộ sang iPhone bằng iCloud hay Obsidian Sync. Cần hỏi người dùng (để plugin chạy được trên iPhone).

## Việc còn mở / ý tưởng
1. Cài và thử plugin trên Obsidian thật; sửa nếu khối việc đặt sai chỗ.
2. Có thể nối với TaskNotes: tạo TaskNote cho từng việc thay vì checkbox. Cần đọc định dạng TaskNotes trong vault trước và hỏi người dùng.
3. Kiểm tra iPhone đã đồng bộ được chưa (đã thêm mã kết nối và chức năng tự tìm đúng gist).
4. Mọi thay đổi app: thử bằng Playwright (giả lập api.github.com), tăng `CACHE` trong `sw.js`, commit vào repo `small-compounding`, không đưa bí mật vào commit.
