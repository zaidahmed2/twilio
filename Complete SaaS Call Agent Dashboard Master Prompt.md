You are a senior full-stack SaaS architect and developer.

Build a complete, secure, production-style web application for managing external call agents who need to call customers/leads stored inside HighLevel (GHL).

The application must act as a secure layer between GHL and external call agents.

The most important requirement is:

**CALL AGENTS MUST NEVER SEE THE CUSTOMER'S REAL PHONE NUMBER.**

Agents must be able to select a customer and click **Call Customer** directly from the web application. The call must happen through the browser using a voice provider such as Twilio. The customer's phone number must remain server-side and must never be exposed to the browser, frontend JavaScript, API response, URL, localStorage, sessionStorage, HTML, React state, logs, or client-side network payloads.

---

# 1. CORE TECHNOLOGY

Use:

- Next.js latest stable version
- TypeScript
- App Router
- React
- Tailwind CSS
- shadcn/ui or another clean professional component system
- Lucide icons
- Node.js server-side APIs
- Zod for validation
- Twilio Programmable Voice / Twilio Voice SDK for browser calling
- HighLevel / GHL API for CRM data
- HTTP-only secure cookies for authentication
- Environment variables for secrets

DO NOT use Supabase in the initial version.

Do NOT install:

- Supabase client
- Supabase Auth
- Supabase database
- Supabase RLS
- Supabase environment variables
- Supabase migrations

The architecture must remain modular so Supabase or another database can be added later without rebuilding the UI.

For the initial prototype, use a simple server-side JavaScript/TypeScript authentication and temporary data layer.

---

# 2. IMPORTANT AUTHENTICATION REQUIREMENT

For the initial version, authentication should be simple.

Do NOT build a complete production database-based user authentication system yet.

Use environment variables for temporary admin and agent credentials.

Example:

ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-this-password

AGENT_EMAIL=agent@example.com
AGENT_PASSWORD=change-this-password

The actual values must only exist in `.env.local`.

Never expose these variables to the browser.

Never prefix private credentials with `NEXT_PUBLIC_`.

Create:

POST /api/auth/login

POST /api/auth/logout

GET /api/auth/me

After successful login, create a secure HTTP-only session cookie.

The cookie should:

- be HTTP-only
- be Secure in production
- use SameSite protection
- have an appropriate expiration
- contain only a signed/session identifier
- never contain the user's password

Do not store authentication data in:

- localStorage
- sessionStorage
- client-side JavaScript variables that persist credentials
- URL query parameters

Use middleware/server-side checks to protect routes.

---

# 3. INITIAL ROLES

Implement two roles initially:

## ADMIN

Admin can:

- access admin dashboard
- view leads
- view call history
- view agents
- view companies
- assign leads
- view analytics
- configure integrations
- view system status
- manage temporary users/settings

## AGENT

Agent can:

- access agent dashboard
- view only leads assigned to them
- see safe customer information
- click Call Customer
- make browser-based calls
- see current call status
- end calls
- enter call outcome
- add call notes
- view their own call history

Agent MUST NOT be able to:

- see customer phone number
- copy customer phone number
- export customer phone numbers
- access GHL directly
- access Twilio credentials
- access API credentials
- view other agents' private information
- access other companies
- access admin pages
- manipulate arbitrary contact IDs
- retrieve private contact information through modified API requests

---

# 4. FUTURE MULTI-TENANT ARCHITECTURE

Although the first version uses simple environment authentication, design the application as a SaaS.

The future structure should support:

Company
→ Company Admin
→ Agents
→ Leads
→ Calls

Possible future roles:

- Super Admin
- Company Admin
- Agent

For now, only ADMIN and AGENT need to be implemented fully.

Keep the data layer abstract.

For example:

/lib/data/users.ts
/lib/data/leads.ts
/lib/data/calls.ts
/lib/data/assignments.ts

Do not tightly couple the UI to the temporary data implementation.

Later these files should be replaceable with:

Supabase
PostgreSQL
Prisma
Drizzle
etc.

without rebuilding the frontend.

---

# 5. HIGHLEVEL / GHL IS THE CRM SOURCE OF TRUTH

HighLevel must remain the main CRM.

The application should retrieve customer/lead information from GHL using server-side API requests.

Never call GHL APIs directly from the browser.

The browser should communicate only with our Next.js backend.

Architecture:

Browser
↓
Next.js API
↓
GHL API

