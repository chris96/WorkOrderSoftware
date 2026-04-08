# Phase 5

## Checklist
- [ ] Add repair report generation for closed work orders
- [ ] Build a report payload that includes:
  - [ ] tenant information
  - [ ] unit information
  - [ ] original request details
  - [ ] emergency flag
  - [ ] repair summary
  - [ ] closeout date
  - [ ] closeout photos
- [ ] Generate a PDF repair report
- [ ] Store the generated report file
- [ ] Save report metadata in `reports`
- [ ] Track report generation and delivery timestamps
- [ ] Add a completion email template for tenants
- [ ] Send the completion email after a report is generated
- [ ] Include the report as a secure link in the tenant email
- [ ] Prevent report/email failures from breaking the closeout workflow
- [ ] Allow staff to review report generation status
- [ ] Allow staff to open the generated report from the staff workflow
- [ ] Allow staff to regenerate the report if needed
- [ ] Allow staff to resend the completion email if needed
- [ ] Harden the closeout success experience so staff do not remain on a filled closeout form after a successful close
- [ ] Reduce unnecessary Supabase usage on public routes by caching stable reference data such as the tenant unit list
- [ ] Keep internal staff-only notes out of the tenant-facing report and email
- [ ] Verify report content matches the closed work order
- [ ] Verify the completion email is delivered successfully
- [ ] Test the Phase 5 flow end to end

## Implementation Plan

### 1. Report generation trigger
- Decide when report generation should happen for v1
- Recommended first approach:
  - trigger report generation after a successful closeout
  - keep the closeout itself reliable even if report generation fails
- Make report generation idempotent so the same closed work order does not create duplicate reports unexpectedly
- Improve the post-closeout UX so a successful close does not leave staff staring at a filled form state
- Recommended first approach:
  - clear the closeout form immediately after success, or
  - redirect to a dedicated closeout success/confirmation view similar to the tenant intake flow

### 2. Report data assembly
- Build a shared report payload from the closed work order
- Include:
  - tenant name, email, and phone when available
  - unit number
  - request category and description
  - emergency flag
  - intake timestamps and closeout timestamp
  - repair summary
  - materials used when provided
  - closeout photos
- Decide explicitly whether the closing staff user appears in the v1 report
- Keep this data shape reusable for both PDF generation and email content
- Exclude internal staff-only notes from the tenant-facing payload entirely

### 3. PDF generation
- Generate a tenant-facing PDF repair report
- Keep the layout clear and practical rather than overly decorative
- Ensure the PDF can render:
  - request header information
  - original issue details
  - repair summary
  - closeout date
  - closeout photos
- Prefer a server-side generation path that works reliably on Vercel

### 4. Report storage and metadata
- Store the generated PDF in managed storage
- Save a row in `reports` with:
  - `work_order_id`
  - storage location
  - delivery status
  - generated timestamp
  - sent timestamp when applicable
  - timestamps
- Define the v1 regeneration rule:
  - overwrite the canonical report file for the work order, or
  - keep a new version and update metadata
- Make it possible to regenerate or resend later without losing the original record

### 5. Tenant completion email
- Build a completion email template
- Include a concise summary of the completed repair
- Use a secure report link for v1 delivery
- Keep the email wording simple, clear, and professional
- Add the required email provider setup and env vars for delivery

### 6. Delivery and failure handling
- Do not let a report-generation or email failure undo the closeout itself
- Track report and delivery failures in `reports`
- Surface a clear status so staff can see whether:
  - the report was generated
  - the email was sent
  - a resend or retry is needed
- Keep retries possible without generating duplicate records unnecessarily
- Define fallback behavior if report generation cannot fetch one or more closeout photos cleanly
- Reduce avoidable background Supabase usage where possible, especially on public routes that currently query stable data on every request

### 7. Staff visibility
- Show report-generation status on the staff side
- Show whether the completion email was sent successfully
- Make it easy for staff to understand whether a closed request still needs follow-up because delivery failed
- Let staff open the generated report for review
- Let staff regenerate or resend from the staff workflow
- Ensure the closeout success state is visually clear and does not feel like the same closeout can be submitted again
- Keep this lightweight for v1

### 8. Access and security
- Keep report generation server-side
- Ensure tenant-facing report links are secure
- Avoid exposing internal staff-only notes in the tenant report unless intentionally allowed
- Include only tenant-appropriate content in the final report and email

### 9. Performance and usage control
- Cache stable public reference data such as the unit list used by `/submit-request`
- Avoid unnecessary database queries on public pages when the underlying data changes infrequently
- Treat Supabase usage control as part of production hardening for this phase because the app is now live on the public internet

### 10. Testing
- Generate a report for a closed work order with no closeout photos
- Generate a report for a closed work order with closeout photos
- Verify the report includes the expected tenant, unit, request, and repair data
- Verify the report file is stored correctly
- Verify the `reports` row is created or updated correctly
- Verify the completion email is sent after report generation
- Verify the email includes the secure report link
- Verify a report-generation failure does not reopen or break the closed work order
- Verify an email delivery failure is recorded without losing the report
- Verify duplicate generation attempts do not create inconsistent report records
- Verify staff can open the generated report from the staff side
- Verify staff can regenerate the report and resend the completion email
- Verify cached public reference data still updates correctly when intentionally changed
- Verify the closeout success experience clears the form or redirects away from the filled form state
- Verify internal staff-only notes do not appear in the report or email
- Verify the end-to-end closed-request-to-report flow works reliably
