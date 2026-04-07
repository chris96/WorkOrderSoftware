# Phase 2

## Checklist
- [x] Design the tenant request form layout
- [x] Add form fields for:
  - [x] unit
  - [x] tenant name
  - [x] email
  - [x] phone
  - [x] category
  - [x] description
  - [x] emergency flag
- [x] Add form validation
- [x] Add photo upload support
- [x] Upload intake photos to Supabase Storage
- [ ] Insert a new work order into Supabase
- [ ] Insert a `submitted` event into `work_order_events`
- [ ] Add a confirmation page or success state
- [ ] Verify submitted data appears correctly in Supabase
- [ ] Test normal request submission end to end

## Implementation Plan

### 1. Form foundation
- Build the real `/submit-request` tenant request flow on top of the existing page
- Keep the form server-backed and simple
- Start with a single-page flow

### 2. Required fields
- unit selection backed by the `units` table
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
- Validate the selected unit on the server and resolve it to `units.id`
- Restrict photo file types to supported image formats
- Enforce a reasonable upload size limit

### 4. Storage flow
- Create the `work_orders` row first so uploads can be linked safely
- Upload intake photos to the Supabase `work-order-photos` bucket
- Store them under an `intake/` path
- Save file metadata in `work_order_photos` using the new `work_order_id`
- If any upload or metadata insert fails, clean up the uploaded files and do not leave orphaned storage objects

### 5. Database flow
- Look up the selected unit in `units` and use its `id`
- Insert a new row into `work_orders`
- Link the selected `unit_id`
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
- Verify invalid or missing unit selection is rejected
- Verify work order row is created
- Verify photo metadata rows are created
- Verify no orphaned intake uploads remain after a failed submission path
- Verify `submitted` event is created
- Verify invalid form input is rejected
