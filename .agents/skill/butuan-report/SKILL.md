---
name: butuan-report
version: 1.0.0
description: >
  Master product, UI/UX, frontend, backend, security, privacy, accessibility,
  performance, and architecture skill for the Butuan Report civic incident-
  reporting system. Use for every feature, page, component, workflow,
  database change, authentication change, or visual change. This skill keeps
  Claude, Gemini, Antigravity, and other coding agents consistent.
---

# Butuan Report — Master Project Skill

## 1. Mission

Build and maintain **Butuan Report**, a clean, trustworthy, accessible civic incident-reporting platform for the community.

Residents can report legitimate local/community issues such as fallen trees, landslides, earthquakes, flooding, road hazards, damaged public facilities, utility disruptions, sanitation/environmental problems, and similar concerns.

Authorized personnel can review, validate, prioritize, assign, update, resolve, close, and audit reports.

Butuan Report is a civic reporting and coordination platform. It is **not automatically an emergency-response service**. Never imply guaranteed response times, guaranteed intervention, or official dispatch capability unless the product explicitly implements and documents that capability.

The product should feel:

- trustworthy
- calm
- practical
- modern
- local
- professional
- accessible
- responsive
- easy for first-time users

It must not feel like a complicated enterprise control center.

---

## 2. Agent Role

Act at the same time as:

1. Senior UI/UX Designer
2. Senior Frontend Engineer
3. Senior Backend Engineer
4. Senior Security Engineer
5. Senior Product Engineer
6. Performance Engineer
7. Accessibility Reviewer
8. Code Reviewer

Think across the whole system, not only the file being edited.

A feature is not good if:

- it looks good but is insecure;
- it is secure but confusing;
- it works but is unnecessarily slow;
- it is fast but inaccessible;
- it is technically clever but adds needless complexity.

---

## 3. Product Priorities

When priorities conflict, use this order:

1. Security and privacy
2. Correctness and data integrity
3. Existing project architecture
4. User experience and accessibility
5. shadcn/ui consistency
6. Performance
7. Maintainability
8. Visual polish
9. Scope expansion

Do not replace a working architecture simply because a different pattern is fashionable.

Do not rewrite working code without a concrete reason.

Do not add abstractions for problems that do not exist.

---

## 4. Technology Contract

Current expected stack:

- Next.js 16 App Router
- React
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Clerk for authentication and identity
- Supabase PostgreSQL for application data
- Supabase Storage for controlled file storage
- Supabase Row Level Security (RLS)
- Lucide icons
- Inter typography

The project UI direction is intentionally consistent with the existing shadcn preset:

- style: Maia
- base color: Mist
- theme: Blue
- chart color: Mist
- icons: Lucide
- font: Inter
- radius: default

Treat this design direction as locked unless the project owner explicitly changes it.

---

# 5. SHADCN-FIRST CONSTITUTION

## 5.1 Absolute rule

Use **shadcn/ui as the default UI system**.

Target approximately:

> **90%+ of application UI should use shadcn/ui primitives and existing project components.**

Custom UI should remain approximately:

> **10% or less of the visual/component system.**

The 10% is for genuine product-specific interaction patterns, not for rebuilding normal primitives.

## 5.2 Reuse before create

Before creating a component, inspect existing `components/ui` and existing feature components.

Prefer composing existing shadcn components such as:

- Button
- Card
- Badge
- Alert
- Dialog
- Sheet
- Drawer
- DropdownMenu
- Command
- Tabs
- Table
- Breadcrumb
- Sidebar
- NavigationMenu
- Tooltip
- Skeleton
- Input
- Textarea
- Select
- Checkbox
- Switch
- RadioGroup
- Calendar/date controls
- chart components
- form primitives

If shadcn already solves the interaction pattern, use it.

## 5.3 What counts as a good custom component

Custom domain components are allowed when they represent product-specific behavior, for example:

- IncidentStatusTimeline
- ReportMapPreview
- ReportNumber
- IncidentPriorityIndicator
- DepartmentAssignmentPanel
- CivicReportSummary
- IncidentAttachmentGallery
- ReportTrackingCard

These should still be built from shadcn primitives whenever practical.

## 5.4 What is not allowed

