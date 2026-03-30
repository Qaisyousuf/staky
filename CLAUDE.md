# CLAUDE.md — Staky.dk Project Instructions

## Project Overview
Staky.dk is an EU Stack Switcher platform — a web app that helps businesses discover European alternatives to US software, share switching experiences through a social feed, analyze their tech stack, and connect with migration partners.

**Domain:** staky.dk
**Stack:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, Prisma ORM, PostgreSQL (Neon), NextAuth (Auth.js v5)

---

## Architecture

**Option B architecture:** separate public marketing site + sidebar app after login.

| Route Group | Purpose | Navigation |
|---|---|---|
| `(public)` | Marketing pages | Top nav bar |
| `(app)` | Authenticated app | Sidebar (Notion/Linear style) |
| `(auth)` | Login / Signup | Minimal |

Shared components (cards, badges, icons) are used across both public and app.

---

## User Types

1. **Regular users (switchers)** — browse alternatives, build their stack, share experiences, request migration help
2. **Migration partners** — post expert guides, manage leads, edit company profile, connect with users

### Signup
- Single form with toggle: "I want to switch" vs "I'm a migration partner"
- Partner signup includes extra fields: company name, country, specialty, pricing
- Partner accounts require admin approval before activation

---

## Key Features

### Public Site (no login required)
- Landing page: hero, popular switches with tool logos, community posts preview, partner cards, CTA
- Discover page: search, category filters, alternative cards
- Feed page: all posts + comments visible; login prompts on actions
- Partners page: partner cards with ratings
- Auth pages: login/signup with user type toggle
- Footer: Privacy, Terms, Cookies, About, Contact
- **No pricing page on the public site**

### App — Regular User (sidebar nav)
- **Dashboard:** metrics, quick actions, "from your stack" feed
- **Discover:** search, filter, save, add to stack
- **Feed:** personalized; All / Following / Community / Partners filter; create post, like/recommend/comment/save/share
- **My Stack:** add/remove tools, migration summary, recommended order
- **Partners:** partner cards, request help
- **Requests:** track migration request status
- **Settings:** Profile (avatar upload, bio, social links, interests), Plan & Billing, Notifications (LinkedIn-style in-app/email toggles), Privacy, Account
- **Admin:** Overview, Posts, Comments, Requests, Partners, Users, Reports

### App — Partner User (sidebar nav)
Same as regular user, plus:
- **Leads:** matched migration requests with respond/review actions
- **My Posts:** expert content with engagement stats
- **Company Profile:** editable public profile
- **Partner Dashboard:** leads, active projects, rating, post views

---

## Feed System

- Post anatomy: author (avatar, name, title, company, verified badge), story text (read more), switch card (from → to + badges), engagement actions
- Partner posts are visually distinct: blue left border, square avatar, "Migration Partner" badge, rating + project count, "Request help" CTA
- Comments are threaded with replies
- All posts and comments are **public** (visible without login)
- Actions (like, recommend, save, comment, follow/connect) **require login**

---

## Social System

- **Follow** — one-directional, for regular users
- **Connect** — mutual, for partners
- Follow/Connect buttons appear on every post author
- "Following" tab in feed filter

---

## Notifications (LinkedIn-style)

- Bell icon in top bar with count badge; Messages icon with unread dot
- Both have dropdown panels
- Notification types: likes, comments, replies, follows, connects, recommendations, saves, shares
- Settings: dual toggles (in-app + email) per notification type
- Email digest options: real-time, daily, weekly, off

---

## Monetization

Structure is ready; payments integration comes later.

- Plans: Free / Pro (€9/mo) / Business (€29/mo)
- Partner lead fees
- Featured / verified partner listings
- Plan & Billing lives in Settings

---

## Design Guidelines

- Clean, minimal, light theme
- **Icons:** lucide-react SVG line icons only — never unicode characters
- Generous whitespace and padding
- **Primary accent:** green `#0F6E56` for primary actions
- **Partner accent:** blue `#2A5FA5` for partner elements
- Subtle badges without heavy borders
- Soft hover effects
- **Font:** `-apple-system, 'Segoe UI', system-ui, sans-serif`

---

## Code Style

- TypeScript strict mode throughout
- **Server components by default**; use client components only when necessary (interactivity, browser APIs)
- Zod for all validation
- React Hook Form + `@hookform/resolvers` for forms
- File naming: `kebab-case` for files, `PascalCase` for components
- Always handle loading and error states
- Tailwind CSS classes only — no inline styles in production code

---

## Database Models (Prisma)

`User`, `AlternativePost`, `Comment`, `Like`, `Recommendation`, `SavedPost`, `Follow`, `Connection`, `Stack`, `StackItem`, `MigrationRequest`, `Partner`, `Notification`, `Message`, `Report`

---

## Dependencies

```
next react typescript tailwindcss
prisma @prisma/client
next-auth @auth/prisma-adapter
zod react-hook-form @hookform/resolvers
lucide-react sonner date-fns
uploadthing @uploadthing/react
resend
react-intersection-observer
```

---

## Environment Variables

```env
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
UPLOADTHING_SECRET=
UPLOADTHING_APP_ID=
RESEND_API_KEY=
```