Never:

Browser
↓
GHL API

GHL credentials must remain server-side.

Use environment variables such as:

GHL_API_KEY=
GHL_LOCATION_ID=

Use the current official HighLevel API documentation.

Do not invent undocumented API endpoints.

If an API capability is not supported by the current official GHL API, do not fake it. Build a clean abstraction and clearly isolate that integration.

---

# 6. GHL CONTACT DATA

The backend may retrieve information such as:

- contact ID
- first name
- last name
- full name
- city
- state
- tags
- pipeline
- status
- assigned user
- created date
- other non-sensitive CRM fields

The backend may retrieve the customer's phone number privately.

BUT:

The customer's phone number must NEVER be returned to the agent frontend.

Example safe API response:

{
  "id": "ghl_contact_123",
  "name": "John Smith",
  "city": "Melbourne",
  "state": "VIC",
  "status": "New",
  "assignedAgent": "Agent 01"
}

Never return:

{
  "phone": "+61412345678"
}

Never return masked phone numbers either unless explicitly required.

The safest implementation is to not return the phone field at all.

---

# 7. PHONE PRIVACY IS CRITICAL

Implement a strict security boundary.

Create a server-only function such as:

getPrivatePhoneForCall(contactId)

This function can:

1. authenticate the current user
2. verify their role
3. verify the lead belongs to the agent/company
4. retrieve the GHL contact
5. retrieve the phone number
6. normalize it to E.164 format
7. return it ONLY to server-side call logic

The function must never be callable from client-side code.

Do NOT create:

GET /api/contacts/:id/phone

Do NOT create any endpoint that returns the phone number.

Do NOT put the phone number into:

- API JSON responses
- React props
- React state
- browser memory
- localStorage
- sessionStorage
- URL
- query string
- page HTML
- client-side logs
- analytics events
- error messages
- console logs

---

# 8. CALLING SYSTEM

Use Twilio Programmable Voice.

The agent should be able to call directly from the browser.

The flow should be:

Agent logs in
↓
Agent opens Leads
↓
Agent sees customer
↓
Agent clicks "Call Customer"
↓
Frontend sends only contactId to backend
↓
Backend authenticates agent
↓
Backend verifies assignment
↓
Backend retrieves private GHL phone
↓
Backend starts Twilio call flow
↓
Customer receives call
↓
Agent speaks through browser/headset
↓
Twilio sends call events to backend
↓
Backend records call information
↓
Backend optionally syncs call activity to GHL

Frontend request:

POST /api/calls/start

Body:

{
  "contactId": "abc123"
}

The frontend must NOT send:

{
  "phone": "+614..."
}

The frontend should only send the contact ID.

---

# 9. TWILIO SECURITY

Use environment variables:

TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
TWILIO_API_KEY=
TWILIO_API_SECRET=
TWILIO_TWIML_APP_SID=

Never expose Twilio Auth Token to the frontend.

Never expose:

TWILIO_AUTH_TOKEN

to client-side code.

If the Twilio Voice SDK requires browser credentials, generate short-lived server-side access tokens.

Create a server endpoint such as:

POST /api/twilio/token

The endpoint must authenticate the logged-in user first.

Generate a limited Twilio access token server-side.

Return only the temporary token needed by the browser.

Never return Twilio account credentials.

---

# 10. BROWSER CALL UI

Create a professional browser calling interface.

When an agent clicks:

Call Customer

open a call panel/modal.

Show:

Customer Name
Customer Location
Call Status
Call Duration
Mute
End Call

Example:

John Smith
Melbourne, VIC

Connecting...

00:14

[ Mute ] [ End Call ]

Do NOT show:

Phone number
Masked phone number
Dial number
Copy number button

The agent should never need to know the number.

Use browser microphone permissions correctly.

Handle:

- connecting
- ringing
- answered
- in progress
- completed
- busy
- failed
- no answer
- canceled

---

# 11. PREVENT DUPLICATE CALLS

Implement call locking.

An agent must not be able to accidentally start multiple calls to the same contact by rapidly clicking the button.

When a call starts:

disable the Call Customer button.

Use server-side validation as well.

Do not rely only on frontend button disabling.

The backend must prevent duplicate active calls.

---

# 12. CALL STATUS WEBHOOKS

Create Twilio webhook endpoints.

Example:

POST /api/webhooks/twilio/call-status

