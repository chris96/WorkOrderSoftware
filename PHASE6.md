# Phase 6

## Checklist
- [ ] Add a tenant access flow
- [ ] Use a lightweight passwordless email-based access model for v1
- [ ] Let tenants access only their own requests
- [ ] Add a tenant request history page
- [ ] Add a tenant request detail page
- [ ] Show current request status in the tenant portal
- [ ] Show final repair reports for completed requests
- [ ] Reuse existing work order and report data without exposing staff-only fields
- [ ] Prevent tenant access to other tenants' requests
- [ ] Keep tenant portal links and access tokens secure
- [ ] Handle expired or invalid tenant access links cleanly
- [ ] Give tenants a clear signed-in or active-session state
- [ ] Add tenant-side empty states for no requests and no completed reports
- [ ] Keep the tenant portal mobile-friendly and simple to use
- [ ] Verify a tenant can access their request history securely
- [ ] Verify a tenant cannot access another tenant's requests
- [ ] Verify completed requests can expose the final report correctly
- [ ] Test the Phase 6 flow end to end

## Implementation Plan

### 1. Tenant access model
- Use a passwordless email-based access flow for v1
- Recommended first approach:
  - tenant enters their email address
  - system sends a one-time magic link through Supabase Auth
  - tenant lands in the tenant portal already authenticated
- Keep the access model lightweight and avoid introducing passwords unless Phase 6 proves it is necessary
- Use the tenant's email address already stored on work orders as the identity anchor

### 2. Data access and authorization
- Ensure tenants can only read records tied to their own email or tenant identity
- Decide how tenant identity should map to the existing schema
- Recommended v1 approach:
  - authenticate the tenant by email
  - match access to work orders where `tenant_email` matches the authenticated user email
- Keep staff-only information out of tenant queries and tenant UI
- Do not expose:
  - internal notes
  - assignment data unless intentionally desired later
  - staff-only event metadata
  - any private storage paths or internal error details

### 3. Tenant portal structure
- Build a tenant landing/sign-in page
- Build a tenant request history page
- Build a tenant request detail page
- Recommended initial route structure:
  - `/tenant`
  - `/tenant/sign-in`
  - `/tenant/requests`
  - `/tenant/requests/[id]`
- Keep the tenant UI simpler than the staff portal
- Optimize for:
  - current status visibility
  - easy report access
  - clarity on what is in progress vs completed

### 4. Tenant request history
- Show all requests associated with the authenticated tenant email
- Include practical summary fields:
  - request category
  - submitted date
  - current status
  - emergency flag when applicable
  - whether a final report is available
- Sort newest first by default
- Provide a clean empty state if the tenant has no requests yet

### 5. Tenant request detail
- Show the original request details
- Show current status
- Show submitted timestamp
- Show closed timestamp when applicable
- Show a final report link when the request is closed and the report exists
- Decide whether tenant-facing photo visibility is needed in v1
- Recommended v1 approach:
  - do not expose intake or closeout photos directly unless needed
  - prioritize status and final report access first

### 6. Report access
- Reuse the report records created in Phase 5
- Provide tenants a secure way to access their own final report
- Recommended first approach:
  - tenant portal requests a server-generated signed URL for the report
  - the app verifies tenant ownership before generating access
- Avoid exposing raw storage paths to the browser
- Ensure a tenant cannot retrieve a report for another tenant's work order

### 7. Session and UX handling
- Make tenant sign-in and session state obvious
- Add a sign-out action
- Handle expired or invalid magic links gracefully
- Show friendly states for:
  - no requests found
  - request exists but no report yet
  - invalid or expired access
- Keep the tone practical and low-friction

### 8. Security and authorization hardening
- Keep tenant access checks server-side
- Add route protection for authenticated tenant pages
- Verify that direct URL access to `/tenant/requests/[id]` still enforces tenant ownership
- Ensure tenant access does not depend only on hidden client-side state
- If needed, add Row Level Security policies or explicit server-side ownership checks for portal reads

### 9. Data model and technical decisions
- Decide whether the existing `users` table needs tenant records for v1
- Recommended first approach:
  - do not require full tenant records in `users`
  - use Supabase Auth users plus email-based ownership checks against `work_orders.tenant_email`
- Only introduce a dedicated tenant profile table if Phase 6 reveals a real need for it
- Reuse the existing `reports` table for final report discovery and access

### 10. Testing
- Tenant can request a magic link successfully
- Tenant can sign in successfully with a valid link
- Tenant can view only work orders tied to their own email
- Tenant cannot view another tenant's work order by editing the URL
- Tenant can see open and closed statuses correctly
- Tenant can open a final report for a completed request
- Tenant sees a clear message when a completed request has no report yet
- Invalid or expired tenant links fail cleanly
- Tenant sign-out works correctly
- End-to-end tenant access flow works on desktop and mobile

## Assumptions
- Phase 5 is complete and report generation is already available
- Tenant access should stay lightweight and avoid password management in v1
- Existing work orders already store the tenant email needed for identity matching
- The tenant portal should focus on visibility, not request editing, in this phase
- Notifications and emergency routing remain out of scope until the later roadmap phase
