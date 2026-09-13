# SaaS Call Agent Dashboard - Technical Implementation Plan

Build a production-grade, secure Next.js SaaS Call Agent Dashboard that connects HighLevel (GHL) CRM data with Twilio Browser-based Voice Calling. The core security mandate is that **call agents MUST NEVER see or receive customer phone numbers** at any point in client-side JS, network payloads, DOM, or storage.

---

## User Review Required

> [!IMPORTANT]
> **Initial Prototype Data & Auth Model**
> As specified in the master prompt:
> 1. **No Supabase / External DB initially**: Authentication and data storage will use environment variable credentials (`ADMIN_EMAIL`, `AGENT_EMAIL`) and an in-memory/modular TypeScript data layer (`lib/data/*`).
> 2. **Modular Architecture**: The data layer will strictly conform to TypeScript interfaces so it can be swapped with Supabase / PostgreSQL later without changing UI components or API handlers.
> 3. **Twilio & GHL Integration**: In development mode (when API keys are unconfigured), the system will display an integration status banner and offer mock calling / data while enforcing all security boundaries.

---

## Technical Architecture & Security Model

```
+------------------+         +------------------+         +---------------------+
|   Agent Browser  |         | Next.js API      |         |  GHL CRM API        |
| (Twilio SDK JS)  |         | (Server-Side)    |         | (Server-Side Only)  |
+--------+---------+         +--------+---------+         +----------+----------+
         |                            |                              |
         | 1. POST /api/calls/start   |                              |
         |    (contactId ONLY)        |                              |
         |--------------------------->| 2. Fetch GHL Contact         |
         |                            |----------------------------->|
         |                            |<-----------------------------|
         |                            |    (Private Phone Saved)     |
         | 3. POST /api/twilio/token  |                              |
         |<---------------------------| (Returns short-lived token)  |
         |                            |                              |
         | 4. Twilio Device.connect({ contactId })                   |
         +----------------------------+                              |
                      |                                              |
                      v                                              |
               +--------------+                                      |
               | Twilio Voice |                                      |
               | Infrastructure|                                     |
               +------+-------+                                      |
                      | 5. Webhook: POST /api/webhooks/twilio/voice  |
                      |    (Fetches private E.164 phone & returns TwiML <Dial>)
                      +---------------------------------------------->|
                      |                                               |
                      | 6. Dials Customer Phone                       |
                      v                                               |
              +---------------+                                       |
              | Customer Phone|                                       |
              +---------------+                                       |
```

### Zero-Phone-Exposure Rules
- `POST /api/leads` and `GET /api/leads/[id]` explicitly strip/omit phone properties before responding to client calls.
- Browser issues calls using `contactId` parameter passed to Twilio Voice SDK.
- Twilio TwiML App webhook (`/api/webhooks/twilio/voice`) resolves `contactId` to the E.164 phone number strictly on the server and returns `<Dial>` TwiML. Phone numbers are never transmitted to or held in browser JS.

---

## Proposed Changes

### Phase 1: Project Initialization & Core Infrastructure
- Initialize Next.js 14+ with App Router, TypeScript, Tailwind CSS, Lucide Icons, and Zod.
- Configure `tsconfig.json`, `tailwind.config.ts`, `components.json`, and `.env.example`.

#### [NEW] [package.json](file:///c:/Teknoverse%20Projects/Twiolo%20Dashboard/package.json)
#### [NEW] [.env.example](file:///c:/Teknoverse%20Projects/Twiolo%20Dashboard/.env.example)
#### [NEW] [middleware.ts](file:///c:/Teknoverse%20Projects/Twiolo%20Dashboard/middleware.ts)

---

### Phase 2: Security & Session Authentication Layer
- HTTP-only signed session cookie management with `jose` (JWT).
- Environment variable-based auth verification for Admin (`ADMIN_EMAIL`) and Agent (`AGENT_EMAIL`).
- Role-based route protection middleware guarding `/dashboard/*` (Admin only), `/agent/*` (Agent & Admin), and API routes.

