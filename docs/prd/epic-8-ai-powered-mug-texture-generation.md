# Epic 8: AI-Powered Mug Texture Generation

**Status:** 📝 Draft | **Priority:** High | **Dependencies:** Epic 5, Epic 6

---

## Epic Goal

Replace the current limited manual image upload system with AI-powered texture generation capabilities using Google AI Studio (Gemini 2.5 Flash Image), enabling users to create custom mug designs through text prompts and AI-enhanced image uploads, dramatically expanding creative possibilities while maintaining the existing 3D rendering infrastructure.

---

## Epic Description

### Existing System Context:

**Current relevant functionality:**
- Users can manually upload images and apply them as textures to a 3D mug model
- Basic image upload with file validation and preview
- Texture loading and application to cylindrical mug geometry
- Limited creativity - users constrained by their own image files

**Technology stack:**
- Frontend: Next.js 14, React 18, TypeScript
- 3D Rendering: React Three Fiber, Three.js
- State Management: Zustand
- UI: Tailwind CSS
- File Handling: Browser File API

**Integration points:**
- `app/components/3d/MugModel.tsx` - Handles texture loading (TextureLoader) and application to mug material
- `app/components/3d/ImageUpload.tsx` - Current manual upload component
- `app/components/3d/store/designStore.ts` - Zustand store managing design state including `uploadedImageUrl`
- Three.js TextureLoader - Loads and applies textures to MeshPhysicalMaterial

---

### Enhancement Details:

**What's being added/changed:**

1. **Google AI Studio Integration (Gemini 2.5 Flash Image API)**
   - Text-to-image generation: Users describe design via prompt, AI generates texture
   - Image-to-image enhancement: Users upload base image + prompt, AI transforms it
   - API key configuration via environment variables
   - Request management with rate limiting

2. **New UI Components**
   - AI prompt input field with character limit
   - Generation mode toggle (text-to-image vs image-to-image)
   - Loading states with progress indication
   - Error handling with user-friendly messages
   - Generated image preview before applying to mug

3. **Enhanced Design Store**
   - New state properties: `aiGeneratedImageUrl`, `isGenerating`, `generationError`, `lastPrompt`
   - Actions: `generateFromText()`, `enhanceImage()`, `clearGenerationError()`

4. **API Route**
   - `/api/generate-texture` - Server-side endpoint to call Google AI Studio
   - Protects API key from client exposure
   - Handles base64 image encoding for image-to-image

**How it integrates:**
- New `AITextureGenerator.tsx` component placed alongside existing `ImageUpload.tsx`
- Generated images flow through existing texture loading pipeline in `MugModel.tsx`
- Extends `designStore` with AI-specific state (backward compatible)
- Maintains full backward compatibility with manual upload workflow
- Reuses existing TextureLoader and MeshPhysicalMaterial application logic
- No changes to core 3D rendering, rotation, or color controls

**Success criteria:**
1. Users can generate mug textures via text prompts (text-to-image mode)
2. Users can upload images and enhance them with AI prompts (image-to-image mode)
3. Generated textures display correctly on existing 3D mug model with proper wrapping
4. Manual upload workflow remains fully functional (zero disruption)
5. Clear loading states during generation (skeleton/spinner)
6. Comprehensive error handling for API failures (network, rate limit, invalid input)
7. Free tier usage stays within Google AI Studio limits (1,500 requests/day)
8. Generation completes in <5 seconds for good UX

---

## Stories

### Story 8.1: Google AI Studio Integration & Text-to-Image Generation
**Goal:** Set up Google AI Studio (Gemini 2.5 Flash Image) API integration, implement server-side generation endpoint, create prompt input UI component, and connect generated images to existing texture system.

**Scope:**
- Create `/api/generate-texture` Next.js API route
- Integrate Gemini 2.5 Flash Image API for text-to-image
- Environment variable configuration for API key
- New `AITextureGenerator.tsx` component with prompt input
- Update `designStore` with AI generation state
- Connect generated image URL to existing `MugModel.tsx` texture pipeline
- Basic loading state and error handling

