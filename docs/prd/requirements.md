# Requirements

### Functional Requirements

**FR1:** The landing page shall display a hero section with clear value proposition, compelling headline about AI-powered mug design, and prominent call-to-action button directing users to the AI designer tool.

**FR2:** The system shall provide AI-powered texture generation using Google AI Studio (Gemini 2.5 Flash Image) with text-to-image and image-to-image modes, creating custom mug designs from text prompts or enhanced uploaded images.

**FR3:** Users shall be able to generate mug textures via text prompts (up to 500 characters) with real-time AI generation, displaying loading states and generated previews within 2-4 seconds.

**FR4:** Users shall be able to upload base images (PNG, JPG, WebP formats) for AI-enhanced image-to-image transformation, combining their designs with AI-powered style modifications.

**FR5:** The AI designer shall include a color picker allowing users to select from 3-5 predefined mug base colors with immediate visual updates to the design preview.

**FR6:** The system shall present an integrated lead capture form after users engage with the AI designer tool, collecting name, email, phone, and project description with validation.

**FR7:** All lead information and associated design preferences (including AI prompts and generation method) shall be automatically stored in Supabase PostgreSQL database for sales follow-up and customer relationship management.

**FR8:** The entire application shall be fully responsive and functional on mobile devices with touch-optimized AI generation controls and simplified interface for small screens.

**FR9:** The system shall integrate Google Analytics to track user behavior, AI generation engagement metrics (success rates, generation method adoption, prompt patterns), and conversion rates from visitors to leads.

**FR10:** Users shall be able to reset their design and start over at any point during the customization process without losing application state.

### Non-Functional Requirements

**NFR1:** The AI designer tool shall load and become interactive within 5 seconds on standard broadband connections to prevent user abandonment.

**NFR2:** The application shall maintain cross-browser compatibility with Chrome 90+, Safari 14+, Firefox 88+, and Edge 90+ on both desktop and mobile devices.

**NFR3:** The system shall handle mobile 4G connections gracefully with optimized AI generation request handling and progressive image loading for slower networks.

**NFR4:** All uploaded images shall be validated for file type, size (max 5MB), and dimensions (resized to 1024x1024 for AI processing) with appropriate error messaging for invalid uploads.

**NFR5:** The Supabase PostgreSQL database shall implement proper data validation, indexing for lead queries, and secure connection protocols (RLS policies) for data protection.

**NFR6:** The application shall implement HTTPS enforcement, CORS configuration, input sanitization, and server-side API key protection for Google AI Studio credentials.

**NFR7:** The lead capture form shall comply with GDPR requirements including clear data usage consent and privacy policy links.

**NFR8:** The AI generation system shall implement multi-layer rate limiting (session: 5 free, IP: 15/day, global: 1,400/day) to prevent API abuse and stay within Google AI Studio free tier limits, with clear quota displays and graceful fallback to manual upload.

**NFR9:** The system architecture shall support horizontal scaling to handle traffic spikes during marketing campaigns without service disruption.

**NFR10:** All user interactions with the AI designer tool shall be logged for analytics (including prompts, generation success/failure, rate limit events) while maintaining user privacy and data minimization principles.

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-09-25 | v1.0 | Initial requirements specification | John (PM) |
| 2025-10-09 | v2.0 | **Epic 8 AI Generation Pivot:** Updated FR1-FR5 to reflect AI-powered texture generation replacing 3D visualization. Changed FR2 from Three.js 3D model to Google AI Studio text-to-image/image-to-image generation. Updated FR3-FR4 for AI generation modes (text prompts and image enhancement). Modified FR7 to specify Supabase PostgreSQL (replacing MongoDB) and AI metadata storage. Updated FR8-FR9 for AI-specific analytics tracking. Rewrote NFR8 to specify multi-layer rate limiting system (session/IP/global). Updated NFR6 to include API key protection requirements. | John (PM) |
