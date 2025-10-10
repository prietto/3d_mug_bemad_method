# Epic 9: AI-First Mug Design Experience

**Status:** 📝 Draft | **Priority:** Critical | **Dependencies:** Epic 8 (AI foundation)

---

## Epic Goal

Replace complex 3D interaction model with streamlined AI-powered design workflow. Users describe desired mug designs via natural language prompts, select from curated templates, and receive professional 2D renders without manual 3D manipulation. Eliminates UX friction from rotation controls, texture positioning, and limited customization options while enabling unlimited design variations through AI generation.

---

## Epic Description

### Strategic Context

**Architectural Pivot Rationale:**

**FROM (Deprecated):**
- 3D visualization as differentiator (Three.js, React Three Fiber, WebGL rendering)
- Manual texture positioning and 3D controls
- Single fixed mug geometry
- Complex user interaction model

**TO (New Direction):**
- AI-powered complete mug generation (Google AI Studio)
- Natural language prompt interface
- Unlimited mug styles and variations
- Simplified user experience

**Why This Pivot:**
- Current 3D model is inflexible (only one mug shape)
- 3D controls add unnecessary complexity for users
- AI can generate complete professional renders faster
- Eliminates technical overhead (Three.js bundle size, WebGL compatibility)
- Expands creative possibilities beyond manual design

**Impact on Previous Work:**
- **Deprecates:** Epics 1, 2, 5, 6, 7 (3D-focused development)
- **Preserves:** Epic 3 (Lead Capture), Epic 4 (Layout - modified)
- **Builds on:** Epic 8 (AI foundation already implemented)

---

### Enhancement Details

**What's Being Added:**

1. **AI Prompt Interface**
   - Natural language input (max 500 characters)
   - Describe desired mug design in plain English
   - Examples: "red ceramic mug with yellow sunflower pattern"
   - Character counter and prompt hints for first-time users

2. **Curated Style Templates**
   - 5-7 professional starting points
   - Templates: Classic White, Colorful Pattern, Minimalist, Artistic, Corporate, Photo-Based, Vintage
   - Click template → pre-fills prompt → customize before generating
   - Reduces blank-slate paralysis

3. **Multi-View Generation**
   - Generate multiple angles of same design
   - Views: Front, Side (handle visible), Close-up
   - Simulates 3D rotation without WebGL complexity
   - Carousel/gallery display format

4. **Simplified Refinement Workflow**
   - Preview generated design before applying
   - Action buttons: "Apply", "Regenerate", "Adjust Prompt"
   - No manual positioning or scaling controls
   - Instant iteration with prompt modifications

5. **Feature Flag System**
   - `ENABLE_AI_MODE` - Primary toggle for Epic 9
   - `ENABLE_LEGACY_3D_MODE` - Fallback to old 3D system
   - Gradual rollout capability (10% → 50% → 100%)
   - A/B testing support

6. **Legacy 3D Preservation**
   - Three.js code maintained but not primary
   - Accessible via "Advanced Options" menu
   - Fallback if AI service unavailable
   - No active development on 3D features

**How It Integrates:**

- Replaces `<MugDesigner />` 3D component with `<AIMugDesigner />`
- Reuses existing API route from Epic 8 (`/api/generate-texture`)
- Extends with `mode: 'full-mug-render'` parameter
- Design store maintains compatibility with both systems
- Lead capture workflow unchanged (just different design data)

**Technology Stack Updates:**

**Deprecated (marked LEGACY):**
- ~~Three.js 0.156+~~
- ~~React Three Fiber 8.15+~~
- ~~WebGL GPU rendering~~
- ~~OrbitControls~~

**New Primary Stack:**
- Google AI Studio (Gemini 2.5 Flash Image) - already integrated
- Natural language processing for prompt engineering
- Multi-view generation logic
- Template management system

---

## Stories

### Story 9.1: AI Prompt-Based Mug Generation

**Priority:** Critical
**Estimate:** 5 story points (~1 week)

**User Story:**
As a user designing a custom mug, I want to describe my design idea in plain English, so that I can quickly see a professional render without learning complex 3D controls.

