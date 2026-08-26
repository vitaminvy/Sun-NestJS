# Sun NestJS — Tài liệu kiến thức

Project thực hành REST API với NestJS 11 và TypeScript. README này tổng hợp cách chạy dự án và các khái niệm đang dùng trong source.

## Công nghệ

- NestJS 11, TypeScript
- MySQL + TypeORM, migrations
- JWT, Passport và bcrypt
- Redis (ioredis) để blacklist token khi logout
- class-validator/class-transformer
- Swagger, nestjs-i18n
- Multer/FileInterceptor cho upload avatar

## Chạy project

Yêu cầu Node.js, MySQL và Redis. Tạo database `realworld_db`, sau đó tạo `.env`:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=
DB_DATABASE=realworld_db
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=1d
REDIS_HOST=localhost
REDIS_PORT=6379
```

```bash
npm install
npm run migration:run
npm run start:dev
```

- API: `http://localhost:3000/api`
- Swagger: `http://localhost:3000/api-docs`
- Static files: `http://localhost:3000/public/...`

Lệnh thường dùng:

```bash
npm run build
npm run lint
npm test
npm run test:e2e
npm run migration:show
npm run migration:revert
```

## Kiến trúc NestJS

```text
Request -> Guard -> Interceptor -> ValidationPipe
        -> Controller -> Service -> Repository/Redis -> Response
```

- **Module**: gom controller, provider và dependency theo nghiệp vụ.
- **Controller**: định nghĩa route, nhận input và gọi service.
- **Service**: xử lý nghiệp vụ; dependency được inject qua constructor.
- **Provider**: thành phần do Nest quản lý vòng đời (service, guard...).
- **Repository**: truy vấn entity bằng TypeORM.

`main.ts` cấu hình global prefix `api`, static assets, Swagger và:

```ts
new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});
```

## Cấu trúc source

```text
src/
├── main.ts                 # bootstrap, pipe, Swagger, static files
├── app.module.ts           # module gốc, MySQL, i18n
├── users/                  # user, DTO, entity, controller, service
├── auth/                   # JWT guard, decorator, payload
├── follows/                # profile, follow/unfollow
├── articles/               # article CRUD và tag
├── attachments/           # metadata file/avatar
├── uploads/                # cấu hình upload
├── redis/                  # Redis service/module
├── database/               # DataSource và migrations
└── i18n/                   # bản dịch en/vi
```

## DTO và validation

DTO là hợp đồng dữ liệu của API; entity chỉ mô tả dữ liệu database. Dùng `@IsEmail()`, `@MinLength()`, `@ValidateNested()` để kiểm tra input và `@Type()` cho DTO lồng nhau. Với `whitelist` và `forbidNonWhitelisted`, field không khai báo sẽ bị loại bỏ hoặc trả lỗi.

Request đăng ký:

```json
{"user":{"username":"johndoe","email":"john@example.com","password":"password123"}}
```

## TypeORM và migration

`@Entity()` map class vào bảng; `@Column()`, `@PrimaryGeneratedColumn()`, `@CreateDateColumn()` và `@UpdateDateColumn()` map cột tương ứng. Quan hệ follow là self-referencing `ManyToMany` qua bảng `user_follows`; avatar có metadata ở bảng attachments.

Project đặt `synchronize: false`, vì vậy thay đổi schema phải đi qua migration:

```bash
npm run migration:create -- src/database/migrations/CreateSomething
npm run migration:run
```

Không bật `synchronize: true` trên production.

## JWT, Guard và Redis

1. Password được hash bằng bcrypt khi đăng ký.
2. Login kiểm tra bằng `bcrypt.compare()` và cấp JWT.
3. Client gửi `Authorization: Token <jwt>`.
4. `JwtAuthGuard` verify token, kiểm tra Redis blacklist rồi gắn `request.user`/`request.token`.
5. `@CurrentUser()` và `@CurrentToken()` đọc dữ liệu trong controller.
6. Logout lưu token vào Redis với TTL để thu hồi quyền truy cập.

`OptionalJwtAuthGuard` cho phép request không token; nếu có token thì token vẫn phải hợp lệ. Guard này được dùng cho profile để tính trạng thái `following`.

## Upload avatar

`FileInterceptor('avatar', avatarUploadOptions)` nhận multipart field `avatar`. File được lưu tại `public/uploads/avatars`, phục vụ qua `/public/uploads/avatars/...`, đồng thời metadata được lưu trong attachments.

- Tối đa 5 MB
- MIME: GIF, JPEG, PNG, WebP
- Khi cập nhật, database transaction và cleanup file cũ cần được xử lý độc lập

## i18n và Swagger

- Bản dịch: `src/i18n/en/translation.json`, `src/i18n/vi/translation.json`
- Chọn ngôn ngữ bằng `?lang=vi`
- Swagger dùng `@ApiTags`, `@ApiOperation`, `@ApiBody`, `@ApiOkResponse`

## Endpoint chính

| Method | Endpoint | Auth | Chức năng |
|---|---|---|---|
| POST | `/api/users` | Không | Đăng ký |
| POST | `/api/users/login` | Không | Đăng nhập |
| GET | `/api/user` | Bắt buộc | Lấy user hiện tại |
| PUT | `/api/user` | Bắt buộc | Cập nhật user/avatar |
| POST | `/api/user/logout` | Bắt buộc | Logout/blacklist token |
| GET | `/api/profiles/:username` | Tùy chọn | Xem profile |
| POST | `/api/profiles/:username/follow` | Bắt buộc | Follow |
| DELETE | `/api/profiles/:username/follow` | Bắt buộc | Unfollow |

## Checklist phát triển

- Tạo DTO và validation cho input mới.
- Không trả password/hash ra response.
- Dùng guard cho endpoint cần đăng nhập.
- Dùng repository/parameterized query, không nối SQL từ input.
- Tạo migration cho mọi thay đổi schema.
- Viết unit/e2e test và cập nhật Swagger, i18n.
- Không commit `.env` hoặc JWT secret.

## Tài liệu tham khảo

- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [NestJS OpenAPI](https://docs.nestjs.com/openapi/introduction)
