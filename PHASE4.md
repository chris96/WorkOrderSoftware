# Phase 4

## Checklist
- [ ] Add a closeout entry point to the staff work order detail page
- [ ] Build a staff-only closeout form
- [ ] Add a required repair summary field
- [ ] Add optional closeout fields for:
  - [ ] materials used
  - [ ] internal completion notes
- [ ] Add closeout photo upload support
- [ ] Upload closeout photos to Supabase Storage
- [ ] Save closeout photo metadata in `work_order_photos`
- [ ] Save closeout completion data on the work order, including:
  - [ ] closed status
  - [ ] completion timestamp
  - [ ] closed by staff user
  - [ ] repair summary
  - [ ] optional material or note fields
- [ ] Create closeout timeline events in `work_order_events`
- [ ] Restrict closeout actions to staff users only
- [ ] Restrict closeout to valid non-closed statuses only
- [ ] Remove closed requests from the open queue and surface them in the closed view
- [ ] Show closeout summary and closeout photos clearly in the staff UI
- [ ] Keep intake photos and closeout photos clearly separated in the UI
- [ ] Put closed requests into a read-only completed state unless a future reopen flow is added
- [ ] Clean up partial closeout failures so file uploads, metadata, and timeline events do not get out of sync
- [ ] Verify closeout data is saved correctly in Supabase
- [ ] Test closeout workflow end to end

## Implementation Plan

### 1. Closeout entry point
- Add a clear closeout action to `/staff/work-orders/[id]`
- Only show the closeout action for staff-authenticated users
- Prevent closing a request that is already closed
- Keep the closeout path tied to the work order detail page so staff can review the request before completing it

### 2. Closeout form
- Build a staff-only closeout form for completing a repair
- Require a repair summary that explains what was fixed or what work was performed
- Add optional fields for:
  - materials used
  - internal completion notes
- Keep the form focused and operational so it is quick for the super to finish after a repair

### 3. Validation
- Require the repair summary on both the client and server
- Validate that only staff users can submit the closeout form
- Validate the work order exists before allowing closeout
- Validate that the request is in a closable state such as `new`, `in_progress`, or `waiting_on_parts`
- Validate that closeout photos, if attached, are supported image types and within the allowed size limits
- Prevent a second closeout submission from changing an already closed request unexpectedly

### 4. Storage flow
- Upload closeout photos to the existing Supabase storage bucket under a `closeout/` path
- Link closeout uploads to the work order safely
- Save closeout photo metadata in `work_order_photos`
- Clean up any uploaded files if the closeout flow fails after storage succeeds so orphaned closeout files are not left behind

### 5. Database flow
- Update the work order to `closed`
- Store the required repair summary
- Store the completion timestamp
- Store which staff user closed the request
- Store optional material and completion note fields if they are provided
- Preserve the intake data already captured on the request
- Keep the closeout fields structured so they can be reused later in the repair report and tenant completion email
- Ensure the request detail page can render the closeout summary cleanly after completion

### 6. Timeline flow
- Create a closeout event in `work_order_events`
- Capture who closed the request and when it happened
- Add useful event metadata such as:
  - previous status
  - new status
  - closeout summary reference
  - whether closeout photos were attached
- Keep timeline entries readable in the staff detail page

### 7. Queue behavior
- Ensure closed requests no longer appear in the open work order queue
- Ensure closed requests appear correctly in the recently closed section
- Preserve assignment, intake photos, and prior internal notes after closeout
- Keep the dashboard experience consistent once a request moves from active work to completed work
- Present the request in a read-only completed state after closeout unless a future reopen workflow is introduced

### 8. Staff review experience
- Show the repair summary prominently on the closed request detail page
- Show closeout photos in their own section separate from intake photos
- Keep internal completion notes visible only to staff
- Make it obvious who closed the request and when

### 9. Access control
- Restrict the closeout route and any related API handlers to staff users only
- Ensure tenants cannot trigger or view internal closeout actions
- Keep internal completion notes staff-only
- Preserve existing staff-role protections from Phase 3

### 10. Failure handling
- If photo upload succeeds but database updates fail, clean up the uploaded closeout files
- If the work order updates but the timeline event or photo metadata insert fails, roll back or reconcile so the request is not left in a half-closed state
- Keep closeout writes atomic as much as practical for this stack

### 11. Testing
- Close a request successfully with a repair summary and no closeout photos
- Close a request successfully with closeout photos
- Verify the repair summary is required
- Verify invalid closeout photo uploads are rejected
- Verify only a valid non-closed request can be closed
- Verify the work order status changes to `closed`
- Verify the completion timestamp is saved correctly
- Verify the closing staff user is saved correctly
- Verify closeout photo metadata rows are created correctly
- Verify a closeout event is added to `work_order_events`
- Verify the closed request is removed from the open queue
- Verify the closed request appears in the closed section
- Verify intake and closeout photos render in clearly separate sections
- Verify the repair summary is visible on the closed request detail page
- Verify only staff users can perform closeout actions
- Verify a closed request cannot be accidentally closed a second time
