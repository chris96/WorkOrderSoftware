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
- [ ] Add a completion email template for tenants
- [ ] Send the completion email after a report is generated
- [ ] Include the report as an attachment or secure link in the tenant email
- [ ] Prevent report/email failures from breaking the closeout workflow
- [ ] Allow staff to review report generation status
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
- Keep this data shape reusable for both PDF generation and email content

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
  - timestamps
- Make it possible to regenerate or resend later without losing the original record

### 5. Tenant completion email
- Build a completion email template
- Include a concise summary of the completed repair
- Include the report as:
  - an attachment, or
  - a secure link to the report
- Keep the email wording simple, clear, and professional

### 6. Delivery and failure handling
- Do not let a report-generation or email failure undo the closeout itself
- Track report and delivery failures in `reports`
- Surface a clear status so staff can see whether:
  - the report was generated
  - the email was sent
  - a resend or retry is needed
- Keep retries possible without generating duplicate records unnecessarily

### 7. Staff visibility
- Show report-generation status on the staff side
- Show whether the completion email was sent successfully
- Make it easy for staff to understand whether a closed request still needs follow-up because delivery failed
- Keep this lightweight for v1

### 8. Access and security
- Keep report generation server-side
- Ensure tenant-facing links are secure if using linked delivery instead of attachments
- Avoid exposing internal staff-only notes in the tenant report unless intentionally allowed
- Include only tenant-appropriate content in the final report and email

### 9. Testing
- Generate a report for a closed work order with no closeout photos
- Generate a report for a closed work order with closeout photos
- Verify the report includes the expected tenant, unit, request, and repair data
- Verify the report file is stored correctly
- Verify the `reports` row is created or updated correctly
- Verify the completion email is sent after report generation
- Verify the email includes the report attachment or link
- Verify a report-generation failure does not reopen or break the closed work order
- Verify an email delivery failure is recorded without losing the report
- Verify duplicate generation attempts do not create inconsistent report records
- Verify the end-to-end closed-request-to-report flow works reliably