#### [NEW] [lib/auth/session.ts](file:///c:/Teknoverse%20Projects/Twiolo%20Dashboard/lib/auth/session.ts)
#### [NEW] [lib/auth/middleware.ts](file:///c:/Teknoverse%20Projects/Twiolo%20Dashboard/lib/auth/middleware.ts)
#### [NEW] [app/api/auth/login/route.ts](file:///c:/Teknoverse%20Projects/Twiolo%20Dashboard/app/api/auth/login/route.ts)
#### [NEW] [app/api/auth/logout/route.ts](file:///c:/Teknoverse%20Projects/Twiolo%20Dashboard/app/api/auth/logout/route.ts)
#### [NEW] [app/api/auth/me/route.ts](file:///c:/Teknoverse%20Projects/Twiolo%20Dashboard/app/api/auth/me/route.ts)

---

### Phase 3: Abstract Modular Data Layer
- Define TypeScript models for `User`, `Lead`, `Call`, `Assignment`, `AuditLog`.
- Implement initial in-memory data store under `lib/data/` designed to be easily replaced by Supabase / PostgreSQL in the future.

#### [NEW] [lib/data/types.ts](file:///c:/Teknoverse%20Projects/Twiolo%20Dashboard/lib/data/types.ts)
#### [NEW] [lib/data/users.ts](file:///c:/Teknoverse%20Projects/Twiolo%20Dashboard/lib/data/users.ts)
#### [NEW] [lib/data/leads.ts](file:///c:/Teknoverse%20Projects/Twiolo%20Dashboard/lib/data/leads.ts)
#### [NEW] [lib/data/calls.ts](file:///c:/Teknoverse%20Projects/Twiolo%20Dashboard/lib/data/calls.ts)
#### [NEW] [lib/data/assignments.ts](file:///c:/Teknoverse%20Projects/Twiolo%20Dashboard/lib/data/assignments.ts)
#### [NEW] [lib/data/audit.ts](file:///c:/Teknoverse%20Projects/Twiolo%20Dashboard/lib/data/audit.ts)

---

### Phase 4: HighLevel (GHL) CRM Integration Service
- Server-side REST API wrapper for GHL Contacts, Notes, and Tasks.
- Private phone lookup helper `getPrivatePhoneForCall(contactId)` strictly used inside server handlers.

#### [NEW] [lib/integrations/ghl/client.ts](file:///c:/Teknoverse%20Projects/Twiolo%20Dashboard/lib/integrations/ghl/client.ts)
#### [NEW] [lib/integrations/ghl/contacts.ts](file:///c:/Teknoverse%20Projects/Twiolo%20Dashboard/lib/integrations/ghl/contacts.ts)

---

### Phase 5: Twilio Voice & Browser WebRTC Integration
- Server-side Access Token generator (`AccessToken` with `VoiceGrant`).
- TwiML webhook generator (`/api/webhooks/twilio/voice`).
- Call status webhook handler (`/api/webhooks/twilio/call-status`).
- Twilio signature verification utility.

#### [NEW] [lib/integrations/twilio/client.ts](file:///c:/Teknoverse%20Projects/Twiolo%20Dashboard/lib/integrations/twilio/client.ts)
#### [NEW] [app/api/twilio/token/route.ts](file:///c:/Teknoverse%20Projects/Twiolo%20Dashboard/app/api/twilio/token/route.ts)
#### [NEW] [app/api/webhooks/twilio/voice/route.ts](file:///c:/Teknoverse%20Projects/Twiolo%20Dashboard/app/api/webhooks/twilio/voice/route.ts)
#### [NEW] [app/api/webhooks/twilio/call-status/route.ts](file:///c:/Teknoverse%20Projects/Twiolo%20Dashboard/app/api/webhooks/twilio/call-status/route.ts)

---

### Phase 6: API Routes (Leads, Calls, Assignments, Agents)
- Secure backend API endpoints verifying agent authentication and lead assignment before performing actions.
- Call locking to prevent duplicate concurrent calls to the same lead.

#### [NEW] [app/api/leads/route.ts](file:///c:/Teknoverse%20Projects/Twiolo%20Dashboard/app/api/leads/route.ts)
#### [NEW] [app/api/leads/[id]/route.ts](file:///c:/Teknoverse%20Projects/Twiolo%20Dashboard/app/api/leads/[id]/route.ts)
#### [NEW] [app/api/calls/start/route.ts](file:///c:/Teknoverse%20Projects/Twiolo%20Dashboard/app/api/calls/start/route.ts)
#### [NEW] [app/api/calls/[id]/end/route.ts](file:///c:/Teknoverse%20Projects/Twiolo%20Dashboard/app/api/calls/[id]/end/route.ts)
#### [NEW] [app/api/calls/[id]/outcome/route.ts](file:///c:/Teknoverse%20Projects/Twiolo%20Dashboard/app/api/calls/[id]/outcome/route.ts)
#### [NEW] [app/api/agents/route.ts](file:///c:/Teknoverse%20Projects/Twiolo%20Dashboard/app/api/agents/route.ts)
#### [NEW] [app/api/assignments/route.ts](file:///c:/Teknoverse%20Projects/Twiolo%20Dashboard/app/api/assignments/route.ts)

