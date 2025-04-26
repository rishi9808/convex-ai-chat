import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface EmbedCodeGeneratorProps {
  convexUrl: string;
  name?: string;
  infoMessage?: string;
  welcomeMessage?: string;
}

export function EmbedCodeGenerator({
  convexUrl,
  name = "Knowledge Bot",
  infoMessage = "This AI answers based on the website content you've added.",
  welcomeMessage = "Hi! I can answer questions about the websites you've added. What would you like to know?"
}: EmbedCodeGeneratorProps) {
  const [copied, setCopied] = useState(false);
  const [position, setPosition] = useState<'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'>('bottom-right');
  const [customBot, setCustomBot] = useState({
    name,
    infoMessage,
    welcomeMessage
  });
  const [embedType, setEmbedType] = useState<'script' | 'attributes'>('script');
  
  // Generate the embed code
  const generateEmbedCode = () => {
    // URL to your deployed app's embed script
    const scriptUrl = window.location.origin + '/embed.js';
    
    if (embedType === 'script') {
      return `
<!-- Convex AI Chat Widget -->
<script src="${scriptUrl}"></script>
<script>
  document.addEventListener('DOMContentLoaded', function() {
    ConvexChat.init({
      convexUrl: "${convexUrl}",
      name: "${customBot.name}",
      infoMessage: "${customBot.infoMessage}",
      welcomeMessage: "${customBot.welcomeMessage}",
      position: "${position}"
    });
  });
</script>
`.trim();
    } else {
      return `
<!-- Convex AI Chat Widget -->
<script 
  src="${scriptUrl}"
  data-convex-auto-init="true"
  data-convex-url="${convexUrl}"
  data-name="${customBot.name}"
  data-info-message="${customBot.infoMessage}"
  data-welcome-message="${customBot.welcomeMessage}"
  data-position="${position}">
</script>
`.trim();
    }
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateEmbedCode())
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy code: ', err);
      });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCustomBot(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="my-8">
      <h2 className="text-2xl font-bold mb-4">Embed AI Chat on Your Website</h2>
      
      <div className="space-y-4 mb-6">
        <h3 className="text-md font-semibold">Customize Your Chat Bot</h3>
        
        <div>
          <label className="block text-sm font-medium mb-1">Bot Name</label>
          <input
            type="text"
            name="name"
            value={customBot.name}
            onChange={handleInputChange}
            className="rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm w-full"
            placeholder="Knowledge Bot"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Info Message</label>
          <input
            type="text"
            name="infoMessage"
            value={customBot.infoMessage}
            onChange={handleInputChange}
            className="rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm w-full"
            placeholder="This AI answers based on the website content you've added."
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Welcome Message</label>
          <textarea
            name="welcomeMessage"
            value={customBot.welcomeMessage}
            onChange={handleInputChange}
            rows={2}
            className="rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm w-full"
            placeholder="Hi! I can answer questions about the websites you've added. What would you like to know?"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Chat Button Position</label>
          <select 
            className="rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm w-full"
            value={position}
            onChange={(e) => setPosition(e.target.value as any)}
          >
            <option value="bottom-right">Bottom Right</option>
            <option value="bottom-left">Bottom Left</option>
            <option value="top-right">Top Right</option>
            <option value="top-left">Top Left</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Embed Type</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={embedType === 'script'}
                onChange={() => setEmbedType('script')}
                className="h-4 w-4"
              />
              <span>JavaScript Initialization</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={embedType === 'attributes'}
                onChange={() => setEmbedType('attributes')}
                className="h-4 w-4"
              />
              <span>Data Attributes</span>
            </label>
          </div>
        </div>
      </div>
      
      <div className="bg-neutral-100 dark:bg-neutral-900 p-4 rounded-md overflow-x-auto mb-4">
        <pre className="text-sm whitespace-pre-wrap">{generateEmbedCode()}</pre>
      </div>
      
      <Button onClick={copyToClipboard}>
        {copied ? "Copied!" : "Copy Embed Code"}
      </Button>
      
      <div className="mt-4 text-sm text-muted-foreground">
        <p>Add this code to any website to embed the AI chat widget. The chatbot will have access to all the content you've added to the knowledge base.</p>
        <p className="mt-2">Make sure to deploy your application to a public URL for the embed to work properly on other websites.</p>
      </div>
    </div>
  );
}