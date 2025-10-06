# Epic 7: 3D UX & Controls Enhancement - Brownfield Improvement

**Status:** Draft | **Priority:** High | **Dependencies:** Epic 6

## Epic Goal

Enhance the 3D mug customizer user experience by improving controls layout, image positioning capabilities, and maintaining visual context during customization to reduce friction and improve design efficiency.

## Epic Description

### Existing System Context

**Current relevant functionality:**
- 3D mug renderer in `SimpleMugTest.tsx` with curved geometry for textures
- Single-column layout with canvas on top, scrollable controls below
- Image size control via `imageScale` state (affects height only)
- Color picker, text customization, and image upload controls
- Inline styles for layout and responsive behavior

**Technology stack:**
- Next.js 14+ with App Router
- React Three Fiber (@react-three/fiber)
- Three.js for 3D rendering
- TypeScript
- Custom BufferGeometry for curved surfaces
- Inline CSS styling

**Integration points:**
- `SimpleMugTest.tsx` main component (lines 244-540)
- `createCurvedPlaneGeometry()` function for image wrapping
- Canvas with OrbitControls for 3D interaction
- React state management for controls (imageScale, imagePositionY, mugColor, customText)

### Enhancement Details

**What's being added/changed:**

Current implementation has three UX issues affecting customization efficiency:

1. **Subtle Image Gap:** Despite Story 6.1 fix, a slight gap remains between image and mug surface (radius 1.2 may still be too large)

2. **Limited Size Control:** Image size slider only adjusts height because width is hardcoded at `2` in the geometry creation (line 100)

3. **Canvas Visibility Loss:** Single-column layout causes 3D canvas to scroll out of view when adjusting controls, breaking visual feedback loop

**Changes required:**

1. Fine-tune curved geometry radius or add Z-offset for complete gap elimination
2. Modify image geometry creation to scale both width and height proportionally
3. Restructure layout from single column to 2-column grid (desktop) with sticky canvas
4. Implement responsive stacking for mobile devices

**How it integrates:**
- Adjusts existing geometry creation parameters in `createCurvedPlaneGeometry()`
- Restructures main container layout from flex column to CSS Grid
- Adds sticky positioning to canvas for persistent visibility
- Maintains all existing state management and control functionality
- Preserves React Three Fiber rendering pipeline

**Success criteria:**
1. Image sits completely flush against mug surface (no visible gap)
2. Image size control scales proportionally (width and height together)
3. Canvas remains visible while scrolling controls on desktop
4. Layout adapts responsively to mobile (single column stack)
5. All existing controls continue functioning correctly
6. Performance maintains 60 FPS target
7. No regression in color picker, text, or image upload features

## Stories

### Story 7.1: Improve 3D Controls Layout and Image Positioning

**Description:** Fix remaining image gap, enhance size control to scale both dimensions, and restructure controls layout into a 2-column design where the 3D canvas remains visible while scrolling through controls. Includes responsive behavior for mobile devices.

**Key Tasks:**
- Fine-tune curved geometry radius or add Z-offset to eliminate remaining gap
- Modify image geometry to accept width scaling (not just height)
- Restructure layout to 2-column CSS Grid (canvas left, controls right)
- Implement sticky positioning for canvas on desktop
- Add responsive breakpoint for mobile (single column stack)
- Test all controls and verify 60 FPS performance

**Acceptance Criteria:**
1. Image sits completely flush against mug surface
2. Image size control scales width and height proportionally
3. 2-column layout keeps canvas visible on desktop
4. Layout stacks vertically on mobile
5. All existing controls work correctly
6. 60 FPS maintained

## Compatibility Requirements

- [x] Existing APIs remain unchanged (layout restructuring only)
- [x] Database changes: None (purely client-side UI)
- [x] UI changes follow responsive design patterns (CSS Grid, sticky positioning)
- [x] Performance impact is minimal (GPU-accelerated sticky positioning)

## Risk Mitigation

**Primary Risks:**
1. Layout changes could break responsive behavior on certain screen sizes
2. Geometry adjustments might cause image to clip through mug surface
3. Sticky positioning could cause performance issues on low-end devices

**Mitigation:**
1. Test layout on multiple devices and screen sizes (desktop, tablet, mobile)
2. Test radius values incrementally (1.19, 1.18, 1.17) with visual inspection
3. Monitor FPS during sticky scroll on low-end devices
4. Use CSS Grid which has excellent browser support and performance

