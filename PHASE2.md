# Phase 2

## Checklist
- [ ] Design the tenant request form layout
- [ ] Add form fields for:
  - [ ] unit
  - [ ] tenant name
  - [ ] email
  - [ ] phone
  - [ ] category
  - [ ] description
  - [ ] emergency flag
- [ ] Add form validation
- [ ] Add photo upload support
- [ ] Upload intake photos to Supabase Storage
- [ ] Insert a new work order into Supabase
- [ ] Insert a `submitted` event into `work_order_events`
- [ ] Add a confirmation page or success state
- [ ] Verify submitted data appears correctly in Supabase
- [ ] Test normal request submission end to end

## Implementation Plan

### 1. Form foundation
- Replace the placeholder `/submit-request` page with a real tenant request form
- Keep the form server-backed and simple
- Start with a single-page flow

### 2. Required fields
- unit
- tenant name
- email
- phone
- category
- description
- emergency flag
- photos

### 3. Validation
- Validate all required text fields
- Validate email format
- Make phone optional unless you want it required
- Restrict photo file types to supported image formats
- Enforce a reasonable upload size limit

### 4. Storage flow
- Upload intake photos to the Supabase `work-order-photos` bucket
- Store them under an `intake/` path
- Save file metadata in `work_order_photos`

### 5. Database flow
- Insert a new row into `work_orders`
- Link the selected unit
- Store tenant contact details and request details
- Mark `is_emergency` from the form input
- Default the status to `new`

### 6. Timeline flow
- Insert a `submitted` event into `work_order_events`
- Link it to the new work order

### 7. Confirmation UX
- Redirect to a simple confirmation page after successful submission
- Show a clear success message and basic next-step text

### 8. Testing
- Submit with no photos
- Submit with photos
- Submit with emergency checked
- Verify work order row is created
- Verify photo metadata rows are created
- Verify `submitted` event is created
- Verify invalid form input is rejected