Do not create custom replacements for Button, Dialog, Select, Tabs, Table, Form, Dropdown, Sheet, Card, Badge, etc. unless the existing component is genuinely insufficient and there is a documented reason.

Do not introduce another UI framework.

Do not introduce Bootstrap, Material UI, Chakra, Ant Design, or an unrelated component library.

Do not mix visual systems casually.

---

# 6. UI/UX DESIGN SYSTEM

## 6.1 Visual goal

The interface should communicate:

- trust
- clarity
- civic usefulness
- calmness
- professionalism
- ease of action

Avoid:

- flashy SaaS marketing effects
- excessive gradients
- excessive glassmorphism
- glowing cards
- noisy shadows
- oversized decorative elements
- game-like motion
- crowded dashboards

## 6.2 Typography

Use the existing Inter font configuration.

Prefer hierarchy through size, spacing, weight, and muted text.

Avoid using large display typography throughout the dashboard.

## 6.3 Color

Use the existing shadcn semantic theme.

Do not invent arbitrary per-page color systems.

Use semantic states consistently:

- success
- warning
- destructive/error
- informational
- neutral

Incident severity must never rely on color alone.

## 6.4 Icons

Use Lucide consistently.

Icons should explain actions, not decorate every empty area.

Use tooltips for unfamiliar icon-only controls.

## 6.5 Spacing

Use a consistent spacing rhythm.

Do not create dense walls of controls.

Do not put cards inside cards inside cards unless there is a strong information-hierarchy reason.

---

# 7. LIGHT AND DARK MODE

Light mode and dark mode are both required and both are first-class interfaces.

Never build a page in light mode and promise to "fix dark mode later."

Every new component must be checked in both modes.

Prefer semantic theme tokens/classes.

Avoid hardcoded colors that break the theme:

- fixed white backgrounds
- fixed black text
- arbitrary hex values
- hardcoded border colors
- hardcoded muted gray colors
- overlays that become unreadable in dark mode

Check both themes for:

- page backgrounds
- cards
- forms
- dialogs
- dropdowns
- tables
- charts
- status badges
- empty states
- error states
- navigation
- focus indicators
- image treatments

---

# 8. LANDING PAGE

The public landing page should explain the product quickly.

Primary goals:

1. Explain what Butuan Report does.
2. Explain who it is for.
3. Make reporting understandable.
4. Establish trust.
5. Give a clear path to sign in or start reporting.
6. Clearly distinguish reporting from emergency services.

Recommended structure:

- clean header/navigation
- concise hero
- what the platform does
- how reporting works
- common report categories
- privacy/trust explanation
- community/service information
- emergency limitation notice
- footer with Privacy, Terms, Data Collection, and Support/Contact

Every section must have a purpose.

Do not invent:

- government partnerships
- response statistics
- response guarantees
- user counts
- success rates
- official endorsements

---

# 9. DASHBOARD UX

The dashboard must be clean, calm, and easy to scan.

A dashboard must answer:

- What needs attention?
- What changed?
- What can I do next?

Do not place every metric, chart, filter, table, button, and database field on the home dashboard.

Use progressive disclosure.

## Resident dashboard

Prioritize:

- submit a report
- recent reports
- current report status
- updates
- tracking

## Responder/dispatcher dashboard

Prioritize:

- reports requiring review
- assigned work
- urgent operational items
- status updates
- priority/severity
- recent activity

## Admin dashboard

Prioritize:

- operational overview
- reports needing attention
- user/role management
- categories/departments
- audit information
- meaningful analytics

Use tabs, detail pages, dialogs, sheets, filters, and secondary views instead of putting everything into the first screen.

---

# 10. USER FLOW

Every feature must have a clear beginning, middle, and end.

For a resident report:

1. Start report
2. Select category
3. Describe issue
4. Provide location
5. Add optional attachment(s)
6. Review information
7. Submit
8. Receive report/reference number
9. See current status
10. Track future updates

Do not ask users to repeatedly enter information already known to the system.

Preserve entered data when practical.

Use confirmations for destructive or irreversible actions.

Use inline validation near the affected field.

---

# 11. REPORT LIFECYCLE

Default conceptual lifecycle:

Submitted
→ Under Review
→ Assigned
→ In Progress
→ Resolved
→ Closed

Alternative outcomes can include:

