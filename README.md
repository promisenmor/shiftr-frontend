# Shiftr frontend

The Shiftr frontend is built with Next.js App Router. The dashboard requests
weekly totals from the backend; it does not derive them from the shifts shown
in the week list.

## Backend API contract

Set `NEXT_PUBLIC_API_URL` to the backend origin when it is hosted separately.
The frontend expects these endpoints:

- `GET /api/weekly-summary?weekStart=YYYY-MM-DD&timeZone=Europe%2FLondon`
  returns `weekStart`, `targetMinutes`, `workedMinutes`, `remainingMinutes`,
  `overtimeMinutes`, and a `shifts` array. Each shift has an `id`, `date`
  (`YYYY-MM-DD`), nullable `startTime` and `endTime`, and `netMinutes`.
- `POST /api/shifts` accepts either a `mode: "start-end"` payload with
  `startDate`, `startTime`, `endDate`, and `endTime`, or a `mode: "duration"`
  payload with a date and gross duration in minutes. Both include
  `timeZone: "Europe/London"` and break records with `durationMinutes` and
  `paid`, and may include a local `startAt` when break timing matters. The
  response returns the saved shift.

The backend remains responsible for validation, time-zone-aware duration and
weekly allocation, transactions, and the selected week's summary calculation.
If an endpoint is unavailable, the UI surfaces the request error instead of
substituting client-side totals.

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