**Acceptance Criteria:**
1. Textarea input accepts natural language prompts (500 char max)
2. "Generate" button triggers AI generation via `/api/generate-texture` with `mode: 'full-mug-render'`
3. Loading indicator shows during generation (<10s for 90% of requests)
4. Generated 2D render displays in preview area (complete mug, not just texture)
5. Error handling for API failures with user-friendly messages
6. Prompt examples/hints displayed for first-time users (8-10 examples)
7. Character counter shows remaining characters
8. Generated image is complete mug render (not texture to be applied to 3D)

**Technical Implementation:**
```typescript
// Extend existing API route
POST /api/generate-texture
{
  mode: 'full-mug-render', // NEW mode
  prompt: 'red ceramic mug with yellow sunflower pattern',
  // No baseImage for text-to-image mode
}

// Prompt engineering - prepend to user input:
const enhancedPrompt = `professional product photograph of custom ceramic coffee mug with: ${userPrompt}. Studio lighting, white background, centered composition.`;
```

**Dependencies:**
- Epic 8 (Google AI Studio integration complete)
- Existing rate limiting from Story 8.3

---

### Story 9.2: Mug Style Templates & Presets

**Priority:** High
**Estimate:** 3 story points (~3-4 days)

**User Story:**
As a user who isn't sure what design I want, I want to start from professional templates, so that I can customize from a good starting point rather than starting from scratch.

**Acceptance Criteria:**
1. Template gallery displays 5-7 curated style options with thumbnails
2. Each template has thumbnail preview, name, and description
3. Clicking template pre-fills prompt with template description
4. User can modify template prompt before generating
5. Templates cover key use cases: Corporate, Casual, Artistic, Minimalist, Photo-based, Vintage, Holiday

**Template Specifications:**
```typescript
const TEMPLATES = [
  {
    id: 'classic-white',
    name: 'Classic White',
    description: 'Simple elegant white ceramic mug',
    prompt: 'clean white ceramic mug with simple elegant design, minimalist style',
    thumbnail: '/templates/classic-white.jpg' // Static asset
  },
  {
    id: 'colorful-pattern',
    name: 'Colorful Pattern',
    description: 'Vibrant abstract geometric design',
    prompt: 'vibrant ceramic mug with abstract geometric patterns in multiple colors, modern artistic style',
    thumbnail: '/templates/colorful-pattern.jpg'
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'Clean modern design',
    prompt: 'minimalist ceramic mug with single color accent line, Scandinavian design aesthetic',
    thumbnail: '/templates/minimalist.jpg'
  },
  {
    id: 'artistic',
    name: 'Artistic',
    description: 'Hand-painted watercolor style',
    prompt: 'ceramic mug with watercolor floral design, artistic hand-painted style, soft colors',
    thumbnail: '/templates/artistic.jpg'
  },
  {
    id: 'corporate',
    name: 'Corporate',
    description: 'Professional logo placement',
    prompt: 'professional white ceramic mug with clean logo area, corporate branding style',
    thumbnail: '/templates/corporate.jpg'
  }
];
```

**UI Design:**
- Grid layout (2-3 columns on desktop, 1 on mobile)
- Hover effect on templates
- "Customize" button on each template
- Modal/expansion shows full prompt for editing

---

### Story 9.3: Multi-View Preview Generation

**Priority:** Medium
**Estimate:** 5 story points (~1 week)

**User Story:**
As a user reviewing my design, I want to see the mug from different angles, so that I can understand how it looks from all sides before placing an order.

**Acceptance Criteria:**
1. After initial generation, "Generate More Views" button appears
2. Clicking button generates 2 additional views (side angle, handle close-up)
3. All 3 views display in carousel/gallery format
4. Each view uses same design prompt with angle-specific modifiers
5. Views are cached and associated with design ID
6. Loading state shows "Generating additional views..."
7. Option to generate views is clearly optional (not required)