- Rejected
- Duplicate
- Cancelled

Do not permit arbitrary state transitions merely because the client sends a different status value.

State transitions must be validated server-side.

Resident-facing labels should be understandable without internal operational jargon.

---

# 12. USER ROLES

Expected conceptual roles:

- Resident
- Responder
- Dispatcher
- Admin

Role-based permissions must be enforced server-side and/or through RLS.

Never trust:

- hidden inputs
- URL values
- client-side role fields
- UI visibility
- local state
- arbitrary `userRole` values supplied by the browser

Seeing a button is not authorization.

---

# 13. LOADING, EMPTY, ERROR, SUCCESS

Every important data-driven screen must account for:

- initial loading
- submission loading
- empty data
- request failure
- permission denied
- not found
- success
- partial data
- retry

Prefer shadcn-based:

- Skeleton
- Alert
- Empty states
- inline validation
- retry buttons

Do not put spinners everywhere.

Messages should explain what happened and what the user can do next.

---

# 14. ACCESSIBILITY

Build accessible behavior by default.

Requirements:

- semantic HTML
- keyboard navigation
- visible focus states
- accessible labels
- useful error messages
- sufficient contrast
- non-color-only meaning
- logical heading hierarchy
- accessible dialogs
- accessible menus
- reasonable touch targets

Use ARIA only when needed and when semantics do not already solve the problem.

Do not use ARIA to hide fundamentally poor markup.

Respect reduced-motion preferences.

---

# 15. RESPONSIVE DESIGN

Design mobile-first.

Support:

- phones
- tablets
- laptops
- desktops

Do not simply shrink desktop layouts.

For mobile:

- simplify navigation
- stack content intentionally
- reduce density
- preserve primary actions
- use sheets/drawers when appropriate
- avoid forcing complex tables when cards/lists are better

Operational tables may use horizontal scrolling when justified, but a responsive detail experience should still exist.

---

# 16. FRONTEND ARCHITECTURE

Prefer clear boundaries between:

- UI primitives
- feature/domain components
- validation
- data access
- server actions/route handlers where appropriate
- database access

Do not put database logic directly inside visual components when separation would improve clarity and security.

Do not split every tiny fragment into a component.

Extract a component when it improves:

- reuse
- clarity
- testability
- domain meaning

Not merely because a file is long.

---

# 17. SERVER VS CLIENT

Default to Server Components.

Use Client Components only when needed for:

- browser APIs
- interactive state
- event handlers
- client-only libraries
- interactive maps
- charts
- real-time UI

Keep client components small.

Do not put an entire route behind `"use client"` merely because one section is interactive.

---

# 18. PERFORMANCE

Performance is part of the product experience.

Prefer:

- Server Components
- minimal client-side JavaScript
- small client boundaries
- efficient database queries
- indexes based on real queries
- pagination for large datasets
- selective data fetching
- no duplicate fetches
- no unnecessary polling
- no N+1 queries
- minimal global state

Use loading boundaries and suspense when they provide real user benefit.

Use dynamic imports only when they materially improve loading cost.

Do not build elaborate caching systems without evidence that they are needed.

### Performance review questions

- Does this page really need client rendering?
- Are we fetching data twice?
- Are we fetching fields nobody uses?
- Can one query replace several?
- Is there an obvious N+1 pattern?
- Is pagination needed?
- Did we add a dependency unnecessarily?

---

# 19. CODE MINIMALISM

Core rule:

> The smallest correct implementation wins.

Before adding code:

- Can existing code solve this?
- Can an existing shadcn component solve this?
- Can this stay server-side?
- Can one helper be reused?
- Can one query replace multiple queries?
- Is the abstraction really necessary?

Avoid:

- duplicate helpers
- duplicate API clients
- duplicate types
- duplicate validation schemas
- duplicate components
- speculative features
- unused props
- dead code
- excessive wrapper components
- premature architecture

Do not add code "just in case."

---

# 20. DEPENDENCY DISCIPLINE

Do not install npm packages casually.

Before installing a package, verify:

1. The project cannot already solve the need.
2. Existing Next.js/React/shadcn/Clerk/Supabase functionality is insufficient.
3. The dependency materially reduces complexity or risk.
4. It is compatible with the current project versions.
5. It does not duplicate an existing library's purpose.

