# ContinuityCare Connect

ContinuityCare Connect is a medical tourism continuity-of-care web app for international patients who receive treatment in India and need structured post-operative support after returning home.

The app demonstrates a role-based healthcare workflow across patients, specialists, local healthcare providers, and administrators. It was built with Lovable, React, TypeScript, Supabase, shadcn/ui, and Tailwind CSS.

## Live / Lovable Project

Lovable Website URL: https://continuitycare-connect.lovable.app

## Core User Portals

| Portal | Purpose |
|---|---|
| Patient Portal | Track care plans, record vitals, report symptoms, and join tele-visits. |
| Specialist Console | Manage recovery templates, active episodes of care, and care plan assignments. |
| Local Provider Portal | View authorized patient data when consent has been granted. |
| Admin Console | Manage users, consent records, audit logs, compliance reports, and analytics. |

## Demo Login Credentials

These are demo accounts only and should not be used for production data.

| Role / Portal | Email | Password |
|---|---|---|
| Patient A | `patient-a@test.com` | `password123` |
| Patient B | `patient-b@test.com` | `password123` |
| Specialist | `specialist@test.com` | `password123` |
| Local Provider | `local-provider@test.com` | `password123` |
| Admin | `admin@test.com` | `password123` |

Additional local-provider consent testing can be run from `/seed`, which may create/use `provider-local@test.com` with the same password.

## Recommended Demo Flow

1. Visit the app and open the sign-in page.
2. Use the demo credential buttons on the sign-in page, or manually enter one of the demo accounts above.
3. Start with `patient-a@test.com` to view the patient recovery workflow.
4. Sign out and use `specialist@test.com` to view specialist-side care plan management.
5. Use `local-provider@test.com` for the local provider portal.
6. Use `admin@test.com` to explore admin, consent, audit, reporting, and analytics tools.
7. Visit `/seed` if you need to refresh demo data, generate audit records, or test all sign-ins.

## Main Routes

| Route | Description |
|---|---|
| `/` | Landing page |
| `/auth` | Sign in / sign up |
| `/dashboard/patient` | Patient dashboard |
| `/dashboard/specialist` | Specialist console |
| `/dashboard/provider` | Local provider portal |
| `/dashboard/admin` | Admin dashboard |
| `/admin/users` | Admin user management |
| `/admin/consent` | Consent management |
| `/admin/audit` | Audit log explorer |
| `/admin/reports` | Compliance reports |
| `/admin/analytics` | Analytics dashboard |
| `/tele-visit` | Tele-visit room |
| `/seed` | Demo data seeding and sign-in testing |

## Tech Stack

- Vite
- React
- TypeScript
- Supabase Auth, Database, and Edge Functions
- shadcn/ui
- Tailwind CSS
- React Router
- TanStack React Query
- Zod validation

## Local Development

Prerequisites:

- Node.js and npm installed
- Supabase project configured
- Environment variables from `.env.example`

```sh
git clone https://github.com/RRSGit97/continuitycare-connect.git
cd continuitycare-connect
npm install
cp .env.example .env
npm run dev
```

Then open the local URL printed in the terminal.

## Environment Variables

Create a `.env` file with:

```sh
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_anon_key
```

Do not commit service role keys or production secrets.

## Demo Data

The `/seed` route can seed demo users and sample data for testing. It includes utilities for:

- Creating/resetting demo users
- Seeding a local provider consent scenario
- Generating audit data
- Generating analytics demo data
- Testing whether all demo accounts can sign in successfully

## Presentation Notes

For a portfolio or interview walkthrough, highlight:

- Role-based access control across four user types
- Patient consent-gated data sharing with local providers
- Post-operative care plan and adherence tracking
- Vitals and symptom reporting
- Admin audit/compliance workflows
- Supabase-backed authentication, database, and serverless seeding functions

## Future Improvements

- Add a short product demo video or screenshots to this README.
- Add deployed app URL once published.
- Add automated smoke tests for auth redirects and portal access.
- Add stricter production safeguards around `/seed`.
- Add sample environment setup steps for Supabase migrations and Edge Function deployment.
- Add richer empty states so demo users without seeded records still understand what to do next.
