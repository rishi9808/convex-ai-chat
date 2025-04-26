import { useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";

export function WebsiteForm() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // Get already processed documents
  const documents = useQuery(api.messages.listDocuments);
  
  // Action to scrape a website - using useAction instead of useMutation
  const scrapeWebsite = useAction(api.ingest.load.scrapeWebsite);

  // Fixed handleSubmit to address the ESLint TypeScript error
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    // Using void operator to explicitly handle the Promise
    void (async () => {
      try {
        setIsLoading(true);
        setMessage(null);
        
        const result = await scrapeWebsite({ url });
        
        if (result.success) {
          setMessage({ type: "success", text: "Website is being processed..." });
          setUrl("");
        } else {
          setMessage({ type: "error", text: result.message });
        }
      } catch (error) {
        setMessage({ 
          type: "error", 
          text: error instanceof Error ? error.message : "Failed to process website"
        });
      } finally {
        setIsLoading(false);
      }
    })();
  };

  return (
    <div className="my-8">
      <h2 className="text-2xl font-bold mb-4">Train AI with Website Content</h2>
      
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter website URL (https://example.com)"
            className="flex-1 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            required
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Processing..." : "Add Website"}
          </Button>
        </div>
        
        {message && (
          <div className={`mt-2 p-2 rounded-md ${message.type === "success" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"}`}>
            {message.text}
          </div>
        )}
      </form>
      
      <div>
        <h3 className="font-medium mb-2">Processed Websites:</h3>
        {documents === undefined ? (
          <div className="animate-pulse rounded-md bg-black/10 dark:bg-white/10 h-5 w-full max-w-sm"></div>
        ) : documents.length === 0 ? (
          <p className="text-muted-foreground">No websites have been processed yet.</p>
        ) : (
          <ul className="list-disc pl-5 space-y-1">
            {documents.map((doc) => (
              <li key={doc._id} className="text-sm">
                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline dark:text-blue-400">
                  {doc.url}
                </a>
                <span className="text-xs text-muted-foreground ml-2">
                  ({new Date(doc._creationTime).toLocaleString()})
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}