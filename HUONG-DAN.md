# Small Compounding — Hướng dẫn

App là một **PWA** (trang web cài được như app): một bộ mã dùng chung cho iPhone và Mac, chạy được khi không có mạng, dữ liệu nằm trên chính máy của bạn.

## Các file
| File | Tác dụng |
|---|---|
| `index.html` | Toàn bộ app (giao diện + logic) |
| `manifest.webmanifest` | Tên và icon khi cài ra màn hình chính |
| `sw.js` | Cho phép mở app khi không có mạng |
| `icons/`, `icons.js` | Icon của app và bộ icon giao diện (Tabler Icons, MIT) |
| `obsidian-plugin/` | Plugin Obsidian đồng bộ Việc hôm nay với Daily note |
| `fonts/` | Font Be Vietnam Pro và Newsreader (SIL Open Font License), có dấu tiếng Việt |

## Đưa app lên mạng (miễn phí, khoảng 10 phút) — GitHub Pages
1. Tạo tài khoản tại github.com → bấm **New repository** → đặt tên `small-compounding` → chọn **Public** → Create.
2. Bấm **uploading an existing file** → kéo thả cả 4 mục ở trên (kể cả thư mục `icons`) → **Commit changes**.
3. Vào **Settings → Pages** → Source: `Deploy from a branch`, Branch: `main` / `(root)` → Save.
4. Sau khoảng 1 phút, app có địa chỉ `https://<tên-github>.github.io/small-compounding/`.

> Mã nguồn công khai thì không sao: dữ liệu của bạn **không** nằm trên GitHub mà chỉ nằm trong trình duyệt trên máy bạn.

## Cài app vào máy
- **iPhone (Safari):** mở địa chỉ trên → nút Chia sẻ (□↑) → **Thêm vào MH chính**.
- **Mac (Safari 17+):** mở địa chỉ → menu **File → Add to Dock**. (Chrome: biểu tượng cài đặt ở thanh địa chỉ.)

## Đồng bộ iPhone và Mac
Dữ liệu được **mã hóa ngay trên máy** bằng mật khẩu đồng bộ, rồi mới lưu vào một *gist bí mật* trong tài khoản GitHub của bạn. GitHub chỉ thấy chuỗi ký tự đã mã hóa.

1. Mở app, vào **Cài đặt → Đồng bộ iPhone và Mac**.
2. Bấm link tạo token (ô `gist` đã được tích sẵn). Ở Expiration chọn **No expiration**, bấm **Generate token**, rồi sao chép token (bắt đầu bằng `ghp_`).
3. Dán token và đặt **mật khẩu đồng bộ** (ít nhất 8 ký tự), rồi bấm **Kết nối và đồng bộ**.
4. Trên máy còn lại, **không cần gõ lại**: ở máy vừa kết nối, vào Cài đặt và bấm **Sao chép mã kết nối**. Dán mã đó vào ô **Dán mã kết nối** trên máy kia (dán qua Handoff, hoặc gửi bằng AirDrop hay Ghi chú), rồi bấm **Kết nối bằng mã**. Dữ liệu của hai máy sẽ được gộp lại.

> Trên iPhone, ô mật khẩu luôn dùng bàn phím tiếng Anh nên không gõ được chữ có dấu. Hãy dùng mã kết nối, hoặc đặt mật khẩu đồng bộ **không dấu**.

Sau đó app tự đồng bộ khi bạn mở app, khi quay lại app, và vài giây sau mỗi thay đổi.

- Nếu sửa cùng một mục trên cả hai máy, bản sửa sau cùng được giữ. Mục bị xóa ở một máy cũng bị xóa ở máy kia.
- **Két mật khẩu:** chỉ tạo két trên **một** máy. Đồng bộ xong, máy kia mở két bằng cùng mật khẩu chính.
- Token được lưu trên từng máy và không nằm trong file sao lưu. Nếu mất máy, vào github.com/settings/tokens để xóa token đó.

## Obsidian (vault Quinn's Board)