**Rollback Plan:**
- Simple code revert: restore original single-column layout
- Revert geometry parameters to Story 6.1 values (radius 1.2)
- No database migrations or API changes to rollback
- Client-side only changes mean instant rollback via code deployment

## Definition of Done

- [x] All stories completed with acceptance criteria met
  - [ ] Story 7.1: Layout improved, image positioning enhanced
- [x] Existing functionality verified through testing
  - [ ] Mug color picker works on new layout
  - [ ] Text customization works on new layout
  - [ ] Image upload and controls work on new layout
  - [ ] OrbitControls remain responsive
- [x] Integration points working correctly
  - [ ] Curved geometry properly adjusted
  - [ ] Canvas rendering unaffected by layout changes
  - [ ] State management intact
- [x] Responsive behavior validated
  - [ ] Desktop: 2-column layout with sticky canvas
  - [ ] Tablet: Layout adapts appropriately
  - [ ] Mobile: Single column stack
- [x] Performance validated
  - [ ] 60 FPS maintained during interactions
  - [ ] No layout thrashing during scroll
  - [ ] Sticky positioning performs well
- [x] Documentation updated
  - [ ] Code comments explain layout structure
  - [ ] Story updated with implementation notes

## Validation Checklist

### Scope Validation
- [x] Epic can be completed in 1-2 stories maximum (1 story)
- [x] No architectural documentation is required (follows existing patterns)
- [x] Enhancement follows existing patterns (React state, inline styles)
- [x] Integration complexity is manageable (layout + geometry adjustments)

### Risk Assessment
- [x] Risk to existing system is low (isolated UI changes, easy rollback)
- [x] Rollback plan is feasible (simple git revert)
- [x] Testing approach covers existing functionality (comprehensive checklist)
- [x] Team has sufficient knowledge of integration points (well-documented)

### Completeness Check
- [x] Epic goal is clear and achievable (improve UX and controls)
- [x] Stories are properly scoped (single focused story)
- [x] Success criteria are measurable (visual inspection, responsive testing, FPS)
- [x] Dependencies are identified (Epic 6 provides current implementation)

## Technical Context for Story Development

**File Locations:**
- Component: `app/components/SimpleMugTest.tsx`
- Main layout: Lines 244-309
- Image geometry creation: Line 100
- Image controls: Lines 497-534

**Current Implementation Issues:**

**Issue 1: Image Gap**
```typescript
// Line 100 - Current radius may still be too large
const imageCurvedGeometry = useMemo(() => {
  return createCurvedPlaneGeometry(2, imageScale, 48, 1.2) // radius 1.2
}, [imageScale])

// Mug cylinder has radiusTop = 1.2, but gap still visible
// Solution: Test 1.19, 1.18, 1.17 or add Z-offset
```

**Issue 2: Size Control**
```typescript
// Line 100 - Width hardcoded at 2
createCurvedPlaneGeometry(2, imageScale, 48, 1.2)
//                        ↑ hardcoded width

// Solution: Make width also scale
createCurvedPlaneGeometry(2 * imageScale, imageScale, 48, 1.2)
```

**Issue 3: Layout**
```typescript
// Lines 244-309 - Single column causes canvas scroll-out
<div style={{ display: 'flex', flexDirection: 'column' }}>
  <div style={{ height: '400px' }}><Canvas /></div>
  <div style={{ flex: 1, overflowY: 'auto' }}>{/* controls */}</div>
</div>

// Solution: 2-column grid with sticky canvas
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
  <div style={{ position: 'sticky', top: 0 }}><Canvas /></div>
  <div style={{ overflowY: 'auto' }}>{/* controls */}</div>
</div>
```

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-10-02 | 1.0 | Initial brownfield epic created | Bob (Scrum Master) |

---

## Story Manager Notes

**Epic Summary:**
This epic addresses UX friction points in the 3D mug customizer by:
1. Fixing remaining visual quality issue (image gap)
2. Improving control functionality (proportional image scaling)
3. Enhancing layout for better visual context (sticky canvas with 2-column design)

**Integration Complexity:** Low
- Geometry adjustment is parameter-based
- Layout is CSS restructuring
- All existing functionality preserved

**Testing Focus:**
- Visual inspection for gap elimination
- Multi-device responsive testing
- Performance monitoring (60 FPS)
- Regression testing all controls

**Priority Justification:**
High priority because current UX issues create friction in the core user workflow (customizing the mug design). Users lose visual feedback when scrolling controls, reducing design efficiency and satisfaction.