POST /api/webhooks/twilio/recording

Handle statuses such as:

initiated
ringing
answered
completed
busy
failed
no-answer
canceled

Verify Twilio webhook signatures.

Do not trust arbitrary webhook requests.

Store/update:

- call ID
- contact ID
- agent ID
- start time
- answer time
- end time
- duration
- status
- recording status
- outcome
- notes

Never store/display the customer's phone number to the agent.

If the phone number must be stored internally for technical purposes, keep it strictly server-side and never expose it through agent APIs.

---

# 13. CALL RECORDING

Build recording support in a configurable way.

Environment variable:

TWILIO_RECORD_CALLS=false

If enabled:

- record calls
- process recording webhook
- securely store recording reference
- show recording to authorized users only

Never expose raw recording URLs publicly.

Implement authorization before accessing recordings.

Also include a clear configuration note that call recording laws and consent requirements differ by jurisdiction, especially for Australian calls.

Do not hard-code a legal claim.

---

# 14. GHL CALL LOGGING

After a call finishes, synchronize relevant call activity back into HighLevel where supported by the current official API/integration capabilities.

Possible information:

- contact ID
- call direction
- call status
- duration
- agent
- call outcome
- notes
- recording reference where appropriate

The GHL contact timeline should remain useful for the business.

Create an integration abstraction such as:

/lib/integrations/ghl/

Possible functions:

getContact()
getContacts()
getContactPhone()
logCall()
addNote()
updateContact()
addTag()

Only implement functions supported by the current GHL API.

Do not invent API endpoints.

---

# 15. CALL OUTCOMES

After the call ends, show an outcome form.

Options:

- Interested
- Not Interested
- Callback Requested
- Qualified
- Not Eligible
- No Answer
- Wrong Number
- Other

Also provide:

Notes textarea

Example:

Outcome:
Interested

Notes:
Customer requested a callback tomorrow afternoon.

Save button:

Save Call Outcome

When saved:

1. save internally
2. associate it with the call
3. associate it with the agent
4. associate it with the GHL contact
5. sync to GHL where supported

---

# 16. LEADS DASHBOARD

Create a clean SaaS dashboard.

Agent page:

/agent

Sections:

- Today's Calls
- Connected Calls
- Interested Leads
- Pending Leads
- Recent Calls

Create:

/agent/leads

Lead table columns:

Customer
Location
Status
Assigned
Last Contact
Action

Action:

Call Customer

Never show phone.

Add search:

Search customer...

Filters:

- New
- Contacted
- Interested
- Callback
- Not Interested
- No Answer

Keep the UI fast and simple.

---

# 17. ADMIN DASHBOARD

Create:

/dashboard

Show analytics cards:

Total Leads
Calls Today
Connected Calls
Interested Leads
Average Call Duration
Active Agents

Charts:

Calls Over Time
Call Outcomes
Agent Performance

Use clean modern charts.

Do not over-design the dashboard.

Avoid:

- excessive glassmorphism
- unnecessary gradients
- giant cards
- fake AI-looking interfaces
- excessive animations

Use a premium SaaS visual style.

---

# 18. ADMIN LEADS PAGE

Create:

/dashboard/leads

Admin can see:

Customer
Location
Status
Assigned Agent
Last Call
Call Outcome

Admin still should not need to see the customer's phone number unless a separate explicitly authorized admin feature is later added.

Default behavior:

DO NOT DISPLAY PHONE NUMBERS TO ANY USER.

---

# 19. AGENTS PAGE

Create:

/dashboard/agents

Show:

Agent Name
Email
Status
Assigned Leads
Calls Today
Connected Calls
Interested Leads

Allow admin to:

- create temporary agent
- disable agent
- assign leads
- view agent activity

For the initial version, since authentication is environment-based, do not pretend this is a complete persistent user management system.

Clearly separate temporary prototype authentication from the future database-based system.

---

# 20. LEAD ASSIGNMENT

Create an assignment system abstraction.

Example:

/lib/data/assignments.ts

Support:

assign lead to agent
unassign lead
get assigned leads
verify lead ownership

The backend MUST verify assignment before starting a call.

For example:

Agent A cannot simply modify:

{
  "contactId": "Agent B's lead"
}

and call it.

The backend must reject unauthorized access.

---

# 21. MULTI-TENANT SECURITY

Design every data access around:

companyId
agentId
contactId

Even if only one company exists initially, structure the code so future companies can be isolated.

