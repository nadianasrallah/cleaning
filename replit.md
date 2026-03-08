# CleanPro - Multi-Tenant SaaS Cleaning Platform

A comprehensive multi-tenant SaaS platform for cleaning companies to manage bookings, clients, staff, marketing, and communications.

## Overview

CleanPro is a full-featured platform that enables cleaning companies to:
1. Manage their entire cleaning business through an admin portal
2. Handle client bookings with recurring schedules
3. Track leads and run marketing campaigns with promo codes
4. Communicate with clients through in-app messaging
5. Use custom branding and domains per company

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + custom components
- **Routing**: React Router v6
- **State**: React Query + React Context
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: JWT tokens with bcrypt password hashing
- **Payments**: Stripe (planned)
- **SMS**: Twilio (planned)
- **Notifications**: Sonner toast library

## Project Structure

```
/
├── server/                    # Express.js backend
│   ├── index.ts              # Server entry point
│   ├── db/
│   │   ├── index.ts          # Database connection
│   │   └── schema.ts         # Drizzle schema definitions
│   ├── middleware/
│   │   └── auth.ts           # JWT authentication middleware
│   └── routes/               # API route handlers
│       ├── auth.ts           # Authentication routes
│       ├── companies.ts      # Company management
│       ├── services.ts       # Service CRUD
│       ├── staff.ts          # Staff management
│       ├── clients.ts        # Client management
│       ├── bookings.ts       # Booking operations
│       ├── messages.ts       # In-app messaging
│       ├── leads.ts          # Lead management
│       ├── sms.ts            # SMS notifications
│       └── promo-codes.ts    # Promo code management
├── src/                       # React frontend
│   ├── components/
│   │   ├── booking/          # Booking flow components
│   │   └── ui/               # Reusable UI components
│   ├── contexts/
│   │   └── AuthContext.tsx   # Authentication state
│   ├── lib/
│   │   ├── api.ts            # API client utilities
│   │   └── utils.ts          # Helper functions
│   └── pages/
│       ├── Home.tsx          # Marketing landing page
│       ├── Login.tsx         # Admin login
│       ├── Register.tsx      # Company registration
│       └── admin/            # Admin portal pages
│           ├── AdminLayout.tsx
│           ├── Dashboard.tsx
│           ├── Bookings.tsx
│           ├── Clients.tsx
│           ├── Services.tsx
│           ├── Leads.tsx
│           ├── Messages.tsx
│           └── Settings.tsx
├── App.tsx                    # App router
├── main.tsx                   # Entry point
└── styles.css                 # Global styles
```

## Routes

### Frontend Routes

| Route | Description |
|-------|-------------|
| `/` | Marketing landing page |
| `/findmybuilding` | Building search page |
| `/booking` | Multi-step booking flow |
| `/rsvp/:buildingSlug/:eventType` | Event RSVP pages |
| `/login` | Admin login page |
| `/register` | Company registration |
| `/admin` | Admin dashboard (protected) |
| `/admin/bookings` | Booking management |
| `/admin/clients` | Client management |
| `/admin/services` | Service configuration |
| `/admin/leads` | Lead management |
| `/admin/messages` | In-app messaging |
| `/admin/settings` | Company settings |

### API Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register new company |
| POST | `/api/auth/login` | User login |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/companies/:id` | Get company details |
| PUT | `/api/companies/:id/branding` | Update branding |
| CRUD | `/api/services` | Service management |
| CRUD | `/api/clients` | Client management |
| CRUD | `/api/bookings` | Booking operations |
| CRUD | `/api/messages` | Messaging system |
| CRUD | `/api/leads` | Lead management |
| CRUD | `/api/promo-codes` | Promo code management |
| POST | `/api/sms/send` | Send SMS notification |

## Database Schema

```sql
-- Multi-tenancy
users: User accounts with company association
companies: Cleaning company records
company_branding: Custom branding per company

-- Core operations
services: Cleaning services with pricing
clients: Client contact information
staff: Staff members per company
bookings: Scheduled appointments
schedules: Staff availability

