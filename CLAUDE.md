# KayTech Hub

## Stack
- MERN: MongoDB (via Mongoose), Express, React, Node.js
- Auth: JWT + bcrypt. Roles: `student`, `instructor`, `admin`, `member`. Student and instructor accounts are **not** publicly self-registerable — see Invite Code System below.
- File storage: Cloudflare R2 (S3-compatible API via AWS SDK) — for both documents (PDFs) and images
- Payments: **offline only for now**. No payment gateway. Every payment record starts `pending` and admin manually flips it to `paid` after receiving money via bank transfer/cash. Do not add Paystack/Flutterwave/Stripe unless explicitly asked.

## Project structure
- `/client` — React frontend
- `/server` — Express backend (routes, controllers, models, middleware)
- `/server/models` — one file per Mongoose schema
- `/server/utils/upload.js` — shared file/image upload helper (R2). Reuse this everywhere; never write a second upload implementation.

## The three business modules — keep them separate
This app has three independent business lines sharing one login system. Don't let one module's logic leak into another.

1. **Academy** — courses, cohorts, enrollment, lessons, assignments, attendance, certificates, instructor payouts. This is the only module with cohorts, grading, and attendance.
2. **Hub** — Services and Mentorship. No cohorts, no attendance, no grading.
   - **Service**: has a short card description AND a full detail page (`/services/:id`) with `detailed_description`, up to 3 `gallery_images`, a `features` checklist, and `process_steps` ("How It Works"). "Request Service" is its own page (`/services/:id/request`, dark-panel form) — not a modal. Admin can create/edit via a full-page form (too much content for a modal). Admin can record one or more `ServicePayment`s per request (amount, method, date, note) for revenue tracking — a request isn't limited to one payment (deposits/milestones).
   - **Mentorship**: registration is a detailed form (full name, email, phone, occupation/status, experience level, reason for joining, how they heard about us — no login required). Admin can record one or more `MentorshipPayment`s per registration the same way, for revenue tracked separately from Academy and Services.
   - Both Services and Mentorship show a "Total Revenue" stat card on their admin pages (sum of their respective payment records) — kept separate from Academy's payment/payout figures.
3. **Space** — co-working/research space plans and subscriptions. Standalone — not linked to `User`, `Course`, or any other model. Registration is a detailed form (no login) — full name, email, phone, address, occupation/purpose, valid ID type + number, emergency contact — since members are physically on-site.

**Rule:** `Cohort`, `Enrollment`, and `Attendance` models belong to Academy only. Never reference them from Hub or Space features.

## Invite Code System — how signup actually works
Public signup does NOT let someone choose their own role. Instead:
- Admin generates an `InviteCode` (unique code, tied to a role: `student` or `instructor`, with an expiry).
- Signing up with a valid, unused, non-expired code grants that role.
- Signing up with no code, or an invalid/used/expired one, still creates an account — but with role `member` (no elevated permissions, same experience as a logged-out visitor).
- Login redirect: `student` → student dashboard, `instructor` → instructor dashboard, `admin` → admin panel, `member` → homepage.
- **Important distinction:** the invite code only grants the account *role*. It does NOT enroll a student into a specific cohort, or assign an instructor to a specific course — those remain separate admin actions in the Academy module (Enrollment and Cohort assignment).

## User Management — already built (pulled forward from Site-Wide module)
Admin can already: view all users (filter/search by role), change any user's role directly (no invite code needed — e.g. promote member → instructor, instructor → admin, demote instructor → member), delete any user (with confirmation), and delete/revoke any invite code. Don't rebuild this when reaching the Site-Wide Admin module later — just extend it if needed.

