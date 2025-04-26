import { ConvexAiChatDialog } from "./index";
import * as ReactDOM from "react-dom/client";

// This function will be exposed globally for the embed script
function initializeConvexChat(config: {
  convexUrl: string;
  name?: string;
  infoMessage?: string;
  welcomeMessage?: string;
  buttonText?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}) {
  // Create stylesheet for the button
  const style = document.createElement('style');
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
  
  // Create chat button
  const button = document.createElement('button');
  button.className = `convex-chat-button ${config.position || 'bottom-right'}`;
  button.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  `;
  
  // Create container for chat dialog
  const container = document.createElement('div');
  container.id = 'convex-chat-container';
  document.body.appendChild(container);
  document.body.appendChild(button);
  
  // Initialize React
  let dialogOpen = false;
  
  button.addEventListener('click', () => {
    dialogOpen = !dialogOpen;
    render();
  });
  
  function render() {
    const root = ReactDOM.createRoot(container);
    root.render(
      <ConvexAiChatDialog
        convexUrl={config.convexUrl}
        infoMessage={config.infoMessage || "Ask questions about the content."}
        isOpen={dialogOpen}
        name={config.name || "Knowledge Bot"}
        welcomeMessage={config.welcomeMessage || "Hi! How can I help you?"}
        onClose={() => {
          dialogOpen = false;
          render();
        }}
      />
    );
  }
  
  // Initial render
  render();
  
  // Return API for controlling the chat
  return {
    open: () => {
      dialogOpen = true;
      render();
    },
    close: () => {
      dialogOpen = false;
      render();
    },
    toggle: () => {
      dialogOpen = !dialogOpen;
      render();
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