### 1. Việc hôm nay tự đồng bộ hai chiều với Daily note (plugin Small Compounding Sync)
Cài một lần trên Mac:
1. Trong app Small Compounding, vào **Cài đặt → Obsidian**, bấm tải **main.js** và **manifest.json**. Hai file sẽ nằm trong thư mục Downloads.
2. Trong Obsidian, vào **Settings → Community plugins**. Bấm **Turn on community plugins** nếu chưa bật.
3. Bấm biểu tượng **thư mục** cạnh dòng *Installed plugins*. Finder sẽ mở thư mục `.obsidian/plugins` của vault.
4. Tạo thư mục tên `small-compounding-sync`, rồi kéo hai file vừa tải vào đó.
5. Quay lại Obsidian, bấm nút **làm mới** (↻) cạnh *Installed plugins*, rồi bật **Small Compounding Sync**.
6. Bấm biểu tượng ⚙️ của plugin. Dán **mã kết nối** (trong app: Cài đặt → Sao chép mã kết nối).

Từ đó, mở Daily note hôm nay (ví dụ `Daily/2026-10-31`), danh sách việc sẽ hiện ở cuối mục **Việc hôm nay**:
- Tích hoặc bỏ tích trong Obsidian thì app cũng đổi theo, và ngược lại.
- Gõ thêm một dòng `- [ ] việc mới` vào giữa hai dòng `%% small-compounding %%` thì việc đó xuất hiện trong app.
- Xóa một dòng trong khối thì việc đó bị xóa trong app.
- Plugin không đụng vào phần TaskNotes hay bất kỳ nội dung nào khác của bạn.
- Plugin tự đồng bộ mỗi phút, khi mở Daily note và sau khi bạn sửa note. Muốn đồng bộ ngay: bấm biểu tượng ↻ ở thanh bên trái, hoặc dùng lệnh `Small Compounding: Đồng bộ việc hôm nay` (Cmd+P).

**Trên iPhone:** plugin chạy được trên Obsidian iPhone nếu vault được đồng bộ, kèm thư mục `.obsidian`. Nếu dùng Obsidian Sync, bật *Installed community plugins* và *Active community plugin list* trong cài đặt Sync. Nếu dùng iCloud thì thư mục này tự đi theo.

> Mã kết nối được lưu trong file `.obsidian/plugins/small-compounding-sync/data.json` của vault. Đừng chia sẻ thư mục này cho người khác.

### 2. Gửi ghi chú, sách, tổng kết tuần sang Obsidian
- Bấm nút **↗** ở mỗi ghi chú hoặc mỗi cuốn sách, hoặc nút **Ghi vào Obsidian** ở màn Tuần.
- File được tạo trong `Small Compounding/Ghi chú`, `/Sách`, `/Tuần`. Đổi tên vault hoặc thư mục trong **Cài đặt → Obsidian**.
- **Mật khẩu không bao giờ được gửi sang Obsidian.**

### 3. Mở app ngay trong Obsidian (Mac)
1. **Settings → Community plugins → Browse**, tìm **Custom Frames**, bấm **Install** rồi **Enable**.
2. Mở cài đặt Custom Frames, bấm **Add frame**:
   - URL: `https://diemquynh17-pixel.github.io/small-compounding/`
   - Tên: `Small Compounding`
   - Bật **Add ribbon icon**.
3. Bấm biểu tượng mới ở thanh bên trái để mở app ngay cạnh ghi chú.
4. Lần đầu mở, app trong Obsidian chưa có dữ liệu. Vào Cài đặt của app và dán **mã kết nối** để nó đồng bộ.

## Lưu ý quan trọng
- Vẫn nên **sao lưu định kỳ** (Cài đặt → Xuất bản sao lưu).
- Quên **mật khẩu chính** của két thì mất dữ liệu trong két. Quên **mật khẩu đồng bộ** thì bấm Ngắt đồng bộ, xóa gist `small-compounding.sync.json` trên gist.github.com, rồi kết nối lại bằng mật khẩu mới.
- **Nhắc nhở** chỉ báo khi app đang mở. Bấm nút lịch để thêm nhắc nhở vào app Lịch, khi đó bạn được báo cả khi đã đóng app.
- **Mac Ventura (13):** Safari không có Add to Dock. Hãy ghim tab (Window → Pin Tab) hoặc kéo địa chỉ trang xuống Dock.

## Chạy thử trên máy tính (không bắt buộc)
```
cd small-compounding
python3 -m http.server 8000
```
Sau đó mở http://localhost:8000