**Acceptance Criteria:**
- API route successfully calls Google AI Studio and returns image URL
- Users can enter text prompt (max 500 characters)
- Generated image automatically applied to 3D mug texture
- Loading spinner shows during generation
- Basic error message displays on failure
- Manual upload still works unchanged

---

### Story 8.2: Image-to-Image Enhancement & Combined Workflow
**Goal:** Implement image-to-image AI enhancement where users upload a base image and provide a prompt to transform it, and create unified UI that offers both manual upload and AI generation options with clear mode switching.

**Scope:**
- Extend `/api/generate-texture` to support image-to-image mode
- Base64 encoding of uploaded images for API payload
- Mode toggle UI (Manual Upload | Text-to-Image | Image-to-Image)
- Image preview before applying to mug
- "Apply to Mug" confirmation button
- Integration with existing `ImageUpload.tsx` for base image selection
- Enhanced `designStore` actions for image enhancement workflow

**Acceptance Criteria:**
- Users can select image-to-image mode
- Uploaded base image + prompt generates enhanced texture
- Mode toggle clearly indicates active generation method
- Preview shows generated image before application
- Users can regenerate with different prompts
- All three modes (manual, text-to-image, image-to-image) work seamlessly
- Existing 3D controls (rotation, color, text) remain functional

---

### Story 8.3: Multi-Layer Rate Limiting, Error Handling & Production Readiness
**Goal:** Implement robust multi-layer rate limiting strategy to prevent individual users from consuming all daily tokens, add comprehensive error handling for API failures, and create user-friendly error messages with clear quota visibility.

**Scope:**

**Rate Limiting Strategy (3-Layer Protection):**
1. **Layer 1 - Session Limit (LocalStorage):**
   - First 5 generations free without restrictions (frictionless UX)
   - Counter stored in localStorage with UTC date timestamp
   - Resets at midnight UTC daily

2. **Layer 2 - IP-Based Limit (Supabase):**
   - After 5 session generations, require IP tracking
   - Store IP address + generation count + timestamp in Supabase
   - Maximum 15 generations per IP per day
   - API route checks IP limit before calling Google AI Studio
   - User sees: "You have X generations remaining today"

3. **Layer 3 - Global Daily Limit (Server-Side):**
   - Track total API calls across all users
   - Hard limit: 1,400 generations/day (buffer of 100 below 1,500 limit)
   - Return 503 error when global limit reached
   - User sees: "Service temporarily at capacity. Try again in X hours"

**Additional Features:**
- Detailed error handling (network failure, rate limit, invalid input, API errors)
- User-friendly error messages with actionable guidance and quota display
- Loading progress indicator with estimated time
- Warning messages when approaching limits (Layer 1: "2 free generations left", Layer 2: "5 generations remaining today")
- Fallback to manual upload messaging on any failure
- Input validation (prompt length, image size/format)
- Admin dashboard data structure for monitoring usage (optional)