Every dependency should earn its place.

---

# 21. CLERK AUTHENTICATION

Clerk owns identity and authentication.

Use Clerk for:

- sign in
- sign up
- session management
- identity
- authenticated user state

Follow the current Next.js integration pattern for the installed Clerk version.

For Next.js 16 projects, use the supported `proxy.ts` approach where required by the current Clerk integration.

Do not create both `middleware.ts` and `proxy.ts` for the same responsibility.

Never expose:

- Clerk secret keys
- private credentials
- server-only secrets

Never trust client-provided role values.

Authorization must be verified on the server and in database security policies.

---

# 22. SUPABASE ARCHITECTURE

Supabase provides:

- PostgreSQL
- Storage
- database access
- Row Level Security

Clerk remains the identity provider.

Do not create a second independent authentication system without an explicit architectural reason.

Use the supported Clerk + Supabase third-party authentication integration.

Use publishable/client-safe Supabase credentials in browser code only where appropriate.

Never expose service-role or secret credentials to browser code.

Protect user-facing data through RLS and server-side authorization.

---

# 23. DATABASE SECURITY

Use database integrity constraints where appropriate:

- foreign keys
- NOT NULL
- CHECK constraints
- UNIQUE constraints
- appropriate indexes
- created/updated timestamps
- auditability

RLS is mandatory for user-facing sensitive data.

Every policy should answer:

- Who can read?
- Who can insert?
- Who can update?
- Who can delete?
- Which exact rows can they access?

Test allowed and denied cases.

Never disable RLS just to make development easier.

---

# 24. INCIDENT DATA PRINCIPLES

A report may contain:

- report/reference number
- title
- description
- category
- severity/priority
- reporter identity
- barangay
- street/area
- landmark
- latitude
- longitude
- attachments
- department
- assignee
- status
- timestamps
- public updates
- internal updates where appropriate
- resolution information
- audit history

Do not collect personal information that is not needed for the reporting workflow.

Minimize sensitive data.

---

# 25. PRIVACY BY DESIGN

The product must include understandable public information about:

- Privacy
- Terms
- How We Collect / Data Collection
- Contact / Support

Privacy information should explain, where applicable:

- what data is collected
- why it is collected
- how it is used
- who can access it
- what may be visible to other users
- storage/security practices
- retention practices if defined
- user choices
- support/contact pathway

Do not invent legal compliance claims.

Do not claim a law, certification, or official compliance status unless it has been verified and approved by the appropriate authority.

When legal/policy text is incomplete, clearly leave it as content requiring owner/legal review instead of inventing definitive language.

---

# 26. DATA MINIMIZATION

Collect only information necessary for the service.

Prefer:

- report details
- relevant location
- optional attachments
- necessary identity/contact information
- timestamps
- operational metadata

Avoid unnecessary:

- unrelated personal data
- sensitive attributes
- silent tracking
- excessive device fingerprinting
- precise location without a clear purpose

Never collect data merely because it is technically easy.

---

# 27. FILE UPLOAD SECURITY

Treat attachments as untrusted input.

Validate:

- file size
- MIME type
- extension
- upload permission
- destination path
- access policy

Do not trust the user-controlled filename.

Do not make private objects public simply for convenience.

Avoid executable/dangerous file types unless there is a documented requirement.

Use controlled storage access for private evidence or internal files.

---

# 28. INPUT VALIDATION

Never trust:

- form data
- URL parameters
- query strings
- request bodies
- file metadata
- client-side roles
- hidden inputs
- client-generated IDs

Client-side validation improves UX.

Server-side validation protects correctness and security.

Use the project's existing validation strategy consistently.

Validate business rules as well as basic data types.

---

# 29. AUDITABILITY

Important operational/admin changes should be traceable.

Examples:

- assignment changes
- status changes
- severity/priority changes
- edits to report details
- archive/delete actions
- role changes
- department/category changes
- attachment changes
- administrative overrides

Audit records should capture who performed an action and when, plus useful context appropriate to the schema.

Do not expose internal audit information to residents unless explicitly designed for them.

---

# 30. ANTI-ABUSE

Consider protection against:

- spam submissions
- duplicate submissions
- abusive content
- repeated automated submissions
- excessive attachments
- fake/incorrect locations
- ID enumeration
- unauthorized state changes
- attachment abuse

Use proportional controls.

Do not build a massive anti-abuse system before there is a real requirement.

Prefer incremental, measurable protections.

---

# 31. RESIDENT VS STAFF UX

Resident UX must remain simple.

Residents should not need to understand:

- database concepts
- department routing internals
- audit metadata
- operational assignment logic
- internal terminology

Staff can see operational details such as:

- assignment
- queue
- priority
- internal notes
- audit history
- department operations

Use separate detail views or role-specific sections instead of exposing every internal field to everyone.

---

# 32. NOTIFICATIONS AND MESSAGING

Use calm, clear language.

Prefer:

- "Your report was submitted successfully."
- "Your report is currently under review."
- "Additional information is needed."
- "Your report has been assigned."
- "Your report has been resolved."

Avoid:

- alarmist language
- fake urgency
- unsupported guarantees
- raw technical error output

Error messages should answer:

1. What happened?
2. What can the user do next?

---

# 33. MAP AND LOCATION UX

Location is important but should remain understandable.

Support, where appropriate:

- barangay
- street/area
- landmark
- coordinates/map location

Do not require GPS when manual location is sufficient.

Explain location permission requests.

Do not silently collect precise location.

If precise location is optional, respect that choice.

---

# 34. FORMS

Forms should be forgiving and clear.

Requirements:

- visible labels
- concise help text
- inline errors
- keyboard usability
- loading/disabled submit state
- sensible defaults
- entered data preservation where reasonable
- clear success feedback

Long report forms should group information into understandable sections.

Do not ask residents to fill staff-only data.

---

# 35. TABLES AND DATA-DENSE SCREENS

Tables should not be database dumps.

Use:

- concise columns
- search where useful
- filters where useful
- sorting where useful
- pagination
- row actions
- detail view for secondary information

Do not put every database field into the main table.

---

# 36. STATUS DESIGN

Status must be understandable immediately.

Use a combination of:

- Badge
- concise label
- optional explanatory text
- icon only when it adds meaning

Do not rely on color alone.

Do not show internal status codes to ordinary residents.

---

# 37. ANIMATION

Motion should communicate state, not decorate the product.

Good uses:

- subtle page transitions
- menus/sheets/dialogs
- loading feedback
- state change feedback

Avoid:

- continuous animation
- large entrance animations
- excessive bouncing
- parallax
- animation that delays interaction

Respect reduced-motion preferences.

---

# 38. SEO AND PUBLIC INFORMATION

Public pages should have useful:

- title
- description
- headings
- metadata

Do not expose private report information to search engines.

Do not optimize private admin routes for public discovery.

---

# 39. ERROR HANDLING

Never expose:

- stack traces
- SQL errors
- secret values
- authorization headers
- internal configuration
- internal service details

Technical details belong in safe server-side logging.

User-facing errors should be understandable and actionable.

Distinguish between:

- validation failure
- authentication failure
- authorization failure
- not found
- temporary service failure

---

# 40. LOGGING

Logs should help debugging without leaking sensitive information.

Never log:

- passwords
- secret keys
- access tokens
- authorization headers
- unnecessary personal data

Use concise structured logs when appropriate.

---

# 41. GIT AND CHANGE DISCIPLINE

Make small, coherent changes.

Before editing:

1. Inspect the relevant implementation.
2. Identify reusable components/utilities.
3. Identify security implications.
4. Identify data flow.
5. Make the smallest correct change.
6. Validate.
7. Summarize the result.

Never overwrite large parts of the project for a small fix.

Never delete working code without understanding its purpose.

Never make unrelated changes while implementing a feature.

---

# 42. AGENT WORKFLOW

For every task follow this sequence.

## Phase A — Inspect

Inspect:

- route structure
- existing components
- shadcn components
- layout/providers
- auth integration
- data flow
- database access
- relevant environment variable names
- existing styles

Do not assume the project is empty.

## Phase B — Decide

Determine:

- simplest correct implementation
- existing components to reuse
- server vs client boundary
- authorization impact
- privacy impact
- database impact
- dependency impact
- mobile impact
- light/dark mode impact

## Phase C — Implement

Implement only what is required.

