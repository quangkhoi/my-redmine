# Redmine Dashboard

Trang web tĩnh để lấy issue từ Redmine REST API và hiển thị theo các chức năng:

- Dash board
- Daily Report
- Weekly Report
- My Task
- Login time

## Cách chạy

Repo này có thể public trên GitHub Pages. Không commit API key, Basic Auth username/password hoặc file proxy thật.

Mở GitHub Pages hoặc mở file local:

```text
C:\workspace\my-redmine\index.html
```

Khi cần load data, nhập Redmine URL/API key/Basic Auth trong panel `Redmine Config`. Các giá trị này chỉ lưu trong `sessionStorage` của tab trình duyệt.

Nếu Redmine chặn CORS, tạo proxy local từ file mẫu:

```powershell
Copy-Item C:\workspace\my-redmine\proxy.example.ps1 C:\workspace\my-redmine\proxy.ps1
```

Sửa `proxy.ps1` bằng credential thật, rồi chạy proxy local:

```powershell
powershell -ExecutionPolicy Bypass -File C:\workspace\my-redmine\proxy.ps1
```

Hoặc chạy file nếu `proxy.ps1` đã tồn tại:

```text
C:\workspace\my-redmine\start-proxy.bat
```

Để nút `Chạy lại proxy` trong web tự gọi file proxy, chạy một lần:

```powershell
powershell -ExecutionPolicy Bypass -File C:\workspace\my-redmine\install-proxy-protocol.ps1
```

Sau đó mở file `index.html` bằng trình duyệt:

```text
C:\workspace\my-redmine\index.html
```

Không cần cài server hoặc build tool.

## Cấu hình

`config.example.js` chứa cấu hình public không có secret. Nếu muốn dùng config local thay vì nhập trên UI, copy file mẫu:

```powershell
Copy-Item C:\workspace\my-redmine\config.example.js C:\workspace\my-redmine\config.js
```

Sau đó sửa `config.js` trên máy local:

```js
window.REDMINE_CONFIG = {
  baseUrl: "https://redmine.wdm.co.jp/",
  proxyUrl: "http://127.0.0.1:8787",
  apiKey: "your-api-key",
  basicAuth: {
    username: "your-basic-auth-user",
    password: "your-basic-auth-password",
  },
  statuses: {
    processing: "処理中",
    notStarted: "未対応",
    processed: "処理済み",
  },
  statusIds: {
    processing: 2,
    notStarted: 1,
    processed: 3,
  },
  allowedLogins: ["duydinh", "khoiduong@freec.asia"],
  allowedAssigneeIds: [123, 456],
};
```

`config.js` và `proxy.ps1` nằm trong `.gitignore`, không được push lên GitHub.

`allowedAssigneeIds` dùng khi tài khoản API không có quyền đọc `/users.json` để tự map login sang user id.

## GitHub Pages

Trong GitHub repo, vào `Settings` > `Pages`, chọn source branch `master` và folder `/ (root)`. Page public sẽ mở được UI, nhưng không có credential trong source. Người dùng cần nhập credential trên panel `Redmine Config` hoặc chạy proxy local.

## Dash board

Dashboard hiển thị 3 danh sách, cùng thứ tự cột:

```text
id, project, subject, assignee, status, start date, due date, % done
```

Tất cả danh sách được sort theo:

```text
start date, due date, id
```

Ngày lọc được tính theo ngày hiện tại:

- Thứ 2 tuần trước: dùng cho `start date >=`.
- Thứ 6 tuần sau: dùng cho `due date <=` ở danh sách `未対応`.
- Danh sách `処理済み` loại các issue có `% done = 100`.
- Dữ liệu được lấy theo `assigned_to_id` trong `allowedAssigneeIds`.

## Lưu ý CORS

Nếu Redmine không cho trình duyệt gọi API trực tiếp, bạn sẽ thấy lỗi CORS. Khi đó cần bật CORS trên Redmine hoặc dùng proxy nội bộ.

## Lưu ý 401 Unauthorized

Nếu `https://redmine.wdm.co.jp/` trả `401 Unauthorized` trước khi vào được Redmine, nghĩa là có lớp xác thực server hoặc Basic Auth phía trước Redmine. API key Redmine không thay thế được lớp đăng nhập này.

Khi đó cần một trong các cách sau:

- Cấu hình server/proxy cho phép gọi `/issues.json` bằng API key.
- Cung cấp cơ chế proxy nội bộ thêm xác thực server trước khi chuyển tiếp request tới Redmine.
- Mở API từ cùng domain đã đăng nhập và bật CORS phù hợp nếu vẫn gọi trực tiếp bằng trình duyệt.
