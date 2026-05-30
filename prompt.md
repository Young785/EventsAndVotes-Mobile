# Events & Votes — Mobile Portals Guide

This document describes the **three mobile-facing experiences** in the Events & Votes (EAV) platform, how they are **gated by role and permission**, and the routes/APIs each portal uses.

Use this alongside [MOBILE_API.md](./MOBILE_API.md) for endpoint-level reference.

---

## Platform overview

EAV is a responsive web app (React) backed by a Laravel API. On mobile it behaves like a **Progressive Web App experience**: same URLs work in Safari/Chrome, can be saved to the home screen, and gate staff can use the **device camera** for QR scanning.

| Portal | Who | Primary mobile use |
|--------|-----|-------------------|
| **User** | Ticket buyers & voters | Browse events, buy tickets, show wallet pass at gate |
| **Vendor** | Event organizers (`admin_event`, `admin_both`, `superadmin`) | Create events, manage tiers, assign scanners, view analytics |
| **Scanner** | Gate staff (token link, no full account required) | Scan QR codes at entry/exit/checkpoint |

Production web app: `https://eav.bizinvestify.com`  
Production API: `https://eavapi.bizinvestify.com/api`

---

## Roles & permission model

Access is controlled at two layers:

1. **Account role** (`user.role.name`) — Spatie roles on the Laravel `User` model  
2. **Route guards** — React `ProtectedRoute` + Laravel middleware on API routes  
3. **Scanner permissions** — JSON array on `ScanUser` records (separate from platform login)

### Account roles

| Role | User portal | Vendor portal | Scanner portal |
|------|-------------|---------------|----------------|
| `user` | Yes | No | No (unless given scan link) |
| `admin_vote` | Yes | Elections/votes admin only | No |
| `admin_event` | Yes | Events vendor tools | No (creates scan users) |
| `admin_both` | Yes | Events + elections | No |
| `admin` | Yes | Broad admin (legacy) | No |
| `superadmin` | Yes | Full platform | No |

### Spatie permissions (examples)

| Permission | Typical holder | Meaning |
|------------|----------------|---------|
| `user.auth-login` | All roles | Can authenticate |
| `user.event-participate` | `user`, `admin_event`, `admin_both` | Buy tickets, view own passes |
| `user.vote-participate` | `user`, `admin_vote`, `admin_both` | Vote in contests |
| `user.profile-view` / `user.profile-edit` | All authenticated users | Profile & avatar |
| `user.referral-view` / `user.referral-manage` | Most roles | Referral dashboard |
| `management.*`, `users.*`, `activity_log.*` | `superadmin` only | Platform management |

Email verification is enforced on protected user routes unless the path is `/verification`.

### Scanner user permissions (gate staff)

Scan users are **not** platform accounts. They are invited per **scan location** with a token URL.

| Permission | `scanner` role | `supervisor` role |
|------------|----------------|-------------------|
| `scan_tickets` | Yes | Yes |
| `view_reports` | Optional | Yes |
| `manage_users` | No | Yes |
| `override_scans` | No | Yes |

Scan user fields: `role` (`scanner` | `supervisor`), `permissions[]`, `access_token`, `token_expires_at`, `is_active`.

---

## 1. User portal (mobile)

**Audience:** Ticket holders and voters with a normal account (`user` or any role using the public app).

### What users do on mobile

- Discover and browse **public events** (`/events`)
- View event details and **purchase tickets** (`/events/:id/tickets`)
- Complete **Paystack** payment in browser/WebView → return via `/payment/callback`
- Open **My Tickets** — wallet-style digital passes (`/my-tickets`)
- **Show QR at gate** (in-app modal) or **download HTML pass**
- Participate in **votes/contests** (`/votes`, cart, checkout)
- Manage **profile**, referrals, earnings

### Key routes (web / mobile browser)

| Screen | Route | Auth |
|--------|-------|------|
| Events list | `/events` | Public |
| Event detail | `/events/:id` | Public |
| Buy tickets | `/events/:id/tickets` | Public (login recommended) |
| My Tickets | `/my-tickets` | Login required |
| Payment return | `/payment/callback?type=tickets&reference=…` | Public |
| Dashboard | `/dashboard` | Login + verified email |
| Profile | `/profile` | Login |

### Ticket wallet (2026 pass design)

Downloaded tickets and in-app cards use the **Wallet Premium** layout when the event template is set to a `wallet` layout:

- Landscape pass (~900×420, stacks on mobile)
- Full-bleed event poster + ambient blurred background
- **VALID {TIER}** live validation pill (green pulse when active)
- Compact QR (~120px) + monospace entry code (`TKT-XXXXXXXX`)
- Serial number, issue time, “Powered by Events & Votes”

