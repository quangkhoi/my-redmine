# Redmine Dashboard

Trang web tĩnh để lấy issue từ Redmine REST API và hiển thị theo các chức năng:

- Dash board
- Daily Report
- Weekly Report
- My Task
- Login time

## Cách chạy

Repo này có thể public trên GitHub Pages. Không commit API key hoặc Basic Auth username/password.

Mở GitHub Pages hoặc mở file local:

```text
C:\workspace\my-redmine\index.html
```

App dùng Cloudflare Worker HTTPS proxy mặc định được định nghĩa trong `app.js`. API key và Basic Auth được lưu bằng Cloudflare Worker secrets, không nhập trên UI.

Không cần cài server local hoặc build tool cho phần web UI.

## Cấu hình

Các cấu hình cố định nằm trong `app.js`:

```js
const REDMINE = {
  baseUrl: "https://redmine.wdm.co.jp/",
  proxyUrl: "https://redmine-https-proxy.qkhoiwork.workers.dev",
};
```

Nếu đổi Worker URL, sửa `REDMINE.proxyUrl` trong `app.js`.

## Cloudflare Worker HTTPS Proxy

Nếu Redmine không cho trình duyệt gọi API trực tiếp, dùng Worker trong thư mục:

```text
C:\workspace\my-redmine\cloudflare-worker
```

Xem hướng dẫn deploy tại:

```text
C:\workspace\my-redmine\cloudflare-worker\README.md
```

Sau khi deploy Worker mới, cập nhật `REDMINE.proxyUrl` trong `app.js`.

## GitHub Pages

Trong GitHub repo, vào `Settings` > `Pages`, chọn source branch `master` và folder `/ (root)`. Page public sẽ mở được UI, nhưng không có credential trong source. Người dùng cần cấu hình Cloudflare Worker HTTPS proxy.

## Dash board

Dashboard hiển thị 3 danh sách:

- `Processing`
- `Not started`
- `Processed`

Dữ liệu được lấy theo danh sách user ID định nghĩa trong `app.js`.

## Lưu ý CORS

Nếu Redmine không cho trình duyệt gọi API trực tiếp, bạn sẽ thấy lỗi CORS. Khi đó cần bật CORS trên Redmine hoặc dùng Cloudflare Worker HTTPS proxy.

## Lưu ý 401 Unauthorized

Nếu `https://redmine.wdm.co.jp/` trả `401 Unauthorized` trước khi vào được Redmine, nghĩa là có lớp xác thực server hoặc Basic Auth phía trước Redmine. API key Redmine không thay thế được lớp đăng nhập này.

Khi đó cần một trong các cách sau:

- Cấu hình Cloudflare Worker HTTPS proxy cho phép gọi Redmine API bằng API key và Basic Auth.
- Mở API từ cùng domain đã đăng nhập và bật CORS phù hợp nếu vẫn gọi trực tiếp bằng trình duyệt.
