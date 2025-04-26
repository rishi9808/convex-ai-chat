import { useState, useRef } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { extractTextFromPdf } from "@/lib/pdf";

export function PdfForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // Get all documents (including PDFs)
  const documents = useQuery(api.messages.listDocuments);
  
  // Filter only PDF documents
  const pdfDocuments = documents?.filter(doc => doc.url.startsWith('pdf:')) || [];
  
  // Action to store PDF content
  const storePdfContent = useAction(api.ingest.pdf.process.storePdfText);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const fileInput = fileInputRef.current;
    if (!fileInput?.files?.length) {
      setMessage({ type: "error", text: "Please select a PDF file" });
      return;
    }
    
    const file = fileInput.files[0];
    if (!file.type.includes('pdf')) {
      setMessage({ type: "error", text: "Only PDF files are supported" });
      return;
    }
    
    // Using void operator to explicitly handle the Promise
    void (async () => {
      try {
        setIsLoading(true);
        setMessage(null);
        
        // Read the file as ArrayBuffer
        const reader = new FileReader();
        
        reader.onload = async (event) => {
          try {
            // The result contains the file as ArrayBuffer
            const arrayBuffer = event.target?.result as ArrayBuffer;
            
            if (!arrayBuffer) {
              setMessage({ type: "error", text: "Failed to read PDF file" });
              setIsLoading(false);
              return;
            }
            
            // Process the PDF using our utility function
            const { text, numPages } = await extractTextFromPdf(arrayBuffer);
            
            // Store the extracted text in Convex
            const result = await storePdfContent({
              fileName: file.name,
              text
            });
            
            if (result.success) {
              setMessage({ 
                type: "success", 
                text: `${result.message} (${numPages} pages)` 
              });
              // Reset file input
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            } else {
              setMessage({ type: "error", text: result.message });
            }
          } catch (error) {
            setMessage({ 
              type: "error", 
              text: error instanceof Error ? error.message : "Failed to process PDF" 
            });
          } finally {
            setIsLoading(false);
          }
        };
        
        reader.onerror = () => {
          setMessage({ type: "error", text: "Error reading the file" });
          setIsLoading(false);
        };
        
        // Start reading the file
        reader.readAsArrayBuffer(file);
        
      } catch (error) {
        setMessage({ 
          type: "error", 
          text: error instanceof Error ? error.message : "Failed to process PDF" 
        });
        setIsLoading(false);
      }
    })();
  };

  return (
    <div className="my-8">
      <h2 className="text-2xl font-bold mb-4">Train AI with PDF Documents</h2>
      
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="flex-1 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            required
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Processing..." : "Upload PDF"}
          </Button>
        </div>
        
        {message && (
          <div className={`mt-2 p-2 rounded-md ${message.type === "success" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"}`}>
            {message.text}
          </div>
        )}
      </form>
      
      <div>
        <h3 className="font-medium mb-2">Processed PDFs:</h3>
        {documents === undefined ? (
          <div className="animate-pulse rounded-md bg-black/10 dark:bg-white/10 h-5 w-full max-w-sm"></div>
        ) : pdfDocuments.length === 0 ? (
          <p className="text-muted-foreground">No PDF files have been processed yet.</p>
        ) : (
          <ul className="list-disc pl-5 space-y-1">
            {pdfDocuments.map((doc) => (
              <li key={doc._id} className="text-sm">
                <span className="text-blue-600 dark:text-blue-400">
                  {doc.url.replace('pdf:', '')}
                </span>
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