---

### Phase 7: Modern Premium UI Architecture
- Clean light-mode SaaS UI system with Tailwind CSS and Lucide icons.
- Pages:
  - `/login`: Premium login page with role detection.
  - `/agent`: Agent dashboard, KPI stats cards, assigned leads table, recent calls.
  - `/agent/leads`: Full assigned lead management interface.
  - `/agent/calls`: Call history view.
  - `/dashboard`: Admin overview analytics, metrics charts, active call status.
  - `/dashboard/leads`: Admin lead assignment & CRM view (zero phone numbers displayed).
  - `/dashboard/agents`: Agent performance management.
  - `/dashboard/calls`: Organization-wide call history log.
  - `/dashboard/settings`: System status & integration credentials configuration check.
- Interactive Calling Panel Modal (`components/calling/CallPanel.tsx`):
  - Integrates Twilio WebRTC Device JS SDK.
  - Displays customer name, city, call duration timer, connection status, mute toggle, hang up button.
  - Post-call outcome selection dialog (Interested, Callback, Not Interested, etc.) + notes textarea.

#### [NEW] [app/login/page.tsx](file:///c:/Teknoverse%20Projects/Twiolo%20Dashboard/app/login/page.tsx)
#### [NEW] [app/agent/page.tsx](file:///c:/Teknoverse%20Projects/Twiolo%20Dashboard/app/agent/page.tsx)
#### [NEW] [app/agent/leads/page.tsx](file:///c:/Teknoverse%20Projects/Twiolo%20Dashboard/app/agent/leads/page.tsx)
#### [NEW] [app/dashboard/page.tsx](file:///c:/Teknoverse%20Projects/Twiolo%20Dashboard/app/dashboard/page.tsx)
#### [NEW] [app/dashboard/leads/page.tsx](file:///c:/Teknoverse%20Projects/Twiolo%20Dashboard/app/dashboard/leads/page.tsx)
#### [NEW] [app/dashboard/agents/page.tsx](file:///c:/Teknoverse%20Projects/Twiolo%20Dashboard/app/dashboard/agents/page.tsx)
#### [NEW] [app/dashboard/settings/page.tsx](file:///c:/Teknoverse%20Projects/Twiolo%20Dashboard/app/dashboard/settings/page.tsx)
#### [NEW] [components/calling/CallPanel.tsx](file:///c:/Teknoverse%20Projects/Twiolo%20Dashboard/components/calling/CallPanel.tsx)

---

### Phase 8: Testing & Documentation
- Comprehensive security test suite (`tests/security.test.ts`) validating:
  - Phone numbers absent from all lead API responses.
  - Agent role boundary enforcement (unauthorized access to admin endpoints rejected).
  - Impersonation prevention (cannot pass arbitrary `agentId`).
  - Webhook signature validation.
  - Duplicate call lock enforcement.
- Complete `README.md` with architecture details, env setup, dev mode explanations, and Supabase migration blueprint.

#### [NEW] [tests/security.test.ts](file:///c:/Teknoverse%20Projects/Twiolo%20Dashboard/tests/security.test.ts)
#### [NEW] [README.md](file:///c:/Teknoverse%20Projects/Twiolo%20Dashboard/README.md)

---

## Verification Plan

### Automated Tests
- Run `npm run test` or standard Node test runner script for API response structure tests verifying no `phone` field exists in payload schemas.
- Execute TypeScript build check: `npm run build` or `npx tsc --noEmit`.

### Manual Verification & Security Audit
1. Boot Next.js server (`npm run dev`).
2. Log in as Agent (`agent@example.com`).
3. Open browser DevTools -> Network Tab & Application Tab.
4. Verify lead data payloads returned from `/api/leads` contain NO `phone` property.
5. Click **Call Customer** on an assigned lead and verify connection modal, timer, mute/hangup controls, and outcome form.
6. Verify `/dashboard/*` access is blocked for Agent role and redirects appropriately.
