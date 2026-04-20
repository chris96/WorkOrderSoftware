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

## Execution Roadmap

### Phase goal
- Phase 6 is about tenant visibility, not new request creation or staff operations
- At the end of this phase, a tenant should be able to:
  - securely access the portal
  - see only their own requests
  - open a request detail page
  - see current status and key timestamps
  - open the final report when the request is closed and a report exists
- The four core workstreams for this phase are:
  - authentication
  - authorization
  - tenant UI
  - secure report access
- The highest-risk part of the phase is ownership enforcement, not visual UI work

### Current starting point
- Staff auth already exists with Supabase Auth
- Work orders already store `tenant_email`
- Reports already exist and are stored privately
- The tenant area is still a placeholder and has not been implemented yet
- The fastest v1 path is:
  - Supabase magic-link auth for tenants
  - ownership based on `work_orders.tenant_email`
  - server-side access enforcement for tenant pages and report links

### Recommended execution order

#### Step 1. Lock the access model
- Finalize the v1 identity rule before building pages
- Recommended decision:
  - tenant identity = Supabase Auth user email
  - tenant ownership = `work_orders.tenant_email === authenticated user email`
- This should be first because it:
  - avoids overbuilding a tenant profile system
  - reuses the existing schema
  - gives every later page a clear security rule
- Deliverables:
  - tenant auth helper
  - tenant session helper
  - server-side ownership helper for work orders

#### Step 2. Build the tenant auth flow
- This is the first user-facing implementation step
- Recommended routes:
  - `/tenant`
  - `/tenant/sign-in`
  - `/tenant/requests`
  - `/tenant/requests/[id]`
- Recommended v1 flow:
  - `/tenant` acts as a lightweight landing page
  - tenant enters email on `/tenant/sign-in`
  - the app sends a magic link through Supabase Auth
  - successful auth redirects into `/tenant/requests`
- Include:
  - expired-link state
  - invalid-link state
  - sign-out action
- Keep this step narrow and avoid building a full account system

#### Step 3. Add server-side tenant authorization
- This is the main security checkpoint for the phase
- Required guards:
  - authenticated tenant required for `/tenant/requests`
  - authenticated tenant required for `/tenant/requests/[id]`
  - server-side ownership check on every request detail fetch
  - server-side ownership check on every report access path
- Important rules:
  - do not rely on UI filtering alone
  - do not trust route params alone
  - every detail page and report route must independently verify ownership
- For this phase, explicit server-side ownership checks are the recommended v1 path

#### Step 4. Build the tenant request history page
- Once auth and ownership rules exist, build the first real portal page
- Show:
  - category
  - submitted date
  - current status
  - emergency badge when applicable
  - whether a final report is available
- Recommended behavior:
  - newest first
  - mobile-friendly cards or a simple list
  - clear empty state when no requests exist
- Do not expose:
  - internal notes
  - assignment data
  - staff-only event metadata
  - raw storage paths

#### Step 5. Build the tenant request detail page
- This is the second main tenant portal page
- Show:
  - category
  - description
  - submitted timestamp
  - current status
  - closed timestamp when present
  - final report availability
- Recommended v1 scope:
  - no editing
  - no commenting
  - no direct photo gallery unless it becomes necessary
  - prioritize visibility and clarity first
- This page should use a tenant-safe data shape rather than reusing the staff detail page directly

#### Step 6. Add secure tenant report access
- Reuse the `reports` records created in Phase 5
- Recommended implementation:
  - create a tenant-only report route or server action
  - verify the authenticated tenant owns the work order
  - create a signed URL only after ownership passes
  - redirect or return the signed URL safely
- Do not:
  - expose `storage_bucket` and `storage_path` directly to the browser
  - allow report access by guessed work-order IDs

#### Step 7. Add session polish and empty states
- After the main flow works, close the UX gaps
- Add:
  - signed-in state indicator
  - sign-out action
  - no-requests state
  - no-report-yet state
  - invalid or expired access-link state
- This work is lower risk than auth and authorization and should come later in the phase

#### Step 8. Run security-focused validation
- Before calling Phase 6 complete, verify the actual failure modes
- Must-test cases:
  - tenant can sign in with a magic link
  - tenant sees only requests matching their email
  - tenant cannot access another tenant request by changing the URL
  - tenant cannot access another tenant report
  - closed request with report opens correctly
  - closed request without report shows a clean state
  - invalid or expired link fails cleanly
- Phase 6 should only be considered complete once the unauthorized-access cases are verified

### Most efficient build breakdown
- The shortest clean path for implementation is:
  1. tenant auth helper plus tenant session helper
  2. `/tenant/sign-in` page and send-magic-link route or action
  3. `/tenant/requests` with server-side email ownership filtering
  4. `/tenant/requests/[id]` with server-side ownership validation
  5. tenant report access route with signed URL generation
  6. sign-out plus empty and error states
  7. manual security and UX verification
- This order keeps dependencies clean and avoids building UI before the access model is defined

### Recommended technical decisions for v1
- Auth provider: Supabase Auth magic links
- Identity key: authenticated email
- Ownership rule: `tenant_email` match
- Portal reads: server-side only
- Report access: server-generated signed URL
- Tenant records in `users`: not required yet
- Tenant profile table: defer unless needed later

### Out of scope for this phase
- Tenant editing of requests
- Tenant messaging with staff
- Tenant upload changes after submission
- Notification system work
- Emergency routing work
- Advanced tenant profile management
- Photo galleries unless they prove necessary

### Suggested milestone plan

#### Milestone 1. Access foundation
- tenant auth helper
- magic-link sign-in page
- redirect and session flow

#### Milestone 2. Tenant portal core
- request history page
- request detail page
- tenant-safe data queries

#### Milestone 3. Report access
- secure report route
- signed URL generation
- ownership enforcement

#### Milestone 4. Hardening
- sign-out
- invalid and expired-link UX
- empty states
- manual authorization tests

### Best next implementation step
- The best first coding step is:
  - build the tenant auth and session helper plus the `/tenant/sign-in` flow
- Reason:
  - every other Phase 6 feature depends on tenant identity
  - it gives the phase the ownership primitive needed for secure filtering
  - it prevents the rest of the portal from being built on assumptions
