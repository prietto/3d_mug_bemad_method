/**
 * Mug Template Definitions for Story 9.2
 *
 * These templates provide pre-defined prompts for AI mug generation,
 * reducing "blank slate paralysis" for users. Each template is a starting
 * point that users can customize before generating.
 */

export type TemplateCategory =
  | 'corporate'
  | 'casual'
  | 'artistic'
  | 'minimalist'
  | 'photo'
  | 'vintage'
  | 'holiday';

/**
 * MugTemplate interface defines the structure of a template preset
 */
export interface MugTemplate {
  /** Unique identifier for the template */
  id: string;

  /** Display name shown to users */
  name: string;

  /** Short description of the template style */
  description: string;

  /** AI generation prompt (will be enhanced by prompt engineering) */
  prompt: string;

  /** Path to thumbnail image in public directory */
  thumbnail: string;

  /** Template category for filtering/organization */
  category: TemplateCategory;

  /** Optional search tags */
  tags?: string[];
}

/**
 * Curated collection of mug design templates
 *
 * These templates cover key use cases identified in user research:
 * - Corporate/professional branding
 * - Casual everyday designs
 * - Artistic/creative expressions
 * - Minimalist aesthetics
 * - Photo-based customization
 */
export const MUG_TEMPLATES: MugTemplate[] = [
  {
    id: 'classic-white',
    name: 'Classic White',
    description: 'Simple elegant white ceramic mug perfect for any occasion',
    prompt: 'clean white ceramic coffee mug with simple elegant design, minimalist style, smooth matte finish',
    thumbnail: '/templates/classic-white.webp',
    category: 'minimalist',
    tags: ['white', 'simple', 'elegant', 'classic']
  },
  {
    id: 'colorful-abstract',
    name: 'Colorful Abstract',
    description: 'Vibrant abstract geometric patterns in multiple colors',
    prompt: 'vibrant ceramic mug with abstract geometric patterns in multiple bold colors, modern artistic style, energetic design',
    thumbnail: '/templates/colorful-abstract.webp',
    category: 'artistic',
    tags: ['colorful', 'abstract', 'geometric', 'vibrant', 'modern']
  },
  {
    id: 'minimalist-line',
    name: 'Minimalist Line',
    description: 'Clean modern design with single accent line',
    prompt: 'minimalist ceramic mug with single color accent line, Scandinavian design aesthetic, clean composition',
    thumbnail: '/templates/minimalist-line.webp',
    category: 'minimalist',
    tags: ['minimalist', 'scandinavian', 'line', 'accent', 'modern']
  },
  {
    id: 'watercolor-floral',
    name: 'Watercolor Floral',
    description: 'Hand-painted watercolor flowers with soft colors',
    prompt: 'ceramic mug with watercolor floral design, artistic hand-painted style, soft pastel colors, delicate flowers',
    thumbnail: '/templates/watercolor-floral.webp',
    category: 'artistic',
    tags: ['watercolor', 'floral', 'flowers', 'artistic', 'handpainted']
  },
  {
    id: 'corporate-pro',
    name: 'Corporate Pro',
    description: 'Professional design with clean logo placement area',
    prompt: 'professional white ceramic mug with clean logo area, corporate branding style, business appropriate, elegant simplicity',
    thumbnail: '/templates/corporate-pro.webp',
    category: 'corporate',
    tags: ['corporate', 'professional', 'business', 'logo', 'branding']
  },
  {
    id: 'vintage-retro',
    name: 'Vintage Retro',
    description: 'Nostalgic retro design with distressed texture',
    prompt: 'ceramic mug with vintage retro design aesthetic, nostalgic color palette, distressed texture, 1970s inspired',
    thumbnail: '/templates/vintage-retro.webp',
    category: 'vintage',
    tags: ['vintage', 'retro', 'nostalgic', '70s', 'distressed']
  },
  {
    id: 'photo-collage',
    name: 'Photo Collage',
    description: 'Personal photo-based design for memories',
    prompt: 'ceramic mug designed for personal photo collage, photo-friendly layout, memory keeping style, scrapbook aesthetic',
    thumbnail: '/templates/photo-collage.webp',
    category: 'photo',
    tags: ['photo', 'personal', 'memories', 'collage', 'custom']
  }
];

/**
 * Get template by ID
 * @param id - Template identifier
 * @returns MugTemplate or undefined if not found
 */
export function getTemplateById(id: string): MugTemplate | undefined {
  return MUG_TEMPLATES.find(template => template.id === id);
}

/**
 * Get templates by category
 * @param category - Template category filter
 * @returns Array of templates matching the category
 */
export function getTemplatesByCategory(category: TemplateCategory): MugTemplate[] {
  return MUG_TEMPLATES.filter(template => template.category === category);
}

/**
 * Validate template data structure
 * @param template - Template object to validate
 * @returns true if valid, throws error if invalid
 */
export function validateTemplate(template: MugTemplate): boolean {
  if (!template.id || typeof template.id !== 'string') {
    throw new Error('Template must have a valid id');
  }

  if (!template.name || typeof template.name !== 'string') {
    throw new Error('Template must have a valid name');
  }

  if (!template.description || typeof template.description !== 'string') {
    throw new Error('Template must have a valid description');
  }

  if (!template.prompt || typeof template.prompt !== 'string') {
    throw new Error('Template must have a valid prompt');
  }

  if (template.prompt.length < 3 || template.prompt.length > 500) {
    throw new Error('Template prompt must be between 3 and 500 characters');
  }

  if (!template.thumbnail || typeof template.thumbnail !== 'string') {
    throw new Error('Template must have a valid thumbnail path');
  }

  if (!template.category) {
    throw new Error('Template must have a valid category');
  }

  const validCategories: TemplateCategory[] = ['corporate', 'casual', 'artistic', 'minimalist', 'photo', 'vintage', 'holiday'];
  if (!validCategories.includes(template.category)) {
    throw new Error(`Template category must be one of: ${validCategories.join(', ')}`);
  }

  return true;
}

/**
 * Validate all templates in the collection
 * @returns true if all valid, throws error on first invalid template
 */
export function validateAllTemplates(): boolean {
  const ids = new Set<string>();
  const names = new Set<string>();

  for (const template of MUG_TEMPLATES) {
    // Validate structure
    validateTemplate(template);

    // Check for duplicate IDs
    if (ids.has(template.id)) {
      throw new Error(`Duplicate template ID found: ${template.id}`);
    }
    ids.add(template.id);

    // Check for duplicate names
    if (names.has(template.name)) {
      throw new Error(`Duplicate template name found: ${template.name}`);
    }
    names.add(template.name);
  }

  return true;
}
