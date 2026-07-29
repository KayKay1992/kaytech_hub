# KayTech Hub

## Stack
- MERN: MongoDB (via Mongoose), Express, React, Node.js
- Auth: JWT + bcrypt. Role stored in the token: `student`, `instructor`, `admin`
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

## Instructor payouts — calculated automatically, paid manually
`InstructorPayout.total_amount` is always `students_count × rate_per_student`, computed by the system — never entered manually. The actual payout still happens offline; admin just marks it `paid` once they've sent the money.

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
(Fill these in once the project is scaffolded — e.g. `npm run dev`, `npm test`, `npm run build`.)

## Workflow
- Build one module/feature at a time, fully working, before moving to the next — don't try to build multiple modules in one pass.
- After building a feature, tell me how to test it manually (which page to visit, what to click) rather than assuming it works.
- If a request would blur the module boundaries above (e.g. reusing Cohort logic in Mentorship), flag it instead of proceeding.