**Technical Implementation:**
```typescript
const VIEW_PROMPTS = {
  front: `${userPrompt}`, // Direct user prompt (initial generation)

  side: `${userPrompt}, side profile view showing mug handle, 45-degree angle, product photography`,

  handle: `${userPrompt}, close-up detail view of mug handle and curved side, product photography`
};

// Sequential generation after user clicks "Generate More Views"
async function generateMultiView(designId: string, basePrompt: string) {
  const views = [];

  // Front already exists from Story 9.1
  views.push({ angle: 'front', url: existingFrontUrl });

  // Generate side view
  const sideUrl = await generateImage(VIEW_PROMPTS.side);
  views.push({ angle: 'side', url: sideUrl });

  // Generate handle view
  const handleUrl = await generateImage(VIEW_PROMPTS.handle);
  views.push({ angle: 'handle', url: handleUrl });

  // Save to design record
  await updateDesign(designId, { multiViewUrls: views });
}
```

**UI Components:**
- Image carousel with dot indicators
- Left/right navigation arrows
- Thumbnail strip below main image
- "Generating view 2 of 3..." progress indicator

---

### Story 9.4: Simplified Refinement Controls & Feature Flag

**Priority:** High
**Estimate:** 3 story points (~3-4 days)

**User Story:**
As a user reviewing AI-generated design, I want simple options to refine the result, so that I can adjust the design without starting over or using complex controls.

**Acceptance Criteria:**
1. Preview shows 3 action buttons: "Apply to Design", "Regenerate", "Adjust Prompt"
2. "Apply" saves design and makes it active (proceeds to lead capture)
3. "Regenerate" creates new variation with same prompt (uses AI randomness)
4. "Adjust" allows editing original prompt and re-generating
5. Feature flag `ENABLE_AI_MODE` controls Epic 9 visibility
6. Feature flag `ENABLE_LEGACY_3D_MODE` controls Three.js fallback
7. When AI mode disabled, legacy 3D shows as default
8. Admin can toggle flags without code deployment

**Feature Flag Implementation:**
```typescript
// .env.local
ENABLE_AI_MODE=true  # Epic 9 AI-first experience
ENABLE_LEGACY_3D_MODE=true  # Fallback to Three.js

// Component logic
export default function MugDesignerRouter() {
  const aiEnabled = process.env.NEXT_PUBLIC_ENABLE_AI_MODE === 'true';
  const legacyEnabled = process.env.NEXT_PUBLIC_ENABLE_LEGACY_3D_MODE === 'true';

  if (aiEnabled) {
    return <AIMugDesigner />;
  } else if (legacyEnabled) {
    return <Legacy3DDesigner />;
  } else {
    return <StaticFallback message="Design features temporarily unavailable" />;
  }
}
```

**Refinement Controls UI:**
```
┌─────────────────────────────────────────┐
│  [Generated Mug Image Preview]          │
│                                          │
│                                          │
└─────────────────────────────────────────┘

Your design: "red mug with yellow flowers"

┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Apply Design │ │ Regenerate   │ │ Adjust Prompt│
└──────────────┘ └──────────────┘ └──────────────┘

Need more control? [Switch to Advanced 3D Mode →]
```

**Gradual Rollout Strategy:**
```typescript
// Percentage-based rollout (server-side)
function shouldShowAIMode(userId: string): boolean {
  const rolloutPercentage = parseInt(process.env.AI_MODE_ROLLOUT_PERCENT || '100');
  const userHash = hashUserId(userId); // Deterministic hash
  return (userHash % 100) < rolloutPercentage;
}

// Phases:
// Week 1: AI_MODE_ROLLOUT_PERCENT=10
// Week 2: AI_MODE_ROLLOUT_PERCENT=50
// Week 3: AI_MODE_ROLLOUT_PERCENT=100
```

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| AI Mode Adoption | >90% users choose AI over legacy 3D | % selecting AI mode when both available |
| Generation Speed | <10s (90th percentile) | API response time + rendering |
| User Abandonment | 30% reduction vs 3D controls | Exit rate from design page |
| Design Completion | 50% increase vs 3D workflow | % users who finish design |
| Lead Conversion | Maintain 8-12% | Epic 3 conversion metrics |
| Template Usage | 60%+ users start with template | % clicks on templates vs blank prompt |

