# 🏐 VolleyBook: Enterprise-Grade Booking SaaS

A high-performance, resilient venue booking and management system built with Next.js and Supabase. Designed to handle high-concurrency scenarios, enforce strict data consistency, and execute automated risk control mechanisms.

👉 **[Live Demo](<https://volley-book.vercel.app/>)**

## 🚀 1-Click Recruiter / Guest Access
To evaluate the core administrative features without manual registration, please use the 1-Click Login button on the authentication page, or use the following credentials:
* **Email**: `demo@volleybook.com`
* **Password**: `demoPassword123` *(Note: Replace with your actual demo password)*

Once logged in, navigate to the **Manage Game** section to test the real-time QR Code attendance scanner and the database-driven credit scoring system.

---

## 🏗️ Core Architectural Decisions

This project is engineered to solve complex business logic and operational bottlenecks commonly found in high-traffic transactional systems (e.g., booking platforms, iGaming).

### 1. Zero-Overbooking Concurrency Defense (Database-Level Atomicity)
Client-side validation is fundamentally flawed under heavy load. To prevent severe race conditions where multiple users compete for the last available slot:
* Migrated the core reservation logic to a **PostgreSQL Stored Procedure (RPC)**.
* Implemented strict **Row-Level Locks (`SELECT ... FOR UPDATE`)** inside a `BEGIN ... COMMIT` transaction block.
* **Impact**: Physically guarantees data consistency at the database layer, eliminating any possibility of capacity overflow regardless of concurrent API requests.

### 2. Event-Driven Risk Control & Credit System
Malicious "no-shows" degrade platform revenue and user experience. To mitigate this, I built a tamper-proof state machine in the database:
* Deployed **PostgreSQL Triggers** (`AFTER UPDATE`) on the `bookings` table.
* Any change in attendance status (Present, Late, No-show) automatically triggers a strict recalculation of the user's `credit_score`.
* **Read-Optimized Caching**: The computed score is materialized back into the `profiles` table to ensure $O(1)$ read performance for the frontend manager dashboard.

### 3. Edge-Level Defense in Depth (Rate Limiting - *Planned*)
To protect the database connection pool from bot scraping and brute-force attacks:
* Architecture designed to intercept requests at the **Next.js Middleware (Edge Network)** layer.
* Utilizing In-Memory Cache (Redis) and a Sliding Window algorithm to drop malicious payloads before they reach the main application server.

---

## 💻 Tech Stack
* **Framework**: Next.js 14 (App Router, Server Actions)
* **Database & Auth**: Supabase (PostgreSQL, Row Level Security, Triggers, RPC)
* **Styling & UI**: Tailwind CSS, shadcn/ui, Lucide Icons
* **Deployment**: Vercel (Frontend & Edge Middleware)

---

## 🛠️ Local Development

1. Clone the repository and install dependencies:
   ```bash
   git clone https://github.com/Tom910117/volley-book.git
   cd volley-book
   npm install
2. Configure Environment Variables:
Create a .env.local file based on the provided .env.example and add your credentials:
    ```NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    # Add RESEND_API_KEY and INTERNAL_WEBHOOK_SECRET if testing email/webhook features
3. Run the development server:
   ```bash
   npm run dev
```