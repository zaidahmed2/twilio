# Twiolo Dashboard - HighLevel Call Agent Security Gateway

Twiolo Dashboard is a production-grade, secure Next.js web application built for managing external call agents who need to call customer leads stored inside **HighLevel (GHL)** CRM via **Twilio Programmable Voice** browser WebRTC calling.

The primary security mandate of this application is:
> **CALL AGENTS MUST NEVER SEE OR RECEIVE THE CUSTOMER'S REAL PHONE NUMBER.**

---

## Key Features & Security Model

- **Zero-Phone Exposure Architecture**: Customer phone numbers remain strictly server-side. They are never returned in client API responses, React state, DOM, HTML, `localStorage`, `sessionStorage`, URLs, or network payloads.
- **Twilio WebRTC Browser Calling**: Agents initiate calls directly in the browser by clicking **Call Customer**. The frontend transmits only the `contactId` to the Next.js API server.
- **HighLevel (GHL) CRM Integration**: Server-side GHL API v2 integration retrieves contact details and logs call outcomes, notes, and durations directly to the HighLevel contact timeline.
- **Call Locking & Duplicate Prevention**: Server-side call locking prevents agents from accidentally starting multiple concurrent calls to the same contact.
- **HTTP-Only Session Security**: Signed HTTP-only session cookies handle authentication with role-based middleware guarding `/dashboard/*` (Admin) and `/agent/*` (Agent) routes.
- **Abstract Modular Data Layer**: Built using clean TypeScript interfaces under `lib/data/` so that Supabase or PostgreSQL can be integrated in the future without modifying UI components or API handlers. Note: **Supabase is intentionally NOT included in this initial version.**

---

## Tech Stack

- **Framework**: Next.js 14+ (App Router, Server Actions, API Routes)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS
- **Icons**: Lucide Icons (`lucide-react`)
- **Validation**: Zod
- **Authentication**: Signed HTTP-Only Session Cookies (`jose` JWT)
- **Voice Provider**: Twilio Programmable Voice (`twilio` Node SDK & `@twilio/voice-sdk`)
- **CRM Provider**: HighLevel (GHL) API v2

---

## Project Structure

```
.
├── app/
│   ├── (auth) / login/        # Premium Login Page
│   ├── agent/                 # Call Agent Portal (Leads, Calls, Dashboard)
│   ├── dashboard/             # Admin Control Portal (CRM, Agents, Calls, Settings)
│   └── api/
│       ├── auth/              # Login, Logout, Session endpoints
│       ├── leads/             # Safe lead retrieval (Phone fields omitted)
│       ├── calls/             # Start call, end call, log outcome
│       ├── twilio/token       # Generate short-lived browser Voice Access Tokens
│       └── webhooks/          # Twilio voice & call-status webhooks
├── components/
│   ├── calling/CallPanel.tsx  # Interactive Calling Modal (Timer, Mute, Outcome Form)
│   └── layout/                # Navbar & Sidebar components
├── lib/
│   ├── auth/                  # Session JWT & middleware
│   ├── data/                  # Abstract modular data store (Users, Leads, Calls, Assignments)
│   └── integrations/
│       ├── ghl/               # HighLevel API client & timeline syncing
│       └── twilio/            # Twilio voice token generator & webhook validator
├── tests/
│   └── security.test.ts       # Security & phone-masking audit test suite
├── .env.example               # Environment variables template
└── README.md
```

---

## Installation & Setup

1. **Clone the repository and install dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

   Fill in your temporary credentials and integration credentials in `.env.local`:
   ```env
   APP_URL=http://localhost:3000
   JWT_SECRET=your-secret-key-at-least-32-chars-long

   # Temporary Authentication Credentials
   ADMIN_EMAIL=admin@example.com
   ADMIN_PASSWORD=adminpass

   AGENT_EMAIL=agent@example.com
   AGENT_PASSWORD=agentpass

   # HighLevel (GHL) API Keys
   GHL_API_KEY=your_ghl_location_api_key
   GHL_LOCATION_ID=your_ghl_location_id

   # Twilio Voice Credentials
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_PHONE_NUMBER=+15005550006
   TWILIO_API_KEY=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_API_SECRET=your_twilio_api_secret
   TWILIO_TWIML_APP_SID=APxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_RECORD_CALLS=false
   ```

3. **Run Development Mode**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## How Phone-Number Privacy Works

1. When an agent opens their dashboard, `/api/leads` returns lead records where the `phone` property is **strictly absent**.
2. When the agent clicks **Call Customer**, the frontend issues a `POST /api/calls/start` request containing **only** `{ contactId: "ghl_contact_101" }`.
3. The server validates agent authentication and assignment ownership.
4. The Twilio WebRTC Device in the browser connects to Twilio using a short-lived access token issued by `/api/twilio/token`.
5. Twilio triggers the server webhook `/api/webhooks/twilio/voice` with `contactId`.
6. The server resolves the E.164 phone number from the server-side vault or GHL API privately and returns TwiML `<Response><Dial callerId="...">+61412345678</Dial></Response>`.
7. Twilio dials the customer's phone over PSTN while the agent speaks through the browser WebRTC stream. At no point does the customer's phone number reach the agent's browser.

---

## Running Security Audit Tests

Verify that all phone privacy boundaries, role protections, and call locking mechanisms pass:
```bash
npx tsx tests/security.test.ts
```

---

## Future Supabase Migration Blueprint

To migrate from the temporary in-memory data store to Supabase / PostgreSQL in the future:
1. Replace implementation files in `lib/data/leads.ts`, `lib/data/calls.ts`, `lib/data/users.ts`, and `lib/data/assignments.ts` with Supabase client queries.
2. Maintain the exact same TypeScript return signatures (`SafeLead`, `CallRecord`, `User`, `Assignment`).
3. No changes will be required in any UI components or API handlers.