---

## Rollout Plan

### Phase 1: Soft Launch (Week 1-2)
- `ENABLE_AI_MODE=true` for 10% of users (gradual rollout)
- Monitor metrics: generation speed, error rate, adoption rate
- Gather user feedback via analytics and optional survey
- Keep legacy 3D as fallback (100% available)

### Phase 2: Expansion (Week 3-4)
- Increase to 50% of users if metrics positive
- A/B test: AI vs Legacy 3D (measure conversion rates)
- Refine prompts based on generation quality feedback
- Optimize template selection based on usage patterns

### Phase 3: Full Deployment (Week 5+)
- Enable for 100% of users as default experience
- Legacy 3D mode available via "Advanced Options" menu (not prominently displayed)
- Migration communication: In-app banner, email to existing users
- Continuous monitoring of adoption and conversion metrics

---

## Compatibility Requirements

- ✅ Epic 8 AI infrastructure (Google AI Studio integration) - Already Complete
- ✅ Epic 3 Lead Capture workflow - No changes required
- ✅ Manual image upload fallback - Preserved and accessible
- ✅ Existing design data model - Backward compatible
- ✅ Analytics tracking - Extended with AI-specific events
- ✅ Mobile responsive design - Maintained
- ✅ Cross-browser compatibility - No change

---

## Risk Mitigation

### Primary Risk: Users Prefer 3D Interaction
**Probability:** Low
**Impact:** High

**Mitigation:**
- A/B testing in Phase 2 provides early signal
- Legacy 3D mode remains available as fallback
- Easy rollback via feature flag (no code deployment needed)
- Template system reduces blank-slate anxiety

### Secondary Risk: AI Generation Quality Inconsistent
**Probability:** Medium
**Impact:** Medium

**Mitigation:**
- Curated templates provide reliable starting points
- Prompt engineering improves quality (prepend "professional product photograph")
- "Regenerate" button allows multiple attempts
- Manual upload always available as alternative

### Risk: Rate Limiting Issues
**Probability:** Low
**Impact:** Medium

**Mitigation:**
- Epic 8 Story 8.3 already implements multi-layer rate limiting
- 1,500/day free tier managed with IP-based limits
- Clear quota display and warnings
- Graceful degradation to manual upload

### Risk: Google AI Studio API Outage
**Probability:** Low
**Impact:** High

**Mitigation:**
- Legacy 3D mode serves as complete fallback
- Manual upload always functional
- Error message clearly directs to alternative methods
- Retry logic with exponential backoff (3 attempts)

---

## Definition of Done

### Functional Requirements
- [ ] Natural language prompt interface functional (500 char max)
- [ ] 5-7 curated templates available and working
- [ ] Multi-view generation produces 3 distinct angles
- [ ] Refinement controls (Apply, Regenerate, Adjust) working
- [ ] Feature flags tested (AI mode, Legacy mode, both, neither)
- [ ] Generated images are complete mug renders (not textures)

### User Experience
- [ ] Prompt examples/hints guide first-time users
- [ ] Template selection is intuitive and visually appealing
- [ ] Loading states clear (<10s generation time)
- [ ] Error messages actionable and user-friendly
- [ ] Legacy 3D mode accessible but not prominent
- [ ] Mobile-optimized UI tested on iOS/Android

### Technical Requirements
- [ ] Reuses Epic 8 API infrastructure (no new endpoints)
- [ ] Feature flag system deployed and toggleable
- [ ] Gradual rollout mechanism functional (percentage-based)
- [ ] Analytics events tracking AI-specific interactions
- [ ] Backward compatibility with existing designs
- [ ] No breaking changes to lead capture workflow

