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
2. **Hub** — Services (business consulting requests) and Mentorship (paid program registration via a detailed form — full name, email, phone, occupation/status, experience level, reason for joining, how they heard about us — no login required). No cohorts, no attendance, no grading.
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

## Instructor payouts — calculated automatically, paid manually
`InstructorPayout.total_amount` is always `students_count × rate_per_student`, computed by the system — never entered manually. The actual payout still happens offline; admin just marks it `paid` once they've sent the money.

## Design System — already established, reuse it everywhere
Colors: Ink Navy `#10142B` (dark backgrounds), Cloud `#F5F6FA` (page background), Signal Amber `#FFB020` (primary buttons/accents), Circuit Teal `#2DD4BF` (AI-related tags/badges only), Slate `#5B6072` (muted text).
Fonts: Clash Display (headings), Inter (body), JetBrains Mono (small eyebrow/tag labels styled like code).
Card style: white background, soft shadow, rounded corners, monospace eyebrow tag, hover lift + amber glow border. Buttons: one consistent solid-amber-pill primary style and one ghost/outline secondary style, used everywhere. Scroll-triggered fade+slide-up reveals (staggered), respecting `prefers-reduced-motion`. The animated terminal-typing effect is a Home-page-only signature moment — don't repeat it elsewhere.
**Mobile drawers/sidebars (nav menu, Admin/Student/Instructor sidebars):** must use a shared, reliable pattern — partial width (not full screen), dimmed overlay behind it, high z-index above page content, and body scroll locked while open. This bug has recurred before — don't regress it.
When building new pages, apply this existing system rather than introducing new colors/fonts/patterns.

## Career module — already built
Public "Careers" page lists open `JobListing`s (title, description, requirements, location, type, status) with an "Apply Now" form creating a `JobApplication` (full_name, email, phone, resume_file_url via upload utility, cover_note, status). Admin manages listings and views applications per listing.

## Notification system — already built
Admin has a "Notifications" page with two views: **Sent** (compose a `Notification` — title, message, target_type of all/all_students/all_instructors/specific_user — and view history) and **Inbox** (incoming `ContactMessage`s from the public Contact form, linked to a `sender_id` when the submitter was logged in). Students/instructors have their own "Notifications" page showing messages targeted at them, with read/unread state tracked via `NotificationRead`.

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