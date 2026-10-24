# Shiftr frontend

The Shiftr frontend is built with Next.js App Router and connects to the Django
backend in the sibling `shiftr-backend` project. The dashboard requests weekly
totals from the backend; it does not derive them from the shifts shown in the
week list.

## Run the application

Start the backend first using the [backend setup guide](../shiftr-backend/README.md).
Configure the frontend API proxy by copying `.env.example` to `.env.local` and
setting `SHIFTR_API_URL` to the backend origin (the local default is
`http://127.0.0.1:8000`). The Next.js proxy forwards `/backend-api/*` to the
backend `/api/*` routes, so browser requests stay same-origin.

Then run the frontend:

```powershell
npm run dev
```

Create an account at `/register`, then log in at `/login`. Authentication uses
the backend's short-lived JWT access token and rotating refresh token. Tokens
are held in tab-scoped session storage and are not persisted across browser
sessions.

## Backend integration

The frontend uses the backend API documented at `/api/docs/`:

- `POST /api/auth/register/`, `/api/auth/login/`, `/api/auth/refresh/`, and
  `/api/auth/logout/`
- `GET /api/profile/`
- `GET, POST /api/shifts/`
- `PUT /api/weekly-targets/{week_start}/`
- `GET /api/weeks/{week_start}/summary/`

The shift form sends timed shifts as offset-aware instants in the
`Europe/London` time zone and duration shifts as minutes. Break records use the
backend's `duration_minutes`, `is_paid`, `start_at`, and `end_at` fields. The
backend owns validation, DST handling, weekly allocation, and summary
calculation.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