### User API (authenticated)

```http
Authorization: Bearer {token}
```

| Action | Method | Path |
|--------|--------|------|
| List my tickets | GET | `/tickets/my-tickets` |
| Download pass (HTML) | GET | `/tickets/{id}/download` |
| QR image (local, no external API) | GET | `/tickets/{uuid}/qr-image?size=220` |
| Ticket details | GET | `/tickets/{uuid}/details` |

QR codes encode a **signed scan payload** (base64 JSON with `uuid` + `hash`) compatible with gate scanners.

### Mobile UX notes

- My Tickets is **mobile-first**: cards stack vertically; QR opens as a bottom sheet.
- Prefer **same email at purchase and login** so tickets auto-link to the account.
- After template changes on an event, users must **re-download** passes to see the new design.

---

## 2. Vendor portal (event organizer)

**Audience:** Event vendors / organizers — roles `admin_event`, `admin_both`, or `superadmin`.

In EAV, “vendor” means the **event organizer** who creates events, sets ticket tiers, chooses ticket design templates, and operates check-in.

### What vendors do on mobile

- View and manage **their events** (superadmin sees all)
- Create/edit events, upload poster, set **ticket template** (Wallet Premium, Neon, etc.)
- Configure **ticket tiers** (VIP, General, capacity, pricing)
- **Publish** events and monitor sales
- Open **event analytics** (`/admin/events/:id/analytics`)
- Manage **scan locations** and invite gate staff
- Optional: **withdrawals** for event revenue

### Access conditions

| Check | Rule |
|-------|------|
| React route | `/admin/*` requires role in `admin`, `superadmin`, `admin_vote`, `admin_event`, `admin_both` |
| Sidebar “Events” menu | `superadmin` **or** `admin_event` **or** `admin_both` |
| API event management | `adminIndex` / CRUD: same roles; non–superadmin limited to `organizer_id = auth user` |
| Per-event actions | `userCanManageEvent()` — superadmin or event `organizer_id` |

### Key vendor routes

| Screen | Route | Role |
|--------|-------|------|
| Admin dashboard | `/admin/dashboard` | Admin roles |
| All events | `/admin/events` | Event-capable roles |
| Create event | `/admin/events/create` | Event-capable roles |
| Edit event | `/admin/events/:id/edit` | Organizer or superadmin |
| Ticket tiers | `/admin/events/:id/tickets` | Organizer or superadmin |
| Scan locations | `/admin/events/:id/scan-locations` | Organizer or superadmin |
| Gate scanner (staff UI) | `/admin/events/:id/scanner` | Organizer or superadmin |
| Analytics | `/admin/events/:id/analytics` | Organizer or superadmin |

### Vendor API (prefix `/api/admin/…`, Bearer token)

| Action | Method | Path |
|--------|--------|------|
| List manageable events | GET | `/admin/events` |
| Create event | POST | `/admin/events` |
| Update event | PUT | `/admin/events/{id}` |
| Publish | POST | `/admin/events/{id}/publish` |
| Analytics | GET | `/admin/events/{id}/analytics` |
| Ticket templates | GET | `/admin/events/ticket-templates` |
| Scan locations CRUD | * | `/admin/scan-locations/…` |
| Create scan user | POST | `/admin/scan-locations/{id}/users` |
| Regenerate scan token | POST | `/admin/scan-locations/{locationId}/users/{userId}/regenerate-token` |

### Inviting gate staff (vendor workflow)

1. Vendor creates a **scan location** (Main Gate, VIP Entry, Exit, Checkpoint).
2. Vendor adds a **scan user** (scanner or supervisor) with email.
3. System generates `access_token` and sends invitation with URL:  
   **`https://{frontend}/scan/{access_token}`**
4. Staff opens link on phone → **Scanner portal** (no EAV login).

---

## 3. Scanner portal (gate staff)

**Audience:** Temporary gate staff authenticated by **scan token**, not by platform password.

### What scanners do on mobile

- Open invitation link `/scan/{token}`
- App validates token with API
- See assigned **event**, **location name**, and role
- Tap **Scan** → use **device camera** (QRScanner component)
- Submit scan → API verifies ticket for **that event only**
- View basic session stats (today’s scans, last scan time)

### Access conditions

| Check | Rule |
|-------|------|
| Token | Must match active `ScanUser.access_token` |
| Expiry | `token_expires_at` must be in the future (if set) |
| Location | `ScanLocation.is_active = true` |
| Event | Event `status = active` |
| Permission | `scan_tickets` in `ScanUser.permissions` (implicit for active users) |

