import { initializeConvexChat } from './aiChat/embed';

// Don't auto-initialize in Next.js
if (typeof window !== 'undefined') {
  // Expose the initialization function globally
  (window as any).ConvexChat = {
    init: initializeConvexChat
  };

  // If auto-initialization is enabled via data attributes
  document.addEventListener('DOMContentLoaded', () => {
    // Look for script tags with auto-init attribute
    const scriptTag = document.querySelector('script[data-convex-auto-init]');
    if (scriptTag && scriptTag.getAttribute('data-convex-auto-init') === 'true') {
      const convexUrl = scriptTag.getAttribute('data-convex-url');
      if (convexUrl) {
        initializeConvexChat({
          convexUrl,
          name: scriptTag.getAttribute('data-name') || undefined,
          infoMessage: scriptTag.getAttribute('data-info-message') || undefined,
          welcomeMessage: scriptTag.getAttribute('data-welcome-message') || undefined,
          position: (scriptTag.getAttribute('data-position') as any) || 'bottom-right'
        });
      } else {
        console.error('ConvexChat: Missing required data-convex-url attribute for auto-initialization');
      }
    }
  });
}