-- Marketing & Communication
leads: Lead capture from marketing
promo_codes: Promotional codes
messages: In-app messaging threads
notifications: Push/email notifications
```

## Development

Run both frontend and backend:
```bash
npm run dev
```

This runs:
- Frontend on port 5000 (Vite)
- Backend on port 3001 (Express)

## Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string

Optional:
- `JWT_SECRET` - JWT signing secret (defaults to development secret)
- `TWILIO_ACCOUNT_SID` - Twilio account for SMS
- `TWILIO_AUTH_TOKEN` - Twilio authentication
- `TWILIO_PHONE_NUMBER` - Twilio sender number
- `STRIPE_SECRET_KEY` - Stripe payment processing
- `VITE_STRIPE_PUBLISHABLE_KEY` - Stripe frontend key

## Features

### Admin Portal
- Dashboard with KPI metrics
- Booking calendar and management
- Client database with search
- Service configuration with pricing
- Lead tracking and conversion
- In-app messaging
- Company branding settings

### Client-Facing
- Marketing landing page
- Building finder with fuzzy search
- Multi-step booking flow
- RSVP event pages

### Multi-Tenant Architecture
- Each company has isolated data
- Custom branding (logo, colors, domain)
- White-label support
- JWT-based authentication

## Recent Changes (November 2025)

- Built complete Express.js backend with TypeScript
- Implemented multi-tenant database schema with 10+ tables
- Created admin portal with 7 main pages
- Added JWT authentication with login/register flows
- Set up concurrent dev workflow (frontend + backend)
- Integrated Drizzle ORM for database operations
- Email notifications via Resend (booking confirmation, reminders, cancellation)
- Marketing automation webhooks (inbound lead capture, outbound with retry logic)
- Custom domain routing with DNS verification (CNAME/A record checking)
- Branded login page with dynamic company theming
- **Booking Detail Page** (`/admin/bookings/:id`) - Full booking info, status updates, staff assignment, notes
- **Client Detail Page** (`/admin/clients/:id`) - Profile, booking history, invoices list
- **Client Booking Detail** (`/client/bookings/:id`) - View and cancel bookings from client portal
- **Stripe Invoice Payments** - Pay Now button with checkout session creation for unpaid invoices
- **Staff Assignment** - Assign staff to bookings with availability checking
- **Recurring Bookings** - Frequency options (weekly, bi-weekly, monthly) with auto-generated future bookings
- **SMS Service (Twilio)** - Templates for confirmations, reminders, cancellations (awaiting credentials)
- **Reports/Analytics Page** (`/admin/reports`) - Revenue stats, booking trends, staff performance, client retention
- **Mobile Responsiveness** - Comprehensive mobile-friendly updates across all pages:
  - Admin portal: Dashboard, Bookings, Clients, Staff, Services, Leads, Messages, SMS, Reports, Settings, Scheduling
  - Client portal: Dashboard, Bookings, Invoices, Messages, Settings, Referrals, New Booking, Booking Detail
  - Responsive headers (flex-col to flex-row), adaptive text sizing (text-2xl sm:text-3xl)
  - Full-width buttons on mobile, touch-friendly tap targets
  - Horizontal scroll for tabs, adaptive grid layouts (1→2→3→4 columns)
  - Mobile-optimized messaging with show/hide conversation panels

## Custom Domain Routing

Companies can set up custom domains that point to their branded portal:

1. **Domain Configuration**: Admin sets custom domain in company branding settings
2. **DNS Verification**: 
   - Verifies CNAME records pointing to platform domain
   - Falls back to A record verification against platform IPs
3. **Branded Experience**: Login page shows company logo, colors, and name
4. **Automatic Routing**: Domain middleware detects custom domains and applies branding

API Endpoints:
- `POST /api/companies/current/domain/verify` - Verify domain DNS configuration
- `GET /api/companies/current/domain/status` - Get domain verification status
- `GET /api/companies/by-domain/:domain` - Look up company by custom domain

## Webhooks & Integrations

### Inbound Webhooks
- `POST /api/webhooks/inbound/lead` - Capture leads from external sources
- `POST /api/webhooks/inbound/booking` - Receive booking events
- `POST /api/webhooks/inbound/zapier` - Generic Zapier endpoint

### Outbound Webhooks
- Configurable per company with webhook_configs table
- Automatic retry with exponential backoff
- Comprehensive logging in webhook_logs table

## Design System

The platform uses a modern glassmorphism design system with gradient accents and motion effects:

### Typography
- **Font Family**: Manrope (Google Fonts)
- **Headings**: font-extrabold, tracking-tight
- **Labels**: text-xs, font-bold, uppercase, tracking-widest
- **Body**: Normal weight, text-slate-500/600

### Colors & Gradients
- **Primary**: teal-600 (buttons, accents, active states)
- **Page-specific gradients**:
  - Dashboard: teal → emerald
  - Clients: emerald → teal
  - Services: violet → purple → indigo
  - Staff: sky → blue → indigo
  - Leads: amber → orange → red
  - Messages: indigo → purple → pink
- **Text**: slate-900 (headings), slate-500/600 (body)
- **Backgrounds**: slate-50 (inputs), white (cards), gradient canvases

### Visual Effects
- **Glassmorphism**: backdrop-blur-xl, bg-white/80, frosted glass aesthetic
- **Shadows**: Custom shadow-glass-lg with subtle glow
- **Animations**: float, glow, shimmer, slideUp keyframes
- **Micro-interactions**: hover:-translate-y-1, scale transitions

### Components
- **Page Headers**: Gradient backgrounds with dot pattern overlay, frosted icon containers
- **KPI Cards**: White cards with gradient icon badges, rounded-2xl corners
- **Pro Tips Panels**: Dark gradient (slate-800 to slate-900), contextual guidance
- **Empty States**: Gradient icon backgrounds, helpful messaging
- **Loading Spinners**: Themed ring spinners with matching colors

### Layout
- **Admin sidebar**: Glassmorphism effect with gradient spine, animated indicators
- **Client header**: White top navigation with teal accents
- **Content area**: max-width container with consistent padding
- **In-app Guidance**: Pro Tips sections on each page with actionable advice

## Public Customer Booking Flow

Each cleaning company gets a branded public booking page where customers can book without requiring login first:

**URL:** `/book/:companySlug` (e.g., `/book/sparkle-clean`)

**Flow:**
1. **Service Selection** - Browse available cleaning services with prices
2. **Date & Time** - Pick from available time slots (checks staff availability and prevents overbooking)
3. **Customer Info** - Enter name, email, phone
4. **Property Details** - Address, bedrooms, bathrooms, special instructions
5. **Review & Pay** - Confirm booking and pay via Stripe checkout
6. **Confirmation** - Booking confirmed with email notification

**Features:**
- Company branding (logo, colors) applied automatically
- Real-time availability checking based on staff schedules and service duration
- Secure Stripe payment integration with session verification
- Automatic user/client record creation for new customers
- Email confirmation sent after booking

**Backend Endpoints:**
- `GET /api/public/company/:slug` - Company info, branding, services
- `GET /api/public/availability/:companyId` - Available time slots
- `POST /api/public/book` - Create booking with Stripe checkout
- `POST /api/public/booking/payment-success` - Verify and confirm payment

## Client Portal

The client portal allows customers to:
- View their dashboard with upcoming bookings and stats
- Book new cleaning services
- View and manage existing bookings
- Access and pay invoices
- Message their cleaning company
- Update account settings and preferences

Routes:
- `/client` - Client dashboard
- `/client/bookings` - View all bookings
- `/client/bookings/new` - Book new cleaning
- `/client/invoices` - View invoices
- `/client/messages` - Message history
- `/client/settings` - Account settings

## Password Gate (Staging Protection)

The entire site is protected by a temporary password wall for preview/staging purposes:
- **Password**: Set via `VITE_SITE_PASSWORD` environment variable (default: test1234)
- **Component**: `src/components/PasswordGate.tsx`
- **Storage**: Uses sessionStorage to remember authentication during browser session
- **Behavior**: Blocks all access until correct password is entered

To remove: Simply remove the `<PasswordGate>` wrapper from `src/App.tsx`.

## Upcoming Features

- Full Stripe payment flow testing (awaiting credentials)
- Enhanced scheduling optimization
- Promo codes management page
