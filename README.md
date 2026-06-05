# Redmine Dashboard

Trang web tĩnh để lấy issue từ Redmine REST API và hiển thị theo 3 chức năng:

- Dash board
- Report
- Login time

## Cách chạy

Chạy proxy local nhẹ để tránh CORS và thêm Basic Auth:

```powershell
powershell -ExecutionPolicy Bypass -File C:\workspace\redmine-dashboard\proxy.ps1
```

Hoặc chạy file:

```text
C:\workspace\redmine-dashboard\start-proxy.bat
```

Để nút `Chạy lại proxy` trong web tự gọi file proxy, chạy một lần:

```powershell
powershell -ExecutionPolicy Bypass -File C:\workspace\redmine-dashboard\install-proxy-protocol.ps1
```

Sau đó mở file `index.html` bằng trình duyệt:

```text
C:\workspace\redmine-dashboard\index.html
```

Không cần cài server hoặc build tool.

## Cấu hình

Sửa file `config.js` nếu cần đổi URL, API key, status hoặc danh sách login:

```js
window.REDMINE_CONFIG = {
  baseUrl: "https://redmine.wdm.co.jp/",
  apiKey: "your-api-key",
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

`allowedAssigneeIds` dùng khi tài khoản API không có quyền đọc `/users.json` để tự map login sang user id.

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
