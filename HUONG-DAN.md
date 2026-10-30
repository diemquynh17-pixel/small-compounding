# Small Compounding — Hướng dẫn

App là một **PWA** (trang web cài được như app): một bộ mã dùng chung cho iPhone và Mac, chạy được khi không có mạng, dữ liệu nằm trên chính máy của bạn.

## Các file
| File | Tác dụng |
|---|---|
| `index.html` | Toàn bộ app (giao diện + logic) |
| `manifest.webmanifest` | Tên và icon khi cài ra màn hình chính |
| `sw.js` | Cho phép mở app khi không có mạng |
| `icons/` | Icon của app |

## Đưa app lên mạng (miễn phí, khoảng 10 phút) — GitHub Pages
1. Tạo tài khoản tại github.com → bấm **New repository** → đặt tên `small-compounding` → chọn **Public** → Create.
2. Bấm **uploading an existing file** → kéo thả cả 4 mục ở trên (kể cả thư mục `icons`) → **Commit changes**.
3. Vào **Settings → Pages** → Source: `Deploy from a branch`, Branch: `main` / `(root)` → Save.
4. Sau khoảng 1 phút, app có địa chỉ `https://<tên-github>.github.io/small-compounding/`.

> Mã nguồn công khai thì không sao: dữ liệu của bạn **không** nằm trên GitHub mà chỉ nằm trong trình duyệt trên máy bạn.

## Cài app vào máy
- **iPhone (Safari):** mở địa chỉ trên → nút Chia sẻ (□↑) → **Thêm vào MH chính**.
- **Mac (Safari 17+):** mở địa chỉ → menu **File → Add to Dock**. (Chrome: biểu tượng cài đặt ở thanh địa chỉ.)

## Lưu ý quan trọng
- **Dữ liệu riêng cho từng máy.** iPhone và Mac không tự đồng bộ với nhau. Để chuyển dữ liệu: ⚙️ → Xuất bản sao lưu → gửi file qua AirDrop → bên máy kia chọn ⚙️ → Nhập.
- **Sao lưu mỗi tuần** (⚙️ → Xuất). Nếu xóa app hoặc xóa dữ liệu Safari thì dữ liệu trên máy cũng mất theo.
- **Mật khẩu chính** của két: quên là mất, không có cách khôi phục.
- **Nhắc nhở:** app chỉ báo khi đang mở. Nếu muốn được báo cả khi đã đóng app, bấm 📅 để thêm nhắc nhở vào app Lịch.

## Chạy thử trên máy tính (không bắt buộc)
```
cd small-compounding
python3 -m http.server 8000
```
Sau đó mở http://localhost:8000
