# Kế hoạch Triển khai Toàn diện: Smart AI Helpdesk (30 Days Sprint)

Bản kế hoạch này được thiết kế theo chuẩn **Enterprise Workflow**, kéo dài 30 ngày để xử lý số lượng Models/Migrations lớn, nghiệp vụ phức tạp, tích hợp AI, Real-time (SignalR) và triển khai bằng Docker. Tuyệt đối không làm giao diện (FE) cho đến khi Backend hoàn thiện 100%.

## 1. Kiến trúc Kỹ thuật (Tech Stack)
- **Backend:** .NET 8, Clean Architecture, CQRS (MediatR), Entity Framework Core.
- **Cơ sở dữ liệu & Caching:** PostgreSQL, Redis.
- **Real-time & Background:** SignalR, IHostedService.
- **Frontend (Từ Day 21):** React + Vite + TailwindCSS + Zustand/Redux.
- **AI:** OpenAI API (IT Triage, Auto-reply).

## 2. Lộ trình Phân chia Task (30 Days Sprint)

### Giai đoạn 1: Foundation & Cấu hình lõi (Days 1-5)
- **Day 1:** Khởi tạo Git (`main`, `develop`). Setup thư mục Clean Architecture. Commit trực tiếp lên `develop`.
- **Day 2:** Thiết lập CI Pipeline (GitHub Actions).
- **Day 3:** Global Exception Handling (Middleware) & Serilog.
- **Day 4:** Base Entities (Id, CreatedAt, UpdatedAt) & Result Pattern.
- **Day 5:** Pagination Standard & Interfaces lõi.

### Giai đoạn 2: Database Models & Migrations (Days 6-10)
- **Day 6:** Thiết kế chi tiết Models: `User`, `Role`, `Ticket`, `TicketMessage`, `Category`, `Attachment`, `AuditLog`.
- **Day 7:** Cấu hình EF Core DbContext, Fluent API (Relationships, Indexes).
- **Day 8:** Initial Migration & DB Seeding.
- **Day 9:** Repository Pattern & Unit of Work.
- **Day 10:** Tích hợp Redis Caching.

### Giai đoạn 3: Application Logic & CQRS (Days 11-16)
- **Day 11:** Cài đặt MediatR, Validation Pipeline.
- **Day 12:** Authentication (Đăng nhập, JWT & Refresh Token).
- **Day 13:** CQRS cho Ticket (Tạo mới, Cập nhật trạng thái).
- **Day 14:** CQRS cho Ticket Messages & Internal Notes.
- **Day 15:** File Upload (Lưu ảnh/tài liệu đính kèm).
- **Day 16:** Admin CQRS (Quản lý User, Category).

### Giai đoạn 4: AI Integration & Background Processing (Days 17-20)
- **Day 17:** OpenAI SDK Integration (Prompt Engineering cho IT Helpdesk).
- **Day 18:** Background Worker (Auto-Triage chạy ngầm).
- **Day 19:** AI Sentiment Analysis & Auto-reply suggestion.
- **Day 20:** SignalR (Real-time Notifications).

### Giai đoạn 5: Frontend Development (Days 21-27) - [BẮT ĐẦU UI]
- **Day 21:** Setup React, Vite, Tailwind, Router.
- **Day 22:** Zustand & Axios Interceptors.
- **Day 23:** Design System (Sidebar, Header, Buttons, Modals).
- **Day 24:** Login/Register & Route Guards.
- **Day 25:** Dashboard Page.
- **Day 26:** Ticket Detail Page (Chat UI).
- **Day 27:** Tích hợp SignalR Client.

### Giai đoạn 6: Testing, Docker & Triển khai (Days 28-30)
- **Day 28:** Unit Tests & E2E Test cơ bản.
- **Day 29:** Viết `Dockerfile` cho Backend và Frontend.
- **Day 30:** `docker-compose.yml` kết nối toàn hệ thống.
