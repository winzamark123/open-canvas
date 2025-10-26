/**
 * Utility functions for managing guest user image generation limits
 */

// Storage key for guest image generation count
const GUEST_IMAGE_LIMIT_KEY = 'excalidraw-guest-image-count';

// Hard limit for guest users
export const GUEST_IMAGE_GENERATION_LIMIT = 10;

/**
 * Gets the current image generation count for guest users
 */
export const getGuestImageCount = (): number => {
  try {
    const stored = localStorage.getItem(GUEST_IMAGE_LIMIT_KEY);
    return stored ? parseInt(stored, 10) : 0;
  } catch (error) {
    console.error('Failed to get guest image count:', error);
    return 0;
  }
};

/**
 * Increments the guest image generation count
 */
export const incrementGuestImageCount = (): number => {
  try {
    const current = getGuestImageCount();
    const newCount = current + 1;
    localStorage.setItem(GUEST_IMAGE_LIMIT_KEY, newCount.toString());
    return newCount;
  } catch (error) {
    console.error('Failed to increment guest image count:', error);
    return getGuestImageCount();
  }
};

/**
 * Checks if guest user has reached the image generation limit
 */
export const hasGuestReachedLimit = (): boolean => {
  const current = getGuestImageCount();
  return current >= GUEST_IMAGE_GENERATION_LIMIT;
};

/**
 * Gets remaining image generations for guest users
 */
export const getGuestRemainingGenerations = (): number => {
  const current = getGuestImageCount();
  return Math.max(0, GUEST_IMAGE_GENERATION_LIMIT - current);
};

/**
 * Resets the guest image generation count (for testing purposes)
 */
export const resetGuestImageCount = (): void => {
  try {
    localStorage.removeItem(GUEST_IMAGE_LIMIT_KEY);
  } catch (error) {
    console.error('Failed to reset guest image count:', error);
  }
};