Invalid/expired token → “Access Denied” screen.

### Scanner routes & API

| Action | Method | Path | Auth |
|--------|--------|------|------|
| Validate token / load session | GET | `/api/scan/validate/{token}` | Public (token in URL) |
| Scan ticket | POST | `/api/scan/ticket` | Body: `scan_token`, `qr_data`, `scan_type`, `location` |

**Scan request body:**

```json
{
  "qr_data": "<payload from QR or ticket UUID>",
  "scan_token": "<access_token from URL>",
  "scan_type": "entry",
  "location": "Main Entrance"
}
```

**Success:** ticket marked used (entry), scan logged.  
**Denied:** wrong event, already used, invalid ticket, inactive event.

### Organizer scanner (alternative)

Logged-in vendors can also use **`/admin/events/:id/scanner`** with their Bearer token and `POST /api/tickets/scan` (staff API). This is for organizers testing at the gate without a separate scan user.

---

## Permission flow diagram

```mermaid
flowchart TB
    subgraph Public
        A[Browse /events]
        B[Purchase tickets]
    end

    subgraph UserPortal["User portal — role: user+"]
        C[Login + verify email]
        D[/my-tickets wallet pass]
        E[QR modal / download HTML]
    end

    subgraph VendorPortal["Vendor portal — admin_event / admin_both / superadmin"]
        F[/admin/events]
        G[Scan locations + staff]
        H[Analytics + withdrawals]
    end

    subgraph ScannerPortal["Scanner portal — scan token only"]
        I[/scan/token]
        J[Camera QR scan]
        K[POST /scan/ticket]
    end

    A --> B
    B --> C
    C --> D --> E
    F --> G
    G -->|invitation link| I
    I --> J --> K
    E -->|QR at gate| K
```

---

## Authentication quick reference

### Login (all portals except scanner)

```http
POST /api/auth/login
Content-Type: application/json

{ "email": "...", "password": "..." }
```

Store `token` and send on protected requests:

```http
Authorization: Bearer {token}
Accept: application/json
```

### Scanner (token only)

No login. The `{token}` in `/scan/{token}` **is** the credential for scan APIs.

---

## Error handling on mobile

| HTTP | Portal | Action |
|------|--------|--------|
| 401 | User / Vendor | Clear token → `/login` |
| 401 | Scanner | Show “Invalid or expired scan URL” |
| 403 | User | Email verification → `/verification` |
| 403 | Vendor | User lacks role or is not event organizer |
| 404 | Scanner | Ticket not found at gate |
| 400 | Scanner | Ticket wrong event / already used |

---

## Recommended mobile implementation

### User app / WebView

1. Cache `GET /api/public/settings` on launch.
2. Persist Bearer token securely (Keychain / EncryptedSharedPreferences).
3. Deep-link payment return to `/payment/callback`.
4. Open `/my-tickets` after successful purchase.
5. Fetch QR via `GET /tickets/{uuid}/qr-image` with auth (never use third-party QR APIs).

### Vendor app

1. After login, read `user.role.name` to show/hide Events vs Elections menus.
2. Use multipart uploads for event poster + ticket tier forms.
3. Copy scan invitation URL from scan-user management for SMS/WhatsApp to staff.

### Scanner mini-app

1. Open only `/scan/{token}` — bookmark or home-screen shortcut per event.
2. Request **camera permission** before first scan.
3. Haptic + sound on success/deny.
4. Handle offline gracefully (queue scans if you add offline mode later).

---

## Environment variables (mobile builds)

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | API base including `/api` |
| `VITE_API_BASE_URL` | Origin for storage URLs (posters, logos) |
| `FRONTEND_URL` (backend) | Payment redirect & scan invitation links |

---

## Related files in the repo

| Area | Path |
|------|------|
| Mobile API reference | `eav-frontend/react frontend/docs/MOBILE_API.md` |
| User tickets UI | `eav-frontend/react frontend/src/pages/MyTicketsPage.tsx` |
| Scanner (token) | `eav-frontend/react frontend/src/pages/ScanPage.tsx` |
| Scanner (admin) | `eav-frontend/react frontend/src/pages/admin/TicketScanner.tsx` |
| Scan location mgmt | `eav-frontend/react frontend/src/pages/admin/ScanLocationManagement.tsx` |
| Route guards | `eav-frontend/react frontend/src/components/ProtectedRoute.tsx` |
| Admin nav by role | `eav-frontend/react frontend/src/components/AdminLayout.tsx` |
| Wallet ticket HTML | `eventsandvotes/resources/views/tickets/layouts/wallet.blade.php` |
| Scan API | `eventsandvotes/app/Http/Controllers/Api/ScanController.php` |
| QR generation | `eventsandvotes/app/Services/QRCodeService.php` |