**Database Schema (Supabase):**
```sql
CREATE TABLE ai_generation_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  generation_count INTEGER DEFAULT 1,
  last_generation_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date_key TEXT NOT NULL, -- Format: YYYY-MM-DD for daily reset
  UNIQUE(ip_address, date_key)
);

CREATE TABLE ai_generation_global_counter (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date_key TEXT NOT NULL UNIQUE, -- Format: YYYY-MM-DD
  total_generations INTEGER DEFAULT 0,
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Acceptance Criteria:**
- Layer 1 (Session): First 5 generations work without IP tracking
- Layer 2 (IP): After 5, IP-based limit enforced (max 15/day per IP)
- Layer 3 (Global): Total daily generations never exceed 1,400
- Clear quota display: "2 of 5 free generations used" → "8 of 15 generations remaining today"
- Users approaching limits see warnings before hitting them
- Global limit shows retry time: "Try again in 6 hours" (shows time until UTC midnight)
- All error states have clear user guidance with quota information
- Manual upload always prominently displayed as fallback
- Database properly stores and resets IP limits daily
- API route efficiently checks all 3 layers before calling Google AI Studio
- Input validation prevents invalid API calls
- Admin can query usage statistics from database

---

## Compatibility Requirements

- [x] Existing manual image upload remains fully functional
- [x] Current 3D mug rendering (rotation, colors, text overlay) unchanged
- [x] TextureLoader API and MeshPhysicalMaterial system remain backward compatible
- [x] Zustand store structure extended with new properties, not replaced
- [x] No changes to existing UI components outside of AI feature area
- [x] Performance impact minimal (API calls are async, non-blocking, <5s response time)
- [x] Database schema additions are isolated (new tables for rate limiting only, no modifications to existing tables)
- [x] Generated images stored as data URLs (no persistent storage of user-generated content)

---

## Risk Mitigation

### Primary Risk: Individual User Consuming All Daily Tokens
**Risk:** Single user or malicious actor generates hundreds of images, exhausting the 1,500/day limit and blocking all other users.

**Mitigation Strategy (3-Layer Defense):**

1. **Layer 1 - Session Limit (5 generations):**
   - Casual users get frictionless experience
   - LocalStorage prevents accidental overuse
   - Quick reset if localStorage cleared (moves to Layer 2)

2. **Layer 2 - IP-Based Limit (15 generations/day):**
   - Prevents single IP from monopolizing service
   - Stored in Supabase with daily automatic reset
   - Users behind same NAT share limit (reasonable tradeoff)
   - Clear warning: "You have 5 generations remaining today"

3. **Layer 3 - Global Daily Cap (1,400 total):**
   - Safety net to never exceed free tier
   - 100-generation buffer for safety margin
   - Early warning at 1,200 generations
   - Clear messaging: "Service at capacity, resets at midnight UTC"

**Why this works:**
- ✅ Even if 100 users max out (15 each) = only 1,500 total
- ✅ Realistically, most users use 2-5 generations = serves 200-700 users/day
- ✅ Malicious actor blocked after 15 attempts per IP
- ✅ Global cap prevents any scenario exceeding free tier

**Example User Journey:**
```
New User arrives
  → Generations 1-5: "2 of 5 free generations used" (LocalStorage only, fast)
  → Generation 6: IP tracking starts, "6 of 15 generations used today" (Supabase check)
  → Generations 7-15: "12 of 15 generations used today" (continues tracking)
  → Generation 16: "Daily limit reached. Try again tomorrow at 12:00 AM UTC" (429 error)

Meanwhile, global counter runs in background:
  → At 1,200 total: Admin notification (optional)
  → At 1,400 total: All users get "Service temporarily at capacity" (503 error)
  → At UTC midnight: All counters reset automatically
```

### Secondary Risks & Mitigations

**Risk:** API key exposed in client code
- **Mitigation:** All API calls go through Next.js API route (`/api/generate-texture`), API key stored in `.env.local` server-side only

**Risk:** User bypasses limits with VPN/incognito
- **Mitigation:** Layer 3 global cap prevents total abuse; acceptable tradeoff vs requiring authentication
- **Future enhancement:** Add optional login for higher limits (50/day per authenticated user)

**Risk:** Database Supabase queries slow down API
- **Mitigation:** Index on `ip_address` and `date_key` columns; query optimization; cache frequent IPs in memory

**Risk:** Large images cause slow generation or API errors
- **Mitigation:** Client-side image compression before sending (max 1024x1024), file size limit (5MB), format validation (JPEG, PNG, WebP)

**Risk:** Inappropriate content generated by AI
- **Mitigation:** Google AI Studio has built-in content filtering; add prompt validation if needed; clear terms of use

**Risk:** Timezone issues with daily reset
- **Mitigation:** All timestamps use UTC; daily reset at UTC midnight; display user's local time for reset countdown

### Rollback Plan
1. **Feature flag:** `ENABLE_AI_GENERATION=false` in environment variables to disable feature
2. **UI removal:** Hide `AITextureGenerator` component, show only manual upload
3. **No data loss:** Manual upload always functional, no database changes to roll back
4. **Quick rollback:** Simple environment variable change + redeploy (<5 minutes)
5. **Zero impact:** Core 3D rendering untouched, rollback only affects AI UI components

---

## Definition of Done

### Functional Requirements
- [x] Text-to-image generation working with Google AI Studio (Gemini 2.5 Flash Image)
- [x] Image-to-image enhancement functional with base image + prompt
- [x] Both AI features integrate seamlessly with existing 3D mug texture system
- [x] Generated textures wrap correctly around cylindrical mug geometry
- [x] Manual upload functionality verified unchanged (regression testing)

### User Experience
- [x] Loading states with progress indicators during generation
- [x] Clear error handling with actionable user messages
- [x] Rate limiting prevents API abuse and shows remaining quota
- [x] Mode toggle (Manual | Text-to-Image | Image-to-Image) is intuitive
- [x] Preview generated images before applying to mug

### Technical Requirements
- [x] API key secured in server-side environment variables
- [x] Free tier usage documented and monitored (1,500/day limit)
- [x] Client-side rate limiting implemented (50/hour per session)
- [x] Input validation prevents invalid API calls
- [x] Error boundaries catch and display generation failures gracefully

### Quality Assurance
- [x] All existing 3D controls (rotation, color picker, text overlay) working correctly
- [x] No regression in texture quality or rendering performance
- [x] Responsive design works on mobile and desktop
- [x] Generated images tested on multiple aspect ratios
- [x] Cross-browser testing (Chrome, Firefox, Safari, Edge)

### Documentation
- [x] Environment variable setup documented (`.env.local` template)
- [x] API key acquisition instructions (Google AI Studio setup)
- [x] Rate limiting strategy documented
- [x] User-facing help text for AI features

---

## Technical Notes

### Google AI Studio (Gemini 2.5 Flash Image) API Details

**Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateImage`

