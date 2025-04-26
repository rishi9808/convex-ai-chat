import { ConvexAiChatDialog } from "./index";

// This function will be exposed globally for the embed script
function initializeConvexChat(config: {
  convexUrl: string;
  name?: string;
  infoMessage?: string;
  welcomeMessage?: string;
  buttonText?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}) {
  // Ensure we're running in the browser
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    console.warn('ConvexChat: Cannot initialize in a non-browser environment');
    return;
  }

  // Load React and ReactDOM if they're not already available
  const loadDependencies = async () => {
    // Check if React and ReactDOM are already available
    if (!(window as any).React || !(window as any).ReactDOM) {
      // Create script elements to load React and ReactDOM from CDN
      const loadScript = (url: string): Promise<void> => {
        return new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = url;
          script.async = true;
          script.onload = () => resolve();
          script.onerror = reject;
          document.head.appendChild(script);
        });
      };

      try {
        // Load React and ReactDOM from CDN
        await loadScript('https://unpkg.com/react@18/umd/react.production.min.js');
        await loadScript('https://unpkg.com/react-dom@18/umd/react-dom.production.min.js');
      } catch (error) {
        console.error('ConvexChat: Failed to load dependencies', error);
        return false;
      }
    }
    return true;
  };

  // Create container ID with a unique identifier to avoid conflicts
  const containerId = 'convex-chat-container-' + Math.random().toString(36).substring(2, 11);
  const buttonId = 'convex-chat-button-' + Math.random().toString(36).substring(2, 11);

  // Create and append stylesheet with a unique class prefix to avoid conflicts
  const styleId = 'convex-chat-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .convex-chat-button {
        position: fixed;
        z-index: 9999;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background-color: #0284c7;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        border: none;
        transition: all 0.2s ease;
      }
      .convex-chat-button:hover {
        transform: scale(1.05);
        background-color: #0369a1;
      }
      .convex-chat-button svg {
        width: 24px;
        height: 24px;
      }
      .convex-chat-button.bottom-right {
        bottom: 20px;
        right: 20px;
      }
      .convex-chat-button.bottom-left {
        bottom: 20px;
        left: 20px;
      }
      .convex-chat-button.top-right {
        top: 20px;
        right: 20px;
      }
      .convex-chat-button.top-left {
        top: 20px;
        left: 20px;
      }
    `;
    document.head.appendChild(style);
  }
  
  // Create chat button
  const button = document.createElement('button');
  button.id = buttonId;
  button.className = `convex-chat-button ${config.position || 'bottom-right'}`;
  button.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  `;
  
  // Create container for chat dialog
  const container = document.createElement('div');
  container.id = containerId;
  
  // Initialize React component state
  let dialogOpen = false;
  let root: any = null;
  
  // The actual initialization function
  const initialize = async () => {
    if (!await loadDependencies()) {
      return;
    }
    
    // Append elements to DOM
    document.body.appendChild(container);
    document.body.appendChild(button);
    
    // Import ReactDOM dynamically
    const ReactDOM = (window as any).ReactDOM;
    if (!ReactDOM) {
      console.error('ConvexChat: ReactDOM is not available');
      return;
    }
    
    // Set up button click handler
    button.addEventListener('click', () => {
      dialogOpen = !dialogOpen;
      render();
    });
    
    // Create render function using the loaded dependencies
    function render() {
      try {
        const React = (window as any).React;
        if (!root) {
          root = ReactDOM.createRoot(container);
        }
        
        // We need to use React.createElement instead of JSX since this will be compiled to a standalone JS file
        root.render(
          React.createElement(ConvexAiChatDialog, {
            convexUrl: config.convexUrl,
            infoMessage: config.infoMessage || "Ask questions about the content.",
            isOpen: dialogOpen,
            name: config.name || "Knowledge Bot",
            welcomeMessage: config.welcomeMessage || "Hi! How can I help you?",
            onClose: () => {
              dialogOpen = false;
              render();
            }
          })
        );
      } catch (error) {
        console.error('ConvexChat: Failed to render chat dialog', error);
      }
    }
    
    // Try initial render
    render();
  };
  
  // Initialize when document is ready
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    void initialize().catch(error => {
      console.error('ConvexChat: Failed to initialize', error);
    });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      void initialize().catch(error => {
        console.error('ConvexChat: Failed to initialize', error);
      });
    });
  }
  
  // Return API for controlling the chat with cleanup function
  return {
    open: () => {
      dialogOpen = true;
      if (root) root.render();
    },
    close: () => {
      dialogOpen = false;
      if (root) root.render();
    },
    toggle: () => {
      dialogOpen = !dialogOpen;
      if (root) root.render();
    },
    remove: () => {
      if (root) {
        root.unmount();
        root = null;
      }
      const buttonElement = document.getElementById(buttonId);
      const containerElement = document.getElementById(containerId);
      if (buttonElement) buttonElement.remove();
      if (containerElement) containerElement.remove();
    }
  };
}

// Add to window object when script is loaded via <script> tag
if (typeof window !== 'undefined') {
  (window as any).ConvexChat = {
    init: initializeConvexChat
  };
}

export { initializeConvexChat };