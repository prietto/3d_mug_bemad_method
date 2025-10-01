# Epic 4: Single-Page Minimalist UX Transformation

## Epic Goal
Refactor the landing page from a multi-screen progressive engagement flow to a unified single-page experience where the 3D customizer and lead capture form are simultaneously visible, reducing friction and improving conversion through radical simplification.

## Strategic Context
Following completion of Epic 1-3 implementation, strategic product review identified an opportunity to reduce conversion friction by eliminating the multi-screen navigation pattern. This epic supersedes elements of Stories 1.2 and 3.1 while preserving all functional capabilities and backend integration.

The shift from "progressive engagement" to "simultaneous visibility" aims to improve the 8-12% conversion rate target by reducing cognitive load and eliminating navigation steps between 3D customization and lead capture.

## Story 4.1: Minimal Header & Split-Screen Layout
**Supersedes:** Story 1.2 (Landing Page Hero Section)

As a potential customer,
I want to see the 3D customizer and contact form simultaneously on one screen,
so that I can interact with both without navigation friction.

**Acceptance Criteria:**
1. Replace full hero section with minimal header (logo + tagline only, max 80px height)
2. Implement split-screen layout: 3D viewer (left/top) + lead form (right/bottom)
3. Desktop: 60/40 split ratio (3D viewer receives 60% width), responsive breakpoint at 1024px
4. Mobile: Vertical stack layout (3D full-width top, form full-width bottom)
5. Preserve navigation and footer components from Story 1.2 implementation
6. Page loads within 3 seconds with both components visible and interactive
7. Layout automatically adjusts based on viewport with smooth transitions

---

## Story 4.2: Always-Visible Lead Capture Form
**Supersedes:** Story 3.1 (Smart Lead Capture Form Trigger)

As a potential customer,
I want the contact form to be immediately visible alongside the 3D tool,
so that I can provide my information whenever I'm ready without waiting for triggers.

**Acceptance Criteria:**
1. Lead form visible on initial page load, positioned in split-screen layout (no triggers)
2. Remove all engagement-based trigger logic and scoring algorithms completely
3. Form maintains identical fields from Story 3.1: name, email, phone, project description
4. GDPR compliance checkboxes and validation logic preserved from Story 3.1
5. Form submission integrates with existing POST /api/leads endpoint without changes
6. Mobile: Form positioned below 3D viewer with clear visual separation and scroll behavior
7. Success confirmation displays inline within form area (no modal overlay)

---

## Story 4.3: Optimized 3D Viewer for Shared Layout
**Enhances:** Story 2.5 (Enhanced 3D Interaction and Polish)

As a potential customer,
I want the 3D mug viewer to work smoothly in the split-screen layout,
so that I can customize my design while referencing the contact form.

**Acceptance Criteria:**
1. 3D viewer scales appropriately within 60% width desktop constraint (vs previous full-width)
2. All 3D controls (rotate, zoom, image upload, color picker, text editor) remain fully functional
3. Performance maintains 30+ FPS even with form component rendered simultaneously
4. Mobile: 3D viewport optimized for full-width vertical stack layout (minimum 400px height)
5. Visual hierarchy ensures 3D remains primary focus through size and positioning
6. Responsive adjustments handle tablet landscape (horizontal split) and portrait (vertical stack) modes
7. No regression in 3D interaction quality vs Epic 2 implementation (validated through testing)

---

## Story 4.4: Simplified Analytics & Performance Validation
**Updates:** Story 3.3 (Google Analytics Integration and Event Tracking)

As a business owner,
I want analytics to track the new single-page experience effectively,
so that I can measure conversion improvements from the simplified UX.

**Acceptance Criteria:**
1. Remove "form_trigger" and engagement scoring event tracking (no longer applicable)
2. Add "form_visible_on_load" event tracking for baseline measurement
3. Track "time_to_first_form_interaction" metric to measure engagement speed
4. Maintain all 3D interaction events from Story 3.3 (rotate, zoom, upload, color, text)
5. Implement A/B test framework foundation for future single-page vs multi-screen comparison
6. Performance monitoring validates <3 second page load with both components visible
7. Conversion funnel updated for simultaneous visibility model (remove "form triggered" step)

---

## Implementation Notes

### Code Refactoring Scope

**New Components:**
- `MinimalHeader.tsx` - Simplified header replacing full hero section
- `SplitScreenLayout.tsx` - Container managing 60/40 split and responsive behavior

**Components to Modify:**
- `LeadCaptureForm.tsx` - Remove trigger dependencies, always visible
- `MugDesigner.tsx` - Optimize for 60% width constraint
- `designStore.ts` - Simplify engagement tracking logic
- `page.tsx` - Implement new split-screen layout

**Components to Delete:**
- `FormTriggerManager.tsx` - Entire component removed
- `FormTriggerManager.test.tsx` - All trigger-related tests removed

### Estimated Effort
- Story 4.1: 6-8 hours (layout refactoring)
- Story 4.2: 4-6 hours (form simplification)
- Story 4.3: 3-4 hours (3D optimization)
- Story 4.4: 2-3 hours (analytics updates)
- **Total: 15-21 hours (2-3 days)**

### Risk Assessment
- **Performance Risk (Medium):** Both components visible simultaneously may impact load time
  - Mitigation: Thorough performance testing, lazy loading optimizations
- **Mobile UX Risk (Medium):** Vertical stack layout may affect user engagement
  - Mitigation: Extensive mobile testing, user feedback iteration
- **Conversion Risk (Low):** Simplified UX expected to improve conversion
  - Mitigation: A/B testing framework, ability to rollback if needed

---

## Success Metrics

### Technical Success Criteria
- ✅ All acceptance criteria met for Stories 4.1-4.4
- ✅ Page load time <3 seconds maintained
- ✅ 30+ FPS 3D performance with form visible
- ✅ Zero regression in 3D functionality
- ✅ WCAG AA accessibility compliance maintained

### Business Success Criteria
- ✅ Conversion rate maintains or exceeds 8-12% target
- ✅ Time-to-first-form-interaction metric improves vs baseline
- ✅ User feedback indicates reduced friction
- ✅ Analytics show engagement with both 3D and form

---

## Relationship to Other Epics

**Supersedes:**
- Story 1.2 (Landing Page Hero Section) → Replaced by Story 4.1
- Story 3.1 (Smart Lead Capture Form Trigger) → Replaced by Story 4.2

**Preserves:**
- All Epic 2 stories (3D customization functionality)
- Story 1.5 (Backend API and database)
- Story 3.2 (Lead data storage)
- Story 3.4 (Automated notifications)
- Story 3.5 (Performance monitoring)

**Enhances:**
- Story 2.5 (3D interaction) → Optimized for split-screen in Story 4.3
- Story 3.3 (Analytics) → Updated for single-page model in Story 4.4