**Free Tier:** 1,500 requests per day (very generous for MVP)

**Pricing after free tier:** $0.039 per image (1,290 output tokens @ $30/1M tokens)

**Response time:** ~2-4 seconds typical

**Image output:** Base64 encoded or URL (depending on API configuration)

**Supported modes:**
- Text-to-image: Send prompt only
- Image-to-image: Send base image (base64) + prompt

**API Key Setup:**
1. Visit [Google AI Studio](https://aistudio.google.com)
2. Sign in with Google account
3. Generate API key (free, no credit card required)
4. Add to `.env.local`: `GOOGLE_AI_STUDIO_API_KEY=your_key_here`

### Architecture Integration Points

```
User Input (Prompt/Image)
    ↓
AITextureGenerator.tsx (Client Component)
    ↓ [Layer 1: Check localStorage - 5 free generations]
    ↓
/api/generate-texture (Next.js API Route)
    ↓ [Layer 2: Check IP in Supabase - max 15/day per IP]
    ↓ [Layer 3: Check global counter - max 1,400/day total]
    ↓
Google AI Studio API (Gemini 2.5 Flash Image)
    ↓
Base64 Image or URL returned
    ↓ [Update counters: localStorage, Supabase IP, Supabase global]
    ↓
designStore.setUploadedImageUrl()
    ↓
MugModel.tsx (TextureLoader loads image)
    ↓
MeshPhysicalMaterial.map = texture
    ↓
3D Mug renders with AI-generated texture
```

### Rate Limiting Flow

```
Request arrives at /api/generate-texture
    ↓
1. Check Layer 3 (Global): SELECT total_generations FROM ai_generation_global_counter WHERE date_key = today
   → If >= 1,400: Return 503 "Service at capacity"
    ↓
2. Get client IP address: req.headers['x-forwarded-for'] || req.connection.remoteAddress
    ↓
3. Check Layer 2 (IP): SELECT generation_count FROM ai_generation_limits WHERE ip_address = X AND date_key = today
   → If >= 15: Return 429 "Daily limit reached for your IP"
    ↓
4. Call Google AI Studio API
    ↓
5. On success, increment counters:
   - UPDATE ai_generation_limits SET generation_count = generation_count + 1
   - UPDATE ai_generation_global_counter SET total_generations = total_generations + 1
    ↓
6. Return generated image to client
```

### Environment Variables Required

```env
# .env.local
GOOGLE_AI_STUDIO_API_KEY=your_api_key_here
ENABLE_AI_GENERATION=true  # Feature flag for easy disable

# Rate Limiting Configuration
SESSION_GENERATION_LIMIT=5  # Layer 1: Free generations without IP tracking
IP_GENERATION_LIMIT=15      # Layer 2: Max per IP per day
GLOBAL_GENERATION_LIMIT=1400  # Layer 3: Total across all users (buffer below 1,500)
GLOBAL_WARNING_THRESHOLD=1200  # Warn admins when approaching limit

# Supabase (already configured in project)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # For server-side rate limit queries
```

---

## Success Metrics

### User Engagement
- **Target:** 30%+ of users try AI generation feature
- **Measure:** Analytics event tracking for AI generation clicks

### Generation Success Rate
- **Target:** 95%+ successful generations (no API errors)
- **Measure:** Success/failure ratio from API logs

### User Retention
- **Target:** Users who try AI generation return 2x more often
- **Measure:** Cohort analysis of AI users vs manual-only users

### API Usage
- **Target:** Stay under 1,500 requests/day (free tier limit)
- **Measure:** Daily API call count monitoring

### Performance
- **Target:** <5 second generation time for 90th percentile
- **Measure:** P90 response time from API logs

---

## Future Enhancements (Out of Scope for this Epic)

- **Story 8.4:** Style presets (photorealistic, cartoon, watercolor, etc.)
- **Story 8.5:** Generation history with cloud storage (Supabase)
- **Story 8.6:** Batch generation (multiple variations from one prompt)
- **Story 8.7:** Advanced prompt builder with guided templates
- **Story 8.8:** Social sharing of AI-generated designs
- **Story 8.9:** Upscaling generated images for print quality

---

## Dependencies

- **Epic 5:** 3D Rendering must be working correctly
- **Epic 6:** Texture system must be stable
- **External:** Google AI Studio API availability
- **External:** User has Google account for API key (or we provide one)

---

## Open Questions

1. **API Key Distribution:** Should we provide a shared API key for users, or require each user to bring their own?
   - **Recommendation:** Start with shared key (easier UX), switch to user-provided if we hit limits

2. **Image Storage:** Should we store generated images in Supabase/cloud, or keep as data URLs?
   - **Recommendation:** Start with data URLs (simpler), move to Supabase if persistence needed

3. **Content Moderation:** Do we need to filter prompts or generated images for inappropriate content?
   - **Recommendation:** Start without filtering, add if issues arise (Google API may have built-in filtering)

4. **Prompt Suggestions:** Should we provide example prompts to help users get started?
   - **Recommendation:** Yes, add 5-10 example prompts as clickable chips (e.g., "Watercolor flowers", "Abstract geometric pattern")

---

## Handoff to Story Manager

**Story Manager Handoff:**

Please develop detailed user stories for this brownfield epic. Key considerations:

- **Technology context:** Enhancement to an existing Next.js 14 + React Three Fiber mug customization system
- **Integration points:**
  - `MugModel.tsx` (texture loading with TextureLoader)
  - `ImageUpload.tsx` (existing upload component to extend)
  - `designStore` (Zustand state management)
- **Critical compatibility requirements:**
  - Manual upload must remain fully functional
  - No disruption to existing 3D controls (rotation, color, text)
  - TextureLoader and MeshPhysicalMaterial APIs unchanged
- **API specifics:** Google AI Studio (Gemini 2.5 Flash Image) with 1,500 free requests/day
- **Rate limiting strategy:** Client-side tracking with 50 requests/hour per session limit
- **User experience priorities:**
  - Clear mode switching (Manual | Text-to-Image | Image-to-Image)
  - Fast generation (<5 seconds)
  - Comprehensive error handling with user-friendly messages
  - Preview before applying to mug

Each story must include:
1. Verification that existing manual upload functionality remains intact
2. Testing that generated textures wrap correctly on mug geometry
3. Rate limiting implementation details
4. Error handling for all failure scenarios
5. Rollback strategy via feature flag

The epic should maintain system integrity while delivering AI-powered creative expansion for mug customization.

---

*Generated by Scrum Master Bob 🏃 - Technical Story Preparation Specialist*