---

## Summary

- **Users** get the wallet pass experience on `/my-tickets` after login; tickets are permission-gated by account ownership.
- **Vendors** (`admin_event` / `admin_both` / `superadmin`) manage events and issue scanner links from `/admin/events/:id/scan-locations`.
- **Scanners** use token URLs at `/scan/{token}` with no platform login; access is conditioned on token validity, location, event status, and scan permissions.

For endpoint payloads and pag\ination details, see [MOBILE_API.md](./MOBILE_API.md).


https://eavapi.bizinvestify.com/docs\


# Events & Votes — Mobile API Reference

> Portal roles, vendor/scanner access, and permission matrix: see [MOBILE_PORTALS.md](./MOBILE_PORTALS.md).  
> Interactive **Swagger UI**: [https://eavapi.bizinvestify.com/docs](https://eavapi.bizinvestify.com/docs)

Base URL (production): `https://eavapi.bizinvestify.com/api`  
Local dev: `https://eventsandvotes.test/api`

| Resource | URL |
|----------|-----|
| **Swagger UI** (try endpoints) | https://eavapi.bizinvestify.com/docs |
| OpenAPI spec (YAML) | https://eavapi.bizinvestify.com/docs/openapi.yaml |
| Redirects | `/api/documentation`, `/swagger` → `/docs` |

## Swagger coverage by portal

Swagger groups endpoints with **x-tagGroups** so you can filter by portal:

### User portal tags

| Tag | Examples |
|-----|----------|
| Authentication | `POST /auth/login`, register, forgot/reset password |
| Verification | `GET /verification`, confirm email |
| Profile | `GET/PUT /profile`, avatar, referral dashboard, 2FA |
| User Dashboard | `/dashboard/stats`, `/transactions`, subscriptions |
| Referrals & Banks | `/referral-withdrawals`, `/bank-accounts` |
| Events | `/events`, `/events/upcoming`, `/events/{id}` |
| Tickets | purchase, my-tickets, qr-image, download, staff scan |
| Votes | list, detail, results, pricing, upcoming/popular |
| Cart | add, checkout, callback |
| Contest | nominee login, positions, nominations |
| Public | `/public/settings`, `/payment-gateways`, contact |

### Vendor portal tags (Bearer + `admin_*` role)

| Tag | Examples |
|-----|----------|
| Admin Dashboard | stats, activities, notifications |
| Admin Events | CRUD, publish, analytics, withdrawals |
| Admin Votes | campaigns, positions, nominees, transactions |
| Admin Scan Locations | locations, invite scanners, regenerate token |
| Admin Withdrawals | list, approve, reject |

### Scanner portal tags (no Bearer — scan token only)

| Tag | Examples |
|-----|----------|
| Scan | `GET /scan/validate/{token}`, `POST /scan/ticket` |

### Superadmin tag

| Tag | Examples |
|-----|----------|
| Superadmin | payment gateways, subscription plans, site settings, user management |

## Headers

```
Content-Type: application/json
Accept: application/json
Authorization: Bearer {token}   # required for protected routes
```

## Authentication

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/login` | No | Returns `token`, `user`, `settings` |
| POST | `/auth/register` | No | Create account |
| GET | `/auth/user` | Yes | Current user |
| POST | `/auth/logout` | Yes | Revoke session |

### Login example

```http
POST /api/auth/login
```

```json
{
  "email": "user@example.com",
  "password": "password"
}
```

## Events flow (mobile)

### 1. Discover events

| Method | Path | Notes |
|--------|------|-------|
| GET | `/events` | Full catalog, pagination, `search`, `status`, `upcoming` |
| GET | `/events/upcoming` | Lightweight list + `meta` pagination |
| GET | `/events/popular` | Sorted by ticket sales |
| GET | `/events/ongoing` | Events active today |
| GET | `/events/past` | Completed events |
| GET | `/events/{id}` | Detail + `ticketTiers` + `statistics` |

### 2. Purchase tickets

```http
POST /api/tickets/purchase
```

```json
{
  "event_id": "uuid",
  "customer_name": "Jane Doe",
  "customer_email": "jane@example.com",
  "customer_phone": "08012345678",
  "tickets": [
    { "tier_id": 1, "quantity": 2 }
  ]
}
```

**Paid events:** response includes `data.payment_url` (or `authorization_url`) — open in WebView.  
**Free events:** response includes `data.payment_status: "completed"` and ticket list.

### 3. Payment callback

```http
POST /api/tickets/payment-callback
```

```json
{
  "reference": "TXN_xxx",
  "status": "success"
}
```

### 4. User tickets

```http
GET /api/tickets/my-tickets?event_id={uuid}&status=sold&page=1
GET /api/tickets/{uuid}/details
GET /api/tickets/{uuid}/qr-image?size=220
GET /api/tickets/{ticketId}/download
```

Requires Bearer token.

## Profile & account (authenticated)

| Method | Path | Notes |
|--------|------|-------|
| GET | `/profile` | Profile + referral |
| PUT | `/profile` | Update (verified account) |
| PUT | `/profile/password` | Change password |
| POST | `/profile/avatar` | Multipart upload |
| GET | `/profile/referral-dashboard` | Referral stats |
| GET | `/profile/referral-history` | History |
| POST | `/profile/generate-referral-code` | New code |
| GET | `/dashboard/stats` | User dashboard |
| GET | `/referral-withdrawals` | List withdrawals |
| POST | `/referral-withdrawals` | Request payout |
| GET/POST | `/bank-accounts` | Bank accounts CRUD |

## Votes flow

| Method | Path |
|--------|------|
| GET | `/votes`, `/votes/upcoming`, `/votes/popular`, `/votes/ongoing`, `/votes/past` |
| GET | `/votes/pricing` |
| GET | `/votes/{slug}/{id}` |
| GET | `/votes/{slug}/{id}/results` |
| GET | `/cart` |
| POST | `/cart/add`, `/cart/remove`, `/cart/update`, `/cart/clear` |
| POST | `/cart/checkout`, `/cart/checkout/callback` |

## Vendor admin (Bearer + `admin_event` / `admin_both`)

| Method | Path |
|--------|------|
| GET | `/admin/dashboard/stats` |
| GET/POST | `/admin/events` |
| GET/PUT | `/admin/events/{id}` |
| POST | `/admin/events/{id}/publish` |
| GET | `/admin/events/{id}/analytics` |
| GET/POST | `/admin/events/{id}/scan-locations` |
| POST | `/admin/scan-locations/{id}/regenerate-token` |
| GET/POST | `/admin/votes` |
| GET | `/admin/withdrawals` |

## Scanner (scan token — no Bearer)

| Method | Path |
|--------|------|
| GET | `/scan/validate/{token}` |
| POST | `/scan/ticket` |

## Site settings (cache on launch)

```http
GET /api/public/settings
```

Returns currency, logos, feature flags.

## Error handling

| Status | Action |
|--------|--------|
| 401 | Clear token, show login |
| 403 + `verification_required` | Navigate to email verification |
| 422 | Show `errors` object field messages |

## Web UI routes (reference)

| Page | Route |
|------|-------|
| Events list | `/events` |
| Event detail | `/events/:id` |
| Buy tickets | `/events/:id/tickets` |
| My tickets | `/my-tickets` |
| API docs (web) | `/api-docs` |
| Payment return | `/payment/callback` |


# Events & Votes — Mobile Portals Guide

This document describes the **three mobile-facing experiences** in the Events & Votes (EAV) platform, how they are **gated by role and permission**, and the routes/APIs each portal uses.

Use this alongside [MOBILE_API.md](./MOBILE_API.md) for endpoint-level reference.

---

## Platform overview

EAV is a responsive web app (React) backed by a Laravel API. On mobile it behaves like a **Progressive Web App experience**: same URLs work in Safari/Chrome, can be saved to the home screen, and gate staff can use the **device camera** for QR scanning.

| Portal | Who | Primary mobile use |
|--------|-----|-------------------|
| **User** | Ticket buyers & voters | Browse events, buy tickets, show wallet pass at gate |
| **Vendor** | Event organizers (`admin_event`, `admin_both`, `superadmin`) | Create events, manage tiers, assign scanners, view analytics |
| **Scanner** | Gate staff (token link, no full account required) | Scan QR codes at entry/exit/checkpoint |

Production web app: `https://eav.bizinvestify.com`  
Production API: `https://eavapi.bizinvestify.com/api`  
**Swagger UI:** [https://eavapi.bizinvestify.com/docs](https://eavapi.bizinvestify.com/docs)

---

## Roles & permission model

Access is controlled at two layers:

1. **Account role** (`user.role.name`) — Spatie roles on the Laravel `User` model  
2. **Route guards** — React `ProtectedRoute` + Laravel middleware on API routes  
3. **Scanner permissions** — JSON array on `ScanUser` records (separate from platform login)

### Account roles

| Role | User portal | Vendor portal | Scanner portal |
|------|-------------|---------------|----------------|
| `user` | Yes | No | No (unless given scan link) |
| `admin_vote` | Yes | Elections/votes admin only | No |
| `admin_event` | Yes | Events vendor tools | No (creates scan users) |
| `admin_both` | Yes | Events + elections | No |
| `admin` | Yes | Broad admin (legacy) | No |
| `superadmin` | Yes | Full platform | No |

### Spatie permissions (examples)

| Permission | Typical holder | Meaning |
|------------|----------------|---------|
| `user.auth-login` | All roles | Can authenticate |
| `user.event-participate` | `user`, `admin_event`, `admin_both` | Buy tickets, view own passes |
| `user.vote-participate` | `user`, `admin_vote`, `admin_both` | Vote in contests |
| `user.profile-view` / `user.profile-edit` | All authenticated users | Profile & avatar |
| `user.referral-view` / `user.referral-manage` | Most roles | Referral dashboard |
| `management.*`, `users.*`, `activity_log.*` | `superadmin` only | Platform management |

Email verification is enforced on protected user routes unless the path is `/verification`.

### Scanner user permissions (gate staff)

Scan users are **not** platform accounts. They are invited per **scan location** with a token URL.

| Permission | `scanner` role | `supervisor` role |
|------------|----------------|-------------------|
| `scan_tickets` | Yes | Yes |
| `view_reports` | Optional | Yes |
| `manage_users` | No | Yes |
| `override_scans` | No | Yes |

Scan user fields: `role` (`scanner` | `supervisor`), `permissions[]`, `access_token`, `token_expires_at`, `is_active`.

---

## 1. User portal (mobile)

**Audience:** Ticket holders and voters with a normal account (`user` or any role using the public app).

### What users do on mobile

- Discover and browse **public events** (`/events`)
- View event details and **purchase tickets** (`/events/:id/tickets`)
- Complete **Paystack** payment in browser/WebView → return via `/payment/callback`
- Open **My Tickets** — wallet-style digital passes (`/my-tickets`)
- **Show QR at gate** (in-app modal) or **download HTML pass**
- Participate in **votes/contests** (`/votes`, cart, checkout)
- Manage **profile**, referrals, earnings

### Key routes (web / mobile browser)

| Screen | Route | Auth |
|--------|-------|------|
| Events list | `/events` | Public |
| Event detail | `/events/:id` | Public |
| Buy tickets | `/events/:id/tickets` | Public (login recommended) |
| My Tickets | `/my-tickets` | Login required |
| Payment return | `/payment/callback?type=tickets&reference=…` | Public |
| Dashboard | `/dashboard` | Login + verified email |
| Profile | `/profile` | Login |

### Ticket wallet (2026 pass design)

Downloaded tickets and in-app cards use the **Wallet Premium** layout when the event template is set to a `wallet` layout:

- Landscape pass (~900×420, stacks on mobile)
- Full-bleed event poster + ambient blurred background
- **VALID {TIER}** live validation pill (green pulse when active)
- Compact QR (~120px) + monospace entry code (`TKT-XXXXXXXX`)
- Serial number, issue time, “Powered by Events & Votes”

### User API (authenticated)

```http
Authorization: Bearer {token}
```

| Action | Method | Path |
|--------|--------|------|
| List my tickets | GET | `/tickets/my-tickets` |
| Download pass (HTML) | GET | `/tickets/{id}/download` |
| QR image (local, no external API) | GET | `/tickets/{uuid}/qr-image?size=220` |
| Ticket details | GET | `/tickets/{uuid}/details` |

QR codes encode a **signed scan payload** (base64 JSON with `uuid` + `hash`) compatible with gate scanners.

### Mobile UX notes

- My Tickets is **mobile-first**: cards stack vertically; QR opens as a bottom sheet.
- Prefer **same email at purchase and login** so tickets auto-link to the account.
- After template changes on an event, users must **re-download** passes to see the new design.

---

## 2. Vendor portal (event organizer)

**Audience:** Event vendors / organizers — roles `admin_event`, `admin_both`, or `superadmin`.

In EAV, “vendor” means the **event organizer** who creates events, sets ticket tiers, chooses ticket design templates, and operates check-in.

### What vendors do on mobile

- View and manage **their events** (superadmin sees all)
- Create/edit events, upload poster, set **ticket template** (Wallet Premium, Neon, etc.)
- Configure **ticket tiers** (VIP, General, capacity, pricing)
- **Publish** events and monitor sales
- Open **event analytics** (`/admin/events/:id/analytics`)
- Manage **scan locations** and invite gate staff
- Optional: **withdrawals** for event revenue

### Access conditions

| Check | Rule |
|-------|------|
| React route | `/admin/*` requires role in `admin`, `superadmin`, `admin_vote`, `admin_event`, `admin_both` |
| Sidebar “Events” menu | `superadmin` **or** `admin_event` **or** `admin_both` |
| API event management | `adminIndex` / CRUD: same roles; non–superadmin limited to `organizer_id = auth user` |
| Per-event actions | `userCanManageEvent()` — superadmin or event `organizer_id` |

### Key vendor routes

| Screen | Route | Role |
|--------|-------|------|
| Admin dashboard | `/admin/dashboard` | Admin roles |
| All events | `/admin/events` | Event-capable roles |
| Create event | `/admin/events/create` | Event-capable roles |
| Edit event | `/admin/events/:id/edit` | Organizer or superadmin |
| Ticket tiers | `/admin/events/:id/tickets` | Organizer or superadmin |
| Scan locations | `/admin/events/:id/scan-locations` | Organizer or superadmin |
| Gate scanner (staff UI) | `/admin/events/:id/scanner` | Organizer or superadmin |
| Analytics | `/admin/events/:id/analytics` | Organizer or superadmin |

### Vendor API (prefix `/api/admin/…`, Bearer token)

| Action | Method | Path |
|--------|--------|------|
| List manageable events | GET | `/admin/events` |
| Create event | POST | `/admin/events` |
| Update event | PUT | `/admin/events/{id}` |
| Publish | POST | `/admin/events/{id}/publish` |
| Analytics | GET | `/admin/events/{id}/analytics` |
| Ticket templates | GET | `/admin/events/ticket-templates` |
| Scan locations CRUD | * | `/admin/scan-locations/…` |
| Create scan user | POST | `/admin/scan-locations/{id}/users` |
| Regenerate scan token | POST | `/admin/scan-locations/{locationId}/users/{userId}/regenerate-token` |

### Inviting gate staff (vendor workflow)

1. Vendor creates a **scan location** (Main Gate, VIP Entry, Exit, Checkpoint).
2. Vendor adds a **scan user** (scanner or supervisor) with email.
3. System generates `access_token` and sends invitation with URL:  
   **`https://{frontend}/scan/{access_token}`**
4. Staff opens link on phone → **Scanner portal** (no EAV login).

---

## 3. Scanner portal (gate staff)

**Audience:** Temporary gate staff authenticated by **scan token**, not by platform password.

### What scanners do on mobile

- Open invitation link `/scan/{token}`
- App validates token with API
- See assigned **event**, **location name**, and role
- Tap **Scan** → use **device camera** (QRScanner component)
- Submit scan → API verifies ticket for **that event only**
- View basic session stats (today’s scans, last scan time)

### Access conditions

| Check | Rule |
|-------|------|
| Token | Must match active `ScanUser.access_token` |
| Expiry | `token_expires_at` must be in the future (if set) |
| Location | `ScanLocation.is_active = true` |
| Event | Event `status = active` |
| Permission | `scan_tickets` in `ScanUser.permissions` (implicit for active users) |

Invalid/expired token → “Access Denied” screen.

### Scanner routes & API

| Action | Method | Path | Auth |
|--------|--------|------|------|
| Validate token / load session | GET | `/api/scan/validate/{token}` | Public (token in URL) |
| Scan ticket | POST | `/api/scan/ticket` | Body: `scan_token`, `qr_data`, `scan_type`, `location` |

**Scan request body:**

```json
{
  "qr_data": "<payload from QR or ticket UUID>",
  "scan_token": "<access_token from URL>",
  "scan_type": "entry",
  "location": "Main Entrance"
}
```

**Success:** ticket marked used (entry), scan logged.  
**Denied:** wrong event, already used, invalid ticket, inactive event.

### Organizer scanner (alternative)

Logged-in vendors can also use **`/admin/events/:id/scanner`** with their Bearer token and `POST /api/tickets/scan` (staff API). This is for organizers testing at the gate without a separate scan user.

---

## Permission flow diagram

```mermaid
flowchart TB
    subgraph Public
        A[Browse /events]
        B[Purchase tickets]
    end

    subgraph UserPortal["User portal — role: user+"]
        C[Login + verify email]
        D[/my-tickets wallet pass]
        E[QR modal / download HTML]
    end

    subgraph VendorPortal["Vendor portal — admin_event / admin_both / superadmin"]
        F[/admin/events]
        G[Scan locations + staff]
        H[Analytics + withdrawals]
    end

    subgraph ScannerPortal["Scanner portal — scan token only"]
        I[/scan/token]
        J[Camera QR scan]
        K[POST /scan/ticket]
    end

    A --> B
    B --> C
    C --> D --> E
    F --> G
    G -->|invitation link| I
    I --> J --> K
    E -->|QR at gate| K
```

---

## Authentication quick reference

### Login (all portals except scanner)

```http
POST /api/auth/login
Content-Type: application/json

{ "email": "...", "password": "..." }
```

Store `token` and send on protected requests:

```http
Authorization: Bearer {token}
Accept: application/json
```

### Scanner (token only)

No login. The `{token}` in `/scan/{token}` **is** the credential for scan APIs.

---

## Error handling on mobile

| HTTP | Portal | Action |
|------|--------|--------|
| 401 | User / Vendor | Clear token → `/login` |
| 401 | Scanner | Show “Invalid or expired scan URL” |
| 403 | User | Email verification → `/verification` |
| 403 | Vendor | User lacks role or is not event organizer |
| 404 | Scanner | Ticket not found at gate |
| 400 | Scanner | Ticket wrong event / already used |

---

## Recommended mobile implementation

### User app / WebView

1. Cache `GET /api/public/settings` on launch.
2. Persist Bearer token securely (Keychain / EncryptedSharedPreferences).
3. Deep-link payment return to `/payment/callback`.
4. Open `/my-tickets` after successful purchase.
5. Fetch QR via `GET /tickets/{uuid}/qr-image` with auth (never use third-party QR APIs).

### Vendor app

1. After login, read `user.role.name` to show/hide Events vs Elections menus.
2. Use multipart uploads for event poster + ticket tier forms.
3. Copy scan invitation URL from scan-user management for SMS/WhatsApp to staff.

### Scanner mini-app

1. Open only `/scan/{token}` — bookmark or home-screen shortcut per event.
2. Request **camera permission** before first scan.
3. Haptic + sound on success/deny.
4. Handle offline gracefully (queue scans if you add offline mode later).

---

## Environment variables (mobile builds)

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | API base including `/api` |
| `VITE_API_BASE_URL` | Origin for storage URLs (posters, logos) |
| `FRONTEND_URL` (backend) | Payment redirect & scan invitation links |

---

## Related files in the repo

| Area | Path |
|------|------|
| Mobile API reference | `eav-frontend/react frontend/docs/MOBILE_API.md` |
| User tickets UI | `eav-frontend/react frontend/src/pages/MyTicketsPage.tsx` |
| Scanner (token) | `eav-frontend/react frontend/src/pages/ScanPage.tsx` |
| Scanner (admin) | `eav-frontend/react frontend/src/pages/admin/TicketScanner.tsx` |
| Scan location mgmt | `eav-frontend/react frontend/src/pages/admin/ScanLocationManagement.tsx` |
| Route guards | `eav-frontend/react frontend/src/components/ProtectedRoute.tsx` |
| Admin nav by role | `eav-frontend/react frontend/src/components/AdminLayout.tsx` |
| Wallet ticket HTML | `eventsandvotes/resources/views/tickets/layouts/wallet.blade.php` |
| Scan API | `eventsandvotes/app/Http/Controllers/Api/ScanController.php` |
| QR generation | `eventsandvotes/app/Services/QRCodeService.php` |
| OpenAPI / Swagger | `eventsandvotes/storage/api-docs/openapi.yaml` |
| Swagger UI view | `eventsandvotes/resources/views/docs/swagger.blade.php` |

---

## Summary

- **Users** get the wallet pass experience on `/my-tickets` after login; tickets are permission-gated by account ownership.
- **Vendors** (`admin_event` / `admin_both` / `superadmin`) manage events and issue scanner links from `/admin/events/:id/scan-locations`.
- **Scanners** use token URLs at `/scan/{token}` with no platform login; access is conditioned on token validity, location, event status, and scan permissions.

For endpoint payloads and pagination details, see [MOBILE_API.md](./MOBILE_API.md).

---

## Swagger API reference (complete)

Use **Swagger UI** for interactive docs covering user, vendor, and scanner APIs:

**https://eavapi.bizinvestify.com/docs**

| Portal | Swagger tag group | Key endpoints |
|--------|-------------------|---------------|
| User | User portal | Auth, Profile, Tickets, Votes, Cart, Referrals |
| Vendor | Vendor portal | Admin Events, Admin Votes, Scan Locations |
| Scanner | Scanner portal | `/scan/validate/{token}`, `/scan/ticket` |
| Platform | Superadmin | Gateways, plans, site settings |

OpenAPI source: `eventsandvotes/storage/api-docs/openapi.yaml`