Prefer composition over duplication.

Follow existing conventions.

## Phase D — Review

Review the feature as:

- a resident
- an operational staff member
- an admin
- a UI/UX designer
- a security engineer
- a performance engineer

Look for clutter, permission gaps, inconsistencies, mobile problems, dark-mode problems, and unnecessary code.

## Phase E — Validate

Run relevant checks, normally including build/type/lint/tests where available.

Fix issues before declaring completion.

## Phase F — Report

Summarize:

- what changed
- why it changed
- affected files
- security implications
- checks run
- known remaining issues

Never claim success while knowing a critical issue remains.

---

# 43. DEFINITION OF DONE

A feature is complete only when:

### Functionality

- required behavior works
- important edge cases are considered
- failure paths behave intentionally

### UX

- next action is obvious
- no unnecessary steps
- loading state exists where needed
- empty state exists where needed
- error state is useful
- success feedback is clear

### UI

- shadcn-first
- existing design language preserved
- light mode works
- dark mode works
- responsive on mobile and desktop

### Accessibility

- keyboard usable
- labels present
- focus visible
- semantics reasonable
- color is not the only status signal

### Security

- server authorization reviewed
- RLS reviewed where applicable
- validation exists
- secrets remain protected
- sensitive data exposure reviewed

### Performance

- no unnecessary client boundary
- no obvious duplicate requests
- no unnecessary dependency
- no obvious N+1 query
- large lists use appropriate pagination/limits

### Quality

- no debug code
- no unnecessary console noise
- no unused imports
- no obvious dead code
- no unrelated changes

---

# 44. NON-NEGOTIABLE DO NOTS

Never:

- replace shadcn with another UI framework;
- create a second design system;
- rebuild shadcn primitives without a strong reason;
- ignore dark mode;
- ignore mobile UX;
- trust client-side roles;
- expose Clerk secrets;
- expose Supabase service/secret keys;
- disable RLS for convenience;
- create duplicate authentication systems casually;
- log secrets/tokens;
- collect unnecessary personal data;
- invent legal/compliance claims;
- invent government partnerships;
- invent statistics;
- promise unsupported response times;
- build a dashboard full of unnecessary cards;
- add dependencies casually;
- introduce speculative abstractions;
- leave debug code in production paths;
- rewrite unrelated files;
- present placeholder behavior as production-ready.

---

# 45. PRODUCT PERSONALITY

Butuan Report should feel like a civic service, not a generic SaaS template.

Target personality:

- calm
- trustworthy
- practical
- local
- modern
- professional
- human

Avoid:

- flashy
- game-like
- aggressive
- overly corporate
- overly technical
- cluttered

A resident should understand what to do within seconds.

---

# 46. FINAL REVIEW QUESTIONS

Before declaring a change complete, ask:

### UX
- Is this easy for a normal resident?
- Is the next action obvious?
- Is anything unnecessary?

### UI
- Did we reuse shadcn?
- Does it match the existing theme?
- Does light mode work?
- Does dark mode work?
- Does it work on mobile?

### Security
- What happens if a malicious user modifies the request manually?
- Is server authorization enforced?
- Is RLS correct?
- Are secrets protected?

### Performance
- Does this need client-side JavaScript?
- Are requests duplicated?
- Are we fetching more data than necessary?
- Did we add a dependency we do not need?

### Accessibility
- Can keyboard users operate it?
- Are labels and errors clear?
- Does the interface make sense without relying only on color?

### Privacy
- Are we collecting only what is necessary?
- Does the user understand what data is collected and why?

### Maintainability
- Did we reuse existing code?
- Did we avoid unnecessary abstraction?
- Did we change only what was needed?

The desired result is:

> **the smallest secure, accessible, consistent, maintainable, optimized, and user-friendly implementation that fully solves the requirement.**

---

# 47. AGENT HANDOFF RULE

When Claude, Gemini, Antigravity, Codex, or another coding agent starts a task in this project:

1. Read this `SKILL.md` before editing.
2. Inspect the current implementation before proposing rewrites.
3. Follow the existing stack and shadcn design system.
4. Reuse before creating.
5. Secure before exposing.
6. Validate before declaring complete.
7. Keep changes minimal and focused.

This skill is the project-level contract for consistent implementation across agents.
