# Work Order System

## Overview
This project is a work order management system for a building with about 90 units. The goal is to let tenants submit maintenance requests, let the super manage and close those requests, and automatically notify the right people throughout the process.

For v1, a Vercel-first stack is a good fit. The app should run on Vercel, with managed services added for database, file storage, email, and emergency communication.

## Recommended Stack
- Next.js on Vercel for the web app and server routes
- Postgres with Supabase or Neon for the database
- Vercel Blob or Supabase Storage for photo uploads
- Resend for email notifications
- Twilio for emergency SMS and voice calls
- Server-side PDF generation for closeout reports

## MVP Goal
Build the smallest version of the product that can reliably support this workflow:

1. A tenant submits a maintenance request with details and optional photos.
2. The system stores the request and emails the super.
3. Emergency requests also trigger a Twilio text and automated call.
4. The super signs in, reviews the request, performs the repair, and submits a closeout form.
5. The system generates a repair report and emails it to the tenant.

## MVP Roadmap

### Phase 1: Setup and Foundation
Build the project skeleton and core infrastructure first.

Deliverables:
- Create a Next.js app using the App Router
- Deploy the app to Vercel
- Set up Postgres
- Set up file storage for request and closeout photos
- Add environment variable handling for database, storage, email, and Twilio
- Create the initial database schema

Core tables:
- `users`
- `units`
- `work_orders`
- `work_order_photos`
- `work_order_events`
- `reports`

Success criteria:
- App runs locally and on Vercel
- Database connection works
- Photos can be uploaded to storage
- Basic schema migrations are in place

### Phase 2: Tenant Intake
Build the tenant-facing request flow.

Deliverables:
- Public maintenance request form
- Fields for unit, tenant name, email, phone, category, description, and emergency flag
- Support for photo uploads
- Server-side request creation
- Confirmation page after submission

Behavior:
- Every submitted request creates a `work_order`
- Intake photos are stored and linked to the request
- A timeline event is created for submission

Success criteria:
- A tenant can submit a normal request from start to finish
- Photos are attached correctly
- Submission data is saved correctly

### Phase 3: Staff Dashboard
Build the authenticated building staff side.

Deliverables:
- Harden the tenant intake completion flow so a successful submit does not leave the form populated and easy to resubmit accidentally
- Add duplicate-submission protection for tenant requests, ideally by redirecting or resetting after success and guarding the backend against double-submit behavior
- Add a bootstrap path for the initial staff users
- Staff sign-in
- Initial roles for `super` and `backup`
- Dashboard showing open and recently closed work orders
- Basic dashboard filtering for operational review
- Request detail page with photos, tenant info, status, and timeline
- Internal staff-only notes on work orders
- Ability to assign work orders to staff
- Ability to change status

Recommended statuses:
- `new`
- `in_progress`
- `waiting_on_parts`
- `closed`

Behavior:
- After a tenant request is submitted successfully, the UI should not encourage a second identical submission from the same filled-out form state
- Duplicate form submissions should be prevented both in the frontend flow and in the backend handling
- Staff users can view and manage all requests
- Internal notes must remain visible only to staff
- Access to staff pages is blocked for non-staff users
- Status changes create timeline events

Success criteria:
- A successfully submitted tenant request does not remain in a ready-to-resubmit state
- A double click or repeated submit action does not create duplicate work orders unintentionally
- Staff can log in and manage requests
- Request details are easy to review
- Staff can assign work orders and add internal notes safely
- Status updates are saved and visible

### Phase 4: Closeout Workflow
Build the repair completion flow for the super.

Deliverables:
- Closeout form for staff
- Required repair summary field
- Optional material or note fields
- Closeout photo uploads
- Request completion timestamp

Behavior:
- Only staff can close a request
- Closing a request stores notes, photos, and completion metadata
- Closeout actions create timeline events

Success criteria:
- Staff can close a request with notes and photos
- Closed requests are removed from the open queue
- Completion data is saved correctly

### Phase 5: Repair Report and Tenant Completion Email
Generate the final output sent to the tenant.

Deliverables:
- PDF repair report generation
- Completion email template
- Report storage and metadata tracking

Report contents:
- Tenant and unit information
- Original request details
- Emergency flag
- Repair summary
- Closeout date
- Closeout photos

Behavior:
- Closing a request generates a report
- The tenant receives a completion email with the report attached or linked

Success criteria:
- Report generation works reliably
- Tenant receives the closeout email
- Report content matches the closed request

### Phase 6: Tenant Portal
Add tenant-side visibility after the core workflow is stable.

Deliverables:
- Tenant access flow
- Tenant request history page
- Request detail page showing current status and final report

Recommended v1 access model:
- Passwordless email-based access

Behavior:
- Tenants can view only their own requests
- Tenants can see request status and completed reports

Success criteria:
- Tenant can sign in or access their request history securely
- Tenant cannot view another tenant's requests

### Phase 7: Notifications and Emergency Routing
Add the super notification flow.

Deliverables:
- Email notification to the super for every new request
- Confirmation email to the tenant
- Emergency rules based on tenant checkbox plus selected request categories
- Twilio SMS for emergency requests
- Twilio voice call for emergency requests
- Basic delivery logging in the database

Behavior:
- Non-emergency requests send email only
- Emergency requests send email, SMS, and voice call
- Failed notification attempts are logged for later review

Recommended emergency categories:
- Major leak
- No heat
- No electricity
- Flooding
- Broken entry door or building access issue

Success criteria:
- Normal requests notify the super by email
- Tenant receives a confirmation email
- Emergency requests trigger all escalation channels
- Notification failures do not break request creation

## Suggested Data Model

### `users`
Stores staff users and any tenant access records needed for the portal.

### `units`
Stores unit identifiers for the building.

### `work_orders`
Stores request details, status, emergency flag, assigned staff, and timestamps.

### `work_order_photos`
Stores intake and closeout photo metadata and file locations.

### `work_order_events`
Stores a timeline of request events such as submission, escalation, status updates, and closeout.

### `reports`
Stores generated PDF report metadata and delivery status.

## Key Product Rules
- A request can be submitted without tenant login
- Tenant photo uploads are optional
- Every request sends an email to the super
- Emergency requests also send SMS and voice notifications
- Only staff users can update or close a request
- A closed request must include a repair summary
- A closeout should generate a tenant-facing completion report

## Testing Checklist
- Tenant submits a standard request successfully
- Tenant submits a request with photos successfully
- Emergency request triggers email, SMS, and voice call
- Notification failure is logged without losing the request
- Staff user can sign in and view open work orders
- Staff user can update status and close a request
- Closeout photos upload correctly
- PDF report generates correctly
- Tenant receives the final completion email
- Tenant portal only shows the tenant's own requests

## Recommended Build Order
If building this in the fastest practical order, follow this sequence:

1. Setup and foundation
2. Tenant intake
3. Staff dashboard
4. Closeout workflow
5. PDF report generation
6. Tenant portal
7. Email notifications
8. Emergency Twilio escalation

## Assumptions for V1
- The building has about 90 units, so the system does not need heavy enterprise complexity
- Initial staff roles are `super` and `backup`
- Tenant authentication should stay lightweight in v1
- Photos should be resized for app and report use
- Billing, contractor management, and advanced dispatching are out of scope for v1

## Hosting Recommendation
Vercel is a good choice for this project as long as it is paired with managed services for the pieces it does not handle directly. For this app, the best v1 approach is:

- Vercel for the application
- Postgres for data
- Managed storage for images
- Resend for email
- Twilio for emergency communication

That gives you a clean, modern stack without overbuilding the first version.