### Quality Assurance
- [ ] A/B testing framework ready (AI vs Legacy comparison)
- [ ] Cross-browser testing complete (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsive design validated
- [ ] Rate limiting from Epic 8 verified still functional
- [ ] Manual upload fallback tested
- [ ] Legacy 3D mode regression testing complete

### Documentation
- [ ] Feature flag configuration documented
- [ ] Template creation guide (for future templates)
- [ ] Prompt engineering best practices documented
- [ ] Rollout plan communicated to team
- [ ] User-facing help text updated (AI mode instructions)

---

## Migration Strategy

### Existing Users with 3D Designs
```sql
-- Mark existing designs as legacy
UPDATE designs
SET is_legacy_3d = true
WHERE created_at < '2025-01-08'  -- Epic 9 launch date
  AND ai_prompt IS NULL;
```

### Communication Plan

**In-App Notification:**
```
"🎨 New: AI-Powered Design Experience!
Describe your mug in words and watch it come to life.
[Try Now] [Learn More]"
```

**Email to Existing Users:**
```
Subject: "Easier Mug Design with AI - No More Complex Controls!"

We've upgraded our mug designer! Now you can:
✨ Describe your design in plain English
🎨 Choose from professional templates
🔄 See multiple angles instantly

Your previous designs are safe and accessible in "Advanced Mode"
```

**Legacy Mode Label:**
"Advanced 3D Mode (Expert Users)" - Accessible via settings menu

---

## Dependencies

### Completed (Epic 8):
- ✅ Google AI Studio API integration
- ✅ `/api/generate-texture` endpoint
- ✅ Rate limiting infrastructure
- ✅ Design store with AI state

### Required:
- Next.js 14 App Router
- Feature flag system (environment variables)
- Analytics GA4 configured

### External:
- Google AI Studio API availability (99.9% SLA)
- User browser supports modern JS (ES2020+)

---

## Future Enhancements (Out of Scope)

### Phase 2 Features (Post-Epic 9)
- **Story 10.1:** Advanced style controls (photorealistic, cartoon, watercolor filters)
- **Story 10.2:** Design history and favorites (cloud storage)
- **Story 10.3:** Batch generation (5 variations from one prompt)
- **Story 10.4:** Social sharing (Twitter, Pinterest integration)
- **Story 10.5:** Print quality upscaling (4K export)
- **Story 10.6:** Authenticated users get higher limits (50/day vs 15/day)

---

## Technical Notes

### Prompt Engineering Best Practices

**User Input Enhancement:**
```typescript
function enhancePrompt(userInput: string): string {
  const prefix = "professional product photograph of ceramic coffee mug with: ";
  const suffix = ". Studio lighting, white background, centered composition, e-commerce product shot";

  return `${prefix}${userInput}${suffix}`;
}

// Example:
// User types: "red mug with yellow flowers"
// Enhanced: "professional product photograph of ceramic coffee mug with: red mug with yellow flowers. Studio lighting, white background, centered composition, e-commerce product shot"
```

### Multi-View Angle Modifiers
```typescript
const ANGLE_MODIFIERS = {
  front: "", // No modifier needed
  side: ", side profile view showing handle, 45-degree angle from right",
  handle: ", close-up detail of handle and curved side surface, product detail shot"
};
```

### Feature Flag Environment Variables
```env
# .env.local

# Epic 9 Feature Flags
NEXT_PUBLIC_ENABLE_AI_MODE=true
NEXT_PUBLIC_ENABLE_LEGACY_3D_MODE=true

# Gradual Rollout
AI_MODE_ROLLOUT_PERCENT=100  # 10, 50, or 100

# Epic 8 Variables (already configured)
GOOGLE_AI_STUDIO_API_KEY=your_key_here
SESSION_GENERATION_LIMIT=5
IP_GENERATION_LIMIT=15
GLOBAL_GENERATION_LIMIT=1400
```

---

**Epic 9 replaces complex 3D manipulation with intuitive AI-powered generation, dramatically simplifying user experience while expanding creative possibilities. Strategic pivot from technical differentiation (WebGL) to creative differentiation (AI generation).**

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-01-08 | v2.0 | Complete rewrite - AI-first strategic pivot (Sprint Change Proposal approved) | BMad Master |
| 2025-01-06 | v1.0 | Initial Epic 9 (hybrid 3D+AI approach) | John (PM) |