## Instructor payouts — percentage-of-payment accrual, not flat rate
Each cohort has an `instructor_payout_percent` (default 35%, admin-adjustable) instead of a flat `rate_per_student`. Students can pay in installments — each Enrollment tracks `total_fee`, `amount_paid`, and `balance_remaining`. Every time admin marks an individual Payment (installment) as paid, the system automatically adds `payment.amount × instructor_payout_percent/100` onto that instructor's `InstructorPayout.unpaid_amount` for that cohort — this is a running ledger, not a one-time calculation.
`InstructorPayout` has two separate running totals: `unpaid_amount` (owed, grows with each verified installment) and `paid_amount` (already paid out). When admin clicks "Mark as Paid," the current `unpaid_amount` moves onto `paid_amount` and `unpaid_amount` resets to 0 — new installments after that start accruing fresh, never touching the existing `paid_amount`.
The Admin Payout page also shows a **Projected Additional Payout** per cohort (`balance_remaining × instructor_payout_percent/100`, summed across that cohort's enrollments) — this is informational only (money not yet collected), kept visually distinct from the real `unpaid_amount` ledger.
The actual payout still happens offline — admin just clicks "Mark as Paid" once they've sent the money.

## Design System — already established, reuse it everywhere
Colors: Ink Navy `#10142B` (dark backgrounds), Cloud `#F5F6FA` (page background), Signal Amber `#FFB020` (primary buttons/accents), Circuit Teal `#2DD4BF` (AI-related tags/badges only), Slate `#5B6072` (muted text).
Fonts: Clash Display (headings), Inter (body), JetBrains Mono (small eyebrow/tag labels styled like code).
Card style: white background, soft shadow, rounded corners, monospace eyebrow tag, hover lift + amber glow border. Buttons: one consistent solid-amber-pill primary style and one ghost/outline secondary style, used everywhere. Scroll-triggered fade+slide-up reveals (staggered), respecting `prefers-reduced-motion`. The animated terminal-typing effect is a Home-page-only signature moment — don't repeat it elsewhere.
**Mobile drawers/sidebars (nav menu, Admin/Student/Instructor sidebars):** must use a shared, reliable pattern — partial width (not full screen), dimmed overlay behind it, high z-index above page content, and body scroll locked while open. This bug has recurred before — don't regress it.
When building new pages, apply this existing system rather than introducing new colors/fonts/patterns.

## Dashboard Shell — shared Sidebar + Topbar (already built)
One shared `Sidebar` component (Ink Navy, grouped nav items under JetBrains Mono section labels, active item has a Framer Motion `layoutId` sliding pill indicator in Signal Amber, collapse/expand toggle on desktop, user profile card at bottom) and one shared `Topbar` component (page title/breadcrumb, notification bell wired to the Notification system, user avatar dropdown) — both accept a role-specific nav list as a prop and are reused across Admin, Instructor, and Student. Don't build separate implementations per role.

## Admin Page Template — shared pattern (already built)
Every admin data page (Courses, Cohorts, Approvals, Registrations, Payments, Scholarships, Users, Invite Codes, Job Listings, Notifications) follows one shared template: page header (title + subtitle + primary action button), a stat cards row using the exact same stat card component as the main Admin Dashboard, a filter/search bar, a data table with color-coded status pill badges, and create/edit via a light-background modal or slide-over (not the dark-panel style — that's reserved for public-facing forms). Reuse this template for any new admin page rather than styling one from scratch.

## Career module — already built
Public "Careers" page lists open `JobListing`s (title, description, requirements, location, type, status) with an "Apply Now" form creating a `JobApplication` (full_name, email, phone, resume_file_url via upload utility, cover_note, status). Admin manages listings and views applications per listing.

## Notification system — already built
Admin has a "Notifications" page with two views: **Sent** (compose a `Notification` — title, message, target_type of all/all_students/all_instructors/specific_user — and view history) and **Inbox** (incoming `ContactMessage`s from the public Contact form, linked to a `sender_id` when the submitter was logged in). Students/instructors have their own "Notifications" page showing messages targeted at them, with read/unread state tracked via `NotificationRead`.

## Home page section order (already built)
Hero → Courses Overview → Scholarship Banner → Mentorship Preview (up to 4 open programs + "View More" button) → Services Preview (up to 4 services + "View More" button) → Student Success Stories → Testimonials → Call To Action. Keep new Home sections in this established order unless explicitly told to rearrange.

## Conventions
- Every model that's admin-created and shown publicly (Course, ScholarshipProgram, Service, MentorshipProgram, WorkspacePlan, BlogPost) has an `image_url` field, set via the shared upload utility.
- No video anywhere in this app. Lessons use notes (PDF), resources (links/files), and coding exercises — not video.
- Certificates are placeholder PDFs for now (name, course, date only) — no template design work until after launch.
- Attendance is marked per physical class session, not weekly.
- Use Mongoose `ref` for relationships (e.g. `Enrollment.cohort_id` references a `Cohort` document) — don't duplicate data across collections.

## Environment variables (expected in `.env`, never commit this file)
```
MONGODB_URI=
JWT_SECRET=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_ENDPOINT_URL=
```

## Commands
Fill these in based on your actual project setup once confirmed — typically for a MERN split frontend/backend:
```
cd client && npm run dev     # start React frontend
cd server && npm run dev     # start Express backend
```

## Workflow
- Build one module/feature at a time, fully working, before moving to the next — don't try to build multiple modules in one pass.
- After building a feature, tell me how to test it manually (which page to visit, what to click) rather than assuming it works.
- If a request would blur the module boundaries above (e.g. reusing Cohort logic in Mentorship), flag it instead of proceeding.