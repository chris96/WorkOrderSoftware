# Phase 3

## Checklist
- [x] Harden the tenant intake completion flow so a successful submit does not leave the form populated and easy to resubmit accidentally
  - Satisfied by replacing the inline post-submit state with a dedicated confirmation page and using redirect behavior that removes the filled form from the immediate success path.
- [x] Add duplicate-submission protection for tenant requests in both the frontend flow and backend handling
  - Satisfied by disabling repeated submits while the request is in flight and by checking for a recent identical submission before creating a new work order.
- [x] Add a bootstrap path for creating the initial staff users
  - Satisfied by the protected `/staff/bootstrap` flow, which creates the initial staff auth user in Supabase Auth and mirrors that user into the app's `users` table.
- [x] Add staff sign-in
  - Satisfied by the `/staff/sign-in` flow using Supabase Auth sessions with sign-out support and protected staff route access.
- [x] Add initial roles for:
  - [x] super
  - [x] backup
  - Satisfied by bootstrap role selection and staff-role checks against the `users` table.
- [x] Build the staff dashboard for open and recently closed work orders
  - Satisfied by the protected `/staff` dashboard showing live open and recently closed work orders from Supabase.
- [x] Add basic dashboard filtering for:
  - [x] status
  - [x] open vs closed
  - [x] emergency vs non-emergency
  - Satisfied by the `/staff` filter controls that narrow the dashboard by state, status, and emergency flag.
- [x] Build a request detail page with:
  - [x] photos
  - [x] tenant info
  - [x] status
  - [x] timeline
  - Satisfied by `/staff/work-orders/[id]`, which now shows tenant contact details, request summary, intake photo links, current status, and the full event history.
- [x] internal staff-only notes
  - Satisfied by the detail-page internal note form and staff-only note history sourced from `work_order_events`.
- [x] Add ability to change status
  - Satisfied by the detail-page status controls and secure staff update endpoint.
- [x] Add work order assignment for:
  - [x] super
  - [x] backup
  - Satisfied by the detail-page assignment controls, which can assign the request to active `super` or `backup` users only.
- [x] Add clear empty states for the dashboard and request detail views
  - Satisfied for the dashboard view by the new empty states on the open and recently closed sections. Request-detail empty-state handling is still pending with the detail page itself.
- [x] Verify staff-only access protection
  - Satisfied by protecting `/staff` with route-level session checks and a server-side staff-user requirement before rendering the portal.
- [x] Verify internal notes are visible only to staff
  - Verified by implementation review: internal notes are created only through staff-authenticated routes and rendered only on the protected `/staff/work-orders/[id]` detail page.
- [x] Verify status changes create timeline events
  - Verified by implementation review: status updates insert `status_changed` events into `work_order_events` with `from_status` and `to_status` metadata.
- [x] Verify assignment changes are saved correctly
  - Verified by implementation review: assignment changes update `assigned_user_id` on the work order and create a staff-only assignment event in `work_order_events`.
- [x] Test duplicate-submit prevention after a successful tenant request
  - Satisfied by manual verification of the hardened submit flow and backend duplicate detection behavior.
- [ ] Test staff dashboard flow end to end
  - Still pending a live signed-in verification pass through the deployed staff portal.

## Implementation Plan

### 1. Tenant submission hardening
- Replace the current inline post-submit state with a safer completion flow
- Prevent the form from remaining in a ready-to-resubmit state after success
- Prefer redirecting to a confirmation page or resetting the form after success
- Disable repeated submit actions while a request is in flight
- Add backend safeguards so repeated clicks or retries do not create duplicate work orders unintentionally

### 2. Staff authentication foundation
- Add a bootstrap path for creating the initial `super` and `backup` users
- Add sign-in for staff users only
- Support the initial staff roles defined in the roadmap:
  - `super`
  - `backup`
- Keep tenant access out of this phase except for protecting staff routes

### 3. Staff dashboard overview
- Create a dashboard that surfaces:
  - open work orders
  - recently closed work orders
- Make the initial view simple and operations-focused
- Add basic filters so staff can quickly narrow requests by status, open/closed state, and emergency flag
- Add clear empty states when there are no matching work orders
- Use the recommended statuses:
  - `new`
  - `in_progress`
  - `waiting_on_parts`
  - `closed`

### 4. Request detail page
- Build a work order detail view for staff
- Include:
  - tenant contact information
  - maintenance category and description
  - intake photos
  - current status
  - timeline events
- Include an internal staff-only notes area on the work order so staff can record private operating context that is never shown to tenants

### 5. Status management
- Allow staff to change the status of a work order
- Allow staff to assign a work order to the `super` or `backup`
- Allow staff to add internal notes to the work order
- Record every status change in `work_order_events`
- Decide whether internal notes should live in `work_order_events`, a dedicated notes table, or request metadata, and keep them staff-only
- Keep the interaction simple and clear for the super/backup workflow

### 6. Access control
- Block non-staff users from staff pages
- Ensure only authorized staff can update work orders
- Ensure internal notes are never exposed in tenant-facing flows
- Preserve the current tenant intake flow without requiring tenant login

### 7. Testing
- Submit a request successfully and confirm the form cannot be accidentally resubmitted immediately
- Verify duplicate submits do not create duplicate work orders
- Verify the initial staff users can be created and can sign in
- Verify staff can sign in
- Verify staff can view open and closed work orders
- Verify dashboard filters behave correctly
- Verify empty states render correctly
- Verify a work order detail page shows the expected request data and photos
- Verify internal notes can be created and viewed by staff only
- Verify status updates are saved and timeline events are created
- Verify assignment updates are saved correctly
- Verify unauthorized users cannot access staff routes