Never trust:

companyId
agentId
role

from the frontend request.

Derive them from the authenticated session/server-side data.

Example:

BAD:

POST /api/calls/start

{
  "contactId": "...",
  "agentId": "admin",
  "companyId": "company2"
}

GOOD:

POST /api/calls/start

{
  "contactId": "..."
}

Server determines the current agent and company from the authenticated session.

---

# 22. SECURITY MIDDLEWARE

Protect:

/dashboard/*
/agent/*
/api/leads/*
/api/calls/*
/api/agents/*
/api/assignments/*

Public:

/login

Webhook endpoints should use their own signature verification.

Do not allow an unauthenticated user to access internal APIs.

---

# 23. API STRUCTURE

Create clean API routes.

Authentication:

POST /api/auth/login
POST /api/auth/logout
GET /api/auth/me

Leads:

GET /api/leads
GET /api/leads/[id]

Calls:

POST /api/calls/start
GET /api/calls
GET /api/calls/[id]
POST /api/calls/[id]/end
POST /api/calls/[id]/outcome

Agents:

GET /api/agents
POST /api/agents

Assignments:

GET /api/assignments
POST /api/assignments
DELETE /api/assignments/[id]

Twilio:

POST /api/twilio/token

Webhooks:

POST /api/webhooks/twilio/call-status
POST /api/webhooks/twilio/recording
POST /api/webhooks/ghl

Do not create any endpoint whose purpose is to expose a customer's phone number.

---

# 24. ERROR HANDLING

Never expose sensitive technical information to the user.

BAD:

"GHL API key missing: sk_xxxxxxxxx"

BAD:

"Failed calling +61412345678"

GOOD:

"Unable to start the call. Please try again."

Server logs may contain technical debugging information only when appropriate, but never log sensitive credentials.

Avoid logging customer phone numbers.

---

# 25. RATE LIMITING

Add basic server-side rate limiting for:

Login
Call initiation
Token generation
Sensitive APIs

At minimum prevent:

- login brute force
- rapid call spam
- repeated token requests
- API abuse

---

# 26. AUDIT LOGGING

Create a simple audit abstraction.

Track events such as:

LOGIN
LOGOUT
CALL_STARTED
CALL_ENDED
CALL_OUTCOME_UPDATED
LEAD_ASSIGNED
LEAD_UNASSIGNED
ADMIN_ACTION
UNAUTHORIZED_ACCESS_ATTEMPT

Do not store unnecessary sensitive data in audit logs.

---

# 27. DATA LAYER

Because Supabase is intentionally NOT being used initially, create a temporary development data layer.

For example:

/lib/data/users.ts
/lib/data/leads.ts
/lib/data/calls.ts
/lib/data/assignments.ts
/lib/data/audit.ts

Use in-memory data or local development data.

Do not create a fake complicated database.

The interfaces should look like:

getUserByEmail()
getLeadById()
getLeadsForAgent()
getCallsForAgent()
createCall()
updateCall()
createAssignment()
getAssignmentsForAgent()

Later these implementations can be replaced with Supabase/PostgreSQL without changing the frontend.

---

# 28. ENVIRONMENT VARIABLES

Create `.env.example`.

Include:

APP_URL=http://localhost:3000

ADMIN_EMAIL=
ADMIN_PASSWORD=

AGENT_EMAIL=
AGENT_PASSWORD=

GHL_API_KEY=
GHL_LOCATION_ID=

TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
TWILIO_API_KEY=
TWILIO_API_SECRET=
TWILIO_TWIML_APP_SID=

TWILIO_RECORD_CALLS=false

Do NOT include any Supabase environment variables.

Do NOT include any NEXT_PUBLIC_ variables for secrets.

---

# 29. LOGIN PAGE

Create a premium login page.

Brand-neutral SaaS style.

Layout:

Left:
Product branding / short description

Right:
Login form

Fields:

Email
Password

Button:

Sign In

Show proper validation.

Do not show which credentials are configured.

Do not leak authentication implementation details.

---

# 30. AGENT UI DESIGN

Agent UI should be extremely simple because agents will use it all day.

Sidebar:

Dashboard
Leads
Calls
Profile

Top bar:

Agent name
Online status
Logout

Main area:

Today's performance
Assigned leads
Recent calls

Lead cards/table should have one obvious action:

Call Customer

Use real icons, not emojis.

---

# 31. ADMIN UI DESIGN

Admin sidebar:

Dashboard
Leads
Agents
Companies
Calls
Settings

Top header:

Search
Notifications
Admin profile

Dashboard should feel like a real SaaS product.

Use:

- white/light background
- subtle borders
- good spacing
- modern typography
- professional status badges
- clean tables
- responsive layout

Avoid dark UI unless necessary.

---

# 32. RESPONSIVE DESIGN

Must work on:

Desktop
Laptop
Tablet
Mobile

Agent calling is primarily desktop/laptop focused, but the UI should remain responsive.

Tables should become mobile-friendly cards or horizontally scrollable containers.

---

# 33. ACCESSIBILITY

Implement:

- keyboard navigation
- visible focus states
- proper button labels
- semantic HTML
- accessible modals
- accessible form labels
- sufficient contrast

Call controls must be easy to understand.

---

# 34. LOADING STATES

Every API operation must have proper loading states.

Examples:

Loading leads...

Starting call...

Connecting...

Ending call...

Saving outcome...

Do not freeze the UI.

---

# 35. EMPTY STATES

Create useful empty states.

Example:

No leads assigned

"No leads are currently assigned to you."

No calls:

"No calls have been made yet."

Do not use fake data after the real integration is configured unless explicitly in development mode.

---

# 36. GHL INTEGRATION SERVICE

Create a clean GHL service.

Example:

/lib/integrations/ghl/client.ts

Use server-side fetch.

Centralize:

authorization
base URL
headers
error handling
API version
timeouts

Do not scatter GHL API logic throughout React components.

Frontend should call our own APIs.

---

# 37. TWILIO INTEGRATION SERVICE

Create:

/lib/integrations/twilio/

Possible modules:

client.ts
tokens.ts
calls.ts
webhooks.ts

Keep Twilio credentials server-side.

Create a clean abstraction for:

generateVoiceToken()
startCall()
getCallStatus()
validateWebhook()
processCallWebhook()

---

# 38. TWILIO CALL ARCHITECTURE

Use a proper browser voice architecture.

The agent browser uses Twilio Voice SDK.

The backend generates temporary access credentials.

The server-side call logic resolves the customer's phone number.

The browser never receives the customer's actual phone number.

The call should conceptually work like:

Agent Browser
↓
Twilio Voice
↓
Customer Phone

The customer's number is handled server-side.

Do not build a traditional visible phone dialer that requires agents to type customer numbers.

---

# 39. CALL FLOW

Implement this exact logical flow:

1. Agent logs in.
2. Agent opens assigned leads.
3. Agent sees customer name and safe CRM information.
4. Agent clicks Call Customer.
5. Frontend sends contactId to backend.
6. Backend authenticates agent.
7. Backend checks assignment.
8. Backend retrieves GHL contact.
9. Backend privately retrieves phone.
10. Backend validates phone.
11. Backend initiates/coordinates Twilio call.
12. Browser connects using Twilio Voice SDK.
13. Customer receives call.
14. Call status updates in UI.
15. Agent ends call.
16. Twilio sends webhook.
17. Backend updates internal call record.
18. Agent selects outcome.
19. Agent enters notes.
20. Backend saves outcome.
21. Backend syncs activity to GHL where supported.

---

# 40. NEVER FAKE THE INTEGRATIONS

Do not create buttons that pretend to call.

Do not show fake:

"Connected"

unless Twilio actually reports a connected call.

Do not fake GHL data once integration is enabled.

If environment variables are missing during development, show a clear developer-only integration status.

Example:

GHL Integration
Not configured

Twilio Integration
Not configured

Do not expose credentials.

---

# 41. DEVELOPMENT MODE

Create a safe development mode.

If GHL/Twilio credentials are not configured:

- application can still boot
- login works
- UI can be tested
- mock lead data can be used
- calling should clearly show "Twilio not configured"
- do not pretend a real call occurred

When integrations are configured, automatically use real services.

---

# 42. TESTING

Create tests for critical security boundaries.

At minimum test:

1. Agent cannot access admin dashboard.
2. Agent cannot access another agent's lead.
3. Agent cannot retrieve phone number.
4. Phone number never appears in API response.
5. Phone number never appears in frontend payload.
6. Unauthenticated user cannot access protected APIs.
7. Invalid contact ID is rejected.
8. Agent cannot modify agentId in request to impersonate another agent.
9. Duplicate calls are prevented.
10. Twilio webhook signatures are validated.
11. GHL credentials never appear client-side.
12. Twilio Auth Token never appears client-side.

---

# 43. PHONE LEAKAGE TEST

This is extremely important.

After implementation, inspect:

Network requests
Network responses
React state
Rendered HTML
Browser localStorage
Browser sessionStorage
URL parameters
Console logs

Confirm that no customer phone number is exposed to the agent browser.

If a phone number appears anywhere client-side, fix the architecture.

---

# 44. CODE QUALITY

Use:

- TypeScript strict mode
- reusable components
- clear folder structure
- server/client separation
- reusable API utilities
- proper error handling
- environment validation
- Zod schemas
- comments only where useful

Avoid:

- giant components
- duplicated code
- hardcoded credentials
- unnecessary dependencies
- insecure shortcuts
- fake APIs
- fake integrations

---

# 45. RECOMMENDED PROJECT STRUCTURE

Use a structure similar to:

app/
  login/
    page.tsx

  agent/
    page.tsx
    leads/
      page.tsx
    calls/
      page.tsx

  dashboard/
    page.tsx
    leads/
      page.tsx
    agents/
      page.tsx
    companies/
      page.tsx
    calls/
      page.tsx
    settings/
      page.tsx

  api/
    auth/
      login/
      logout/
      me/

    leads/
      route.ts
      [id]/

    calls/
      route.ts
      start/
      [id]/
        route.ts
        end/
        outcome/

    agents/
      route.ts

    assignments/
      route.ts
      [id]/

    twilio/
      token/

    webhooks/
      twilio/
        call-status/
        recording/
      ghl/

components/
  ui/
  layout/
  dashboard/
  agent/
  calling/
  leads/
  calls/

lib/
  auth/
  data/
  integrations/
    ghl/
    twilio/
  security/
  validation/
  utils/

middleware.ts

.env.example

README.md

---

# 46. UI COMPONENTS

Create reusable components:

Sidebar
Topbar
StatsCard
LeadTable
LeadCard
CallButton
CallPanel
CallStatus
CallTimer
OutcomeModal
AgentTable
CallHistoryTable
StatusBadge
SearchInput
FilterDropdown
EmptyState
LoadingState
ErrorState
ConfirmDialog

---

# 47. CALL PANEL UX

When calling:

Display:

John Smith
Melbourne, VIC

Calling...

Then:

Ringing...

Then:

Connected
00:32

Buttons:

Mute
End Call

After ending:

Call Completed

Show:

Outcome dropdown
Notes textarea

Save Outcome

This should feel like a professional call-center application.

---

# 48. ADMIN ANALYTICS

Calculate:

Calls Today
Completed Calls
Connected Rate
Interested Rate
Average Call Duration
Calls Per Agent

Example:

Calls Today: 148
Connected: 91
Interested: 27
Avg Duration: 04:18

Do not hardcode these once real data exists.

Use the internal call data.

---

# 49. SETTINGS PAGE

Create:

/dashboard/settings

Sections:

GHL Integration
Twilio Integration
Call Recording
Application Settings

Show integration status without exposing secrets.

Example:

HighLevel
Connected

Twilio
Connected

Recording
Disabled

Do not display API keys.

---

# 50. README

Create a detailed README explaining:

1. What the project does
2. Tech stack
3. Installation
4. Environment variables
5. Development mode
6. GHL setup
7. Twilio setup
8. Browser calling setup
9. Webhook setup
10. Authentication
11. Security model
12. How phone-number privacy works
13. How to deploy
14. Future Supabase integration

Clearly state:

Supabase is intentionally NOT part of the initial version.

---

# 51. DEPLOYMENT

Make the project compatible with a modern Node/Next.js deployment such as Vercel.

Do not depend on filesystem persistence for production.

The temporary in-memory data layer is only for initial development/prototype.

Clearly document that persistent database storage should be added before production multi-user deployment.

---

# 52. FUTURE DATABASE MIGRATION

Design interfaces so that later we can replace:

Temporary users
Temporary leads
Temporary calls
Temporary assignments

with:

Supabase/PostgreSQL

without rewriting:

- dashboard UI
- agent UI
- calling UI
- API contracts
- GHL integration
- Twilio integration

The future database should be an implementation detail.

---

# 53. IMPORTANT PRODUCTION WARNING

The initial environment-variable login is a prototype authentication mechanism.

Do NOT describe it as a complete production multi-user authentication system.

The application should clearly be structured for a future proper authentication/database layer.

Do not add unnecessary complexity now.

---

# 54. FINAL ACCEPTANCE CRITERIA

The implementation is considered successful only if all of the following are true:

AUTH:

- Login works.
- Logout works.
- HTTP-only session cookie works.
- Admin and Agent roles work.
- Protected routes work.
- Credentials never reach browser JavaScript.

GHL:

- GHL credentials are server-side.
- Leads can be retrieved server-side.
- Contact IDs work.
- Contact phone numbers remain server-side.

CALLING:

- Agent can click Call Customer.
- Browser calling architecture is implemented using Twilio Voice.
- Agent does not need to know the customer's phone number.
- Customer phone number is never returned to frontend.
- Call status updates correctly.
- Call can be ended.
- Call outcome can be saved.

SECURITY:

- Agent cannot access admin routes.
- Agent cannot access other agents' leads.
- Agent cannot manipulate agent/company IDs to bypass authorization.
- Phone number cannot be fetched through a hidden endpoint.
- No phone number in browser network response.
- No phone number in React state.
- No phone number in localStorage.
- No phone number in sessionStorage.
- No phone number in URLs.
- No phone number in frontend logs.
- Twilio secrets remain server-side.
- GHL secrets remain server-side.
- Webhooks are verified.
- Duplicate call attempts are prevented.

UI:

- Premium SaaS appearance.
- Responsive.
- Clean light theme.
- Professional typography.
- Real icons.
- Good loading states.
- Good empty states.
- Good error states.
- Agent workflow is simple.
- Calling UI is obvious.

ARCHITECTURE:

- No Supabase in initial setup.
- Temporary auth works through server-side JavaScript/TypeScript.
- Temporary data layer is modular.
- Future Supabase/database migration can happen without rebuilding the UI.
- GHL remains CRM source of truth.
- Twilio handles browser voice calling.
- Next.js remains the secure backend/API layer.

---

# 55. IMPLEMENTATION PROCESS

Do not dump a huge amount of code without structure.

Build the application in phases.

PHASE 1:
Project setup
Next.js
TypeScript
Tailwind
UI system
folder architecture

PHASE 2:
Temporary authentication
login
logout
HTTP-only session
role protection
middleware

PHASE 3:
Dashboard UI
admin dashboard
agent dashboard
leads
calls
agents

PHASE 4:
Temporary data layer
users
leads
assignments
calls
outcomes

PHASE 5:
GHL integration
server-side API
contact retrieval
safe lead responses
private phone resolution

PHASE 6:
Twilio integration
server-side credentials
browser token
Voice SDK
call flow

PHASE 7:
Call webhooks
statuses
duration
recordings

PHASE 8:
GHL call synchronization

PHASE 9:
Security hardening
authorization
rate limits
phone leakage testing
webhook validation
duplicate call protection

PHASE 10:
Testing
README
deployment preparation

At the end of every phase, verify that the application still runs.

---

# 56. IMPORTANT DEVELOPMENT RULE

Before implementing any GHL or Twilio API functionality, consult the current official documentation.

Do not invent API endpoints.

Do not assume a GHL feature exists.

Do not claim that GHL's native LC Phone can be remotely controlled from this custom dashboard unless the current official API documentation explicitly supports the required behavior.

If HighLevel's native phone system cannot provide the required secure external-dashboard calling flow, use Twilio for the voice layer.

The architecture must prioritize actual working integrations over assumptions.

---

# 57. FINAL GOAL

The finished application should feel like a real SaaS call-center platform.

The business owner manages leads through GHL.

External call agents log into this separate application.

Agents see:

Customer Name
Location
Lead Status

They click:

Call Customer

The customer receives the call.

The agent talks through their browser/headset.

The agent never sees the customer's real phone number.

The business keeps CRM data inside GHL.

Twilio handles the actual browser-to-phone voice connection.

Next.js securely controls authentication, authorization, CRM access, phone resolution, call initiation, webhooks, and business logic.

The first version must NOT use Supabase.

Use simple server-side JavaScript/TypeScript authentication and a temporary modular data layer now.

Keep everything clean and ready for a future production database/authentication system.

Start by creating the project architecture and then implement the phases sequentially.

Do not skip security because this application handles private customer contact information.