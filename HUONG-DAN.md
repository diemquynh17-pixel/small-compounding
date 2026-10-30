# Small Compounding — Hướng dẫn

App là một **PWA** (trang web cài được như app): một bộ mã dùng chung cho iPhone và Mac, chạy được khi không có mạng, dữ liệu nằm trên chính máy của bạn.

## Các file
| File | Tác dụng |
|---|---|
| `index.html` | Toàn bộ app (giao diện + logic) |
| `manifest.webmanifest` | Tên và icon khi cài ra màn hình chính |
| `sw.js` | Cho phép mở app khi không có mạng |
| `icons/`, `icons.js` | Icon của app và bộ icon giao diện (Tabler Icons, MIT) |
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
4. Trên máy còn lại, làm y hệt với **cùng token và cùng mật khẩu đồng bộ**. Dữ liệu của hai máy sẽ được gộp lại.

Sau đó app tự đồng bộ khi bạn mở app, khi quay lại app, và vài giây sau mỗi thay đổi.

- Nếu sửa cùng một mục trên cả hai máy, bản sửa sau cùng được giữ. Mục bị xóa ở một máy cũng bị xóa ở máy kia.
- **Két mật khẩu:** chỉ tạo két trên **một** máy. Đồng bộ xong, máy kia mở két bằng cùng mật khẩu chính.
- Token được lưu trên từng máy và không nằm trong file sao lưu. Nếu mất máy, vào github.com/settings/tokens để xóa token đó.

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
