# Insights and event tracking

**What:** a merchant dashboard (`/insights`) with sessions, the funnel (view → add to bag → checkout), add-to-bag rate with vs without the advisor, where add-to-bag happens (product page, advisor, ritual), advisor tool use, Agent API calls and per-product conversion.

**Tracking:** `src/lib/analytics/track.ts` sends events with `navigator.sendBeacon` and a random per-tab session id (sessionStorage). `POST /api/events` validates strictly (Zod) and rate-limits 120/min. No names, emails or advisor text are recorded.

**Code:** `lib/analytics/events.ts` (allowed events), `insights.ts` (pure maths), `app/insights/page.tsx`, `components/analytics/`.

**Demo data:** `npm run db:seed-events` adds 14 days of events tagged `metadata.demo = true`; the page says when demo traffic is included.

**Limits:** no A/B testing yet, so advisor "lift" is a correlation, not proof.
