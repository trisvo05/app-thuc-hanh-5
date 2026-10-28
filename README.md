# Bài thực hành 5 – Chat 1-1 Realtime

Ứng dụng React Native CLI (không dùng Expo) với Firebase Authentication, Firebase Realtime Database, React Navigation và chia sẻ vị trí thật.

## Tình trạng source đầu vào

Workspace được cung cấp chỉ có template React Native 0.88.1 (`App.tsx` hiển thị `NewAppScreen`). Không có màn hình, bottom tabs, dữ liệu mẫu hoặc Firebase của Bài 4. Vì vậy màn hình Thông báo hiện là màn hình trống độc lập; cần đối chiếu với source Bài 4 nếu giảng viên yêu cầu giữ nguyên nội dung/giao diện gốc.

## Cấu hình Firebase Console

1. Cấu hình Web app của project `thuchanhapp-cbf76` đã được điền trong `src/config/firebaseConfig.ts`. Nếu dùng project khác, thay toàn bộ giá trị bằng cấu hình của project đó.
2. Trong **Build > Authentication > Sign-in method**, bật **Email/Password**.
3. Trong **Build > Realtime Database**, xác nhận database ở `asia-southeast1` đã được tạo và URL khớp `databaseURL` trong file cấu hình.
4. Trong tab **Rules** của Realtime Database, triển khai nội dung `firebase-database.rules.json` do giảng viên cung cấp. File trong repo đã được cập nhật cho đúng rules này, nhưng chưa được triển khai lên Console. Rules trên server mới quyết định quyền; chỉ sửa file local sẽ không hết `Permission denied`.
5. Không dùng test mode với root `.read: true` / `.write: true`. Không đưa service account key vào ứng dụng.

Khi thiếu một trường cấu hình, app hiện màn hình “Cần cấu hình Firebase”; dữ liệu giả không được sử dụng.

## Chạy Android

Yêu cầu Node.js 22.11+, JDK và Android SDK đúng theo React Native CLI. Tại thư mục project:

```powershell
npm install
npm start
```

Mở terminal khác:

```powershell
npm run android
```

Cho phép quyền vị trí khi bấm nút 📍 trong Chat. AndroidManifest đã khai báo `ACCESS_FINE_LOCATION` và `ACCESS_COARSE_LOCATION`; iOS có mô tả `NSLocationWhenInUseUsageDescription`. Trên macOS, chạy `bundle exec pod install` trong `ios` sau khi cài dependency rồi `npm run ios`.

## Cấu trúc dữ liệu

- `/users/{uid}`: UID, họ tên, email, avatar URL tùy chọn.
- `/presence/{uid}`: `online`, `lastSeen`; `onDisconnect` đặt offline sau khi mất kết nối.
- `/conversations/{sortedUidA}_{sortedUidB}`: `participants: {uidA: true, uidB: true}`, `createdAt`.
- `/userConversations/{uid}/{conversationId}`: `peerId`, `updatedAt`, `unreadCount`, `lastReadMessageId`.
- `/messages/{conversationId}/{pushKey}`: tin text hoặc location cùng server timestamp.

Home lấy conversation thật từ `userConversations`, nghe tin nhắn realtime và tính unread từ message nằm sau `lastReadMessageId`; không cộng dồn counter khi listener chạy lại. Khi gửi, message và `unreadCount` của người nhận được cập nhật nguyên tử bằng Firebase `increment(1)`. Khi mở Chat, cursor chuyển tới tin cuối đã hiển thị và `unreadCount` về 0. Tin nhắn của chính mình không được tính unread. Chat xóa ô nhập chỉ sau khi Firebase xác nhận gửi thành công.

## Kiểm tra hai thiết bị

Sau khi bật Email/Password, xác nhận Realtime Database và triển khai rules:

1. Chạy app trên hai Android device/emulator cùng dùng Firebase project.
2. Đăng ký A trên máy 1 và B trên máy 2; xác nhận `/users/{uid}` có hồ sơ và không có mật khẩu.
3. Kiểm tra A thấy B trong Danh bạ và ngược lại. Thử tìm theo tên.
4. Kiểm tra trạng thái online; ngắt mạng hoặc đóng app một máy và chờ trạng thái offline qua `onDisconnect`, sau đó kết nối lại.
5. A gửi text, B nhận ngay; B trả lời, A nhận ngay. So sánh cả hai màn hình để chắc không trùng tin.
6. A gửi vị trí sau khi cấp quyền. B chạm tin vị trí và kiểm tra Google Maps mở đúng tọa độ. Thử từ chối quyền và thử khi GPS tắt.
7. Để B ở Home, A gửi thêm tin. Kiểm tra last message, thời gian, unread. B mở Chat thì unread về 0. Gửi tin từ B và xác nhận unread của B không tự tăng.
8. Đăng xuất ở Settings, kiểm tra quay về Login và nút Back không mở màn hình nội bộ.
9. Xem log và Firebase Console để bảo đảm thao tác hợp lệ không có `permission_denied`.

## Kiểm tra mã

```powershell
npm exec -- tsc --noEmit
npm run lint
npm test -- --runInBand
cd android
.\gradlew.bat assembleDebug
```

Các bài test tự động kiểm tra màn hình khi chưa cấu hình Firebase, quy tắc tạo conversation ID và unread cursor. Tích hợp Firebase thật, quyền GPS, presence và kiểm tra hai máy cần Firebase config, rules đã triển khai và thiết bị thật/emulator; không thể kết luận chỉ từ unit test.

Để kiểm thử rules trên Realtime Database emulator cục bộ (không chạm dữ liệu production), chạy:

```powershell
npm exec --yes --package firebase-tools@14.20.0 -- firebase emulators:start --only database --project demo-chat
```

Trong terminal khác chạy `npm run test:rules`. Smoke test kiểm tra hồ sơ, conversation, presence, text/location message, unread và chặn người ngoài đọc tin nhắn.

## Hướng dẫn nộp bài

Nộp source project (không nộp `node_modules`, build output hay service account key), `firebase-database.rules.json`, ảnh/video hai thiết bị trao đổi tin text và vị trí, ảnh Home unread trước/sau khi mở Chat, và ảnh trạng thái online/offline. Ghi rõ Firebase project dùng để chấm và bảo đảm Email/Password, Realtime Database cùng rules đã bật. Nếu cần giao diện Thông báo Bài 4, bổ sung source màn hình đó trước khi nộp.
