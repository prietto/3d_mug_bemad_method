/**
 * Multi-View Angle Modifiers for Story 9.3
 *
 * Defines different camera angles for mug renders and the prompt modifiers
 * needed to generate each view. Each angle provides a different perspective
 * of the same mug design.
 */

export type ViewAngle = 'front' | 'side' | 'handle';

/**
 * ViewDefinition defines metadata and prompt engineering for each camera angle
 */
export interface ViewDefinition {
  /** Unique angle identifier */
  angle: ViewAngle;

  /** Display name for UI */
  name: string;

  /** Human-readable description */
  description: string;

  /** Prompt modifier to append to base prompt */
  promptModifier: string;

  /** Display order in carousel (1-indexed) */
  order: number;
}

/**
 * VIEW_DEFINITIONS - Complete set of supported camera angles
 *
 * Front: Default view, no modification needed
 * Side: Profile showing handle from 45-degree angle
 * Handle: Close-up detail of handle and curved surface
 */
export const VIEW_DEFINITIONS: Record<ViewAngle, ViewDefinition> = {
  front: {
    angle: 'front',
    name: 'Front View',
    description: 'Main product view',
    promptModifier: '', // No modifier - use base prompt as-is
    order: 1
  },
  side: {
    angle: 'side',
    name: 'Side View',
    description: 'Profile showing handle',
    promptModifier: ', side profile view showing mug handle, 45-degree angle from right, product photography',
    order: 2
  },
  handle: {
    angle: 'handle',
    name: 'Handle Close-Up',
    description: 'Detail view of handle',
    promptModifier: ', close-up detail of handle and curved side surface, product detail shot',
    order: 3
  }
};

/**
 * Get all view definitions sorted by display order
 */
export function getAllViewDefinitions(): ViewDefinition[] {
  return Object.values(VIEW_DEFINITIONS).sort((a, b) => a.order - b.order);
}

/**
 * Get view definition by angle
 * @param angle - View angle identifier
 * @returns ViewDefinition or undefined if not found
 */
export function getViewDefinition(angle: ViewAngle): ViewDefinition | undefined {
  return VIEW_DEFINITIONS[angle];
}

/**
 * Build complete prompt for a specific camera angle
 *
 * @param basePrompt - Base prompt from user (already enhanced by Story 9.1)
 * @param angle - Desired camera angle
 * @returns Complete prompt with angle modifier appended
 *
 * @example
 * const base = "professional product photograph of ceramic coffee mug with: red mug. Studio lighting.";
 * const sidePrompt = buildAnglePrompt(base, 'side');
 * // Returns: "professional product photograph... side profile view showing mug handle..."
 */
export function buildAnglePrompt(basePrompt: string, angle: ViewAngle): string {
  const viewDef = VIEW_DEFINITIONS[angle];

  if (!viewDef) {
    throw new Error(`Invalid view angle: ${angle}`);
  }

  // For front view, return base prompt unchanged
  if (angle === 'front') {
    return basePrompt;
  }

  // For other views, append angle modifier
  return basePrompt + viewDef.promptModifier;
}

/**
 * Get list of additional angles (excludes front which is already generated)
 * @returns Array of ViewAngle for multi-view generation
 */
export function getAdditionalAngles(): ViewAngle[] {
  return ['side', 'handle'];
}

/**
 * Validate angle parameter
 * @param angle - Angle to validate
 * @returns true if valid, false otherwise
 */
export function isValidAngle(angle: string): angle is ViewAngle {
  return angle === 'front' || angle === 'side' || angle === 'handle';
}

/**
 * Get expected number of total views (including front)
 */
export const TOTAL_VIEWS_COUNT = 3;

/**
 * Get number of additional views to generate (excludes front)
 */
export const ADDITIONAL_VIEWS_COUNT = 2;
