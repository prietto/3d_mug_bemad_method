# Epic List

**Epic 1: Foundation & Core 3D Infrastructure** _(DEPRECATED - Epic 8)_
**Status:** ⚠️ Deprecated | **Reason:** Replaced by AI Generation Engine in Epic 8
Establish project setup, core 3D visualization capability, and basic user interaction - delivering immediate technical proof-of-concept while building essential development foundation.

**Epic 2: Interactive Design Experience** _(DEPRECATED - Epic 8)_
**Status:** ⚠️ Deprecated | **Reason:** Manual upload preserved as fallback; AI generation is primary method
Enable full customization workflow with image uploads, color selection, and text addition - creating the engaging user experience that drives lead conversion.

**Epic 3: Lead Capture & Analytics Integration**
**Status:** ✅ Complete | **Note:** Extended with AI-specific analytics in Epic 8
Implement lead generation functionality with database storage, form validation, and analytics tracking - completing the business value proposition and measurement capabilities.

**Epic 4: Single-Page Minimalist UX Transformation**
**Status:** ✅ Complete | **Note:** UX patterns applied to AI generation interface in Epic 8
Refactor the multi-screen landing page into a unified single-page experience with split-screen layout, eliminating navigation friction and presenting the AI tool and lead form simultaneously for improved conversion.

**Epic 5: 3D Rendering Troubleshooting & Component Refactor** _(DEPRECATED - Epic 8)_
**Status:** ⚠️ Deprecated | **Reason:** 3D rendering replaced by AI texture generation with static previews
Resolve critical rendering issues preventing 3D mug display and establish simplified component architecture for maintainable feature development. Addresses technical debt from initial implementation and creates foundation for incremental feature additions.

**Epic 6: 3D Visual Quality Improvements** _(DEPRECATED - Epic 8)_
**Status:** ⚠️ Deprecated | **Reason:** 3D visual rendering no longer needed; AI generates final textures
Improve the visual quality and realism of the 3D mug customization experience by fixing geometry and texture rendering issues that create an unprofessional appearance. Eliminates visible gap between uploaded images and mug surface through radius correction.

**Epic 7: 3D UX & Controls Enhancement** _(DEPRECATED - Epic 8)_
**Status:** ⚠️ Deprecated | **Reason:** 3D controls replaced by AI generation interface (prompts, mode toggles, quota display)
Enhance the 3D mug customizer user experience by improving controls layout, image positioning capabilities, and maintaining visual context during customization. Addresses UX friction where canvas scrolls out of view and image scaling is limited to height only.

**Epic 8: AI-Powered Mug Texture Generation** _(SUPERSEDED by Epic 9)_
**Status:** ⚠️ Superseded | **Reason:** Initial AI-first planning; replaced by refined Epic 9 scope
Replace the current limited manual image upload system with AI-powered texture generation using Google AI Studio (Gemini 2.5 Flash Image). Enable users to create custom mug designs through text prompts and AI-enhanced image uploads, dramatically expanding creative possibilities while maintaining existing 3D rendering infrastructure.

**Note:** This epic's original vision was scoped for incremental AI addition to 3D system. Epic 9 represents the full AI-first pivot with complete architectural transformation.

**Epic 9: AI-First Mug Design Experience**
**Status:** 📝 In Progress | **Priority:** Critical | **Dependencies:** None (greenfield pivot)
Complete architectural pivot from 3D visualization to AI-powered texture generation as the primary mug design method. Implement Google AI Studio (Gemini 2.5 Flash Image) text-to-image and image-to-image generation with multi-layer rate limiting, real-time quota tracking, and comprehensive analytics. Manual upload preserved as graceful fallback mechanism.

**Key Deliverables:**
- AI Generation Engine (text-to-image and image-to-image modes)
- Multi-layer rate limiting (session: 5 free, IP: 15/day, global: 1,400/day)
- Google AI Studio API integration via server-side route (/api/generate-texture)
- Real-time quota display with reset timers
- Supabase rate limiting tables (ai_generation_limits, ai_generation_global_counter)
- AI-specific analytics events (generation success/failure, method toggle, quota warnings)
- Manual upload fallback UI with clear mode switching
- Design data model extended with AI fields (generationMethod, aiPrompt, baseImageUrl)
- Comprehensive error handling (API failures, rate limits, network issues)
- Mobile-optimized AI generation interface

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-09-25 | v1.0 | Initial epic list creation (Epics 1-4) | John (PM) |
| 2025-10-05 | v1.1 | Added Epics 5-8 (3D improvements and AI integration planning) | John (PM) |
| 2025-10-09 | v2.0 | **Epic 8 AI Generation Pivot:** Deprecated Epics 1, 2, 5, 6, 7 (3D-focused work replaced by AI generation). Superseded Epic 8 with refined Epic 9 (AI-First Mug Design Experience). Updated Epic 3 and Epic 4 status with AI extension notes. Complete architectural shift from incremental AI addition to full AI-first approach with 3D as deprecated technology. | John (PM) |
