import { ConvexAiChat } from "@/aiChat";
import { Link } from "@/components/typography/link";
import { Button } from "@/components/ui/button";
import { WebsiteForm } from "@/components/WebsiteForm";
import { PdfForm } from "@/components/PdfForm";
import { EmbedCodeGenerator } from "@/components/EmbedCodeGenerator";

function App() {
  return (
    <main className="container max-w-2xl flex flex-col gap-8">
      <h1 className="text-4xl font-extrabold my-8 text-center">
        AI Chat with Convex Vector Search
      </h1>
      
      <WebsiteForm />
      
      <PdfForm />
      
      <div className="border-t border-gray-200 pt-6">
        <p className="mb-4">Ask questions about the website content you've added:</p>
        
        <ConvexAiChat
          convexUrl={import.meta.env.VITE_CONVEX_URL as string}
          name="Knowledge Bot"
          infoMessage="This AI answers based on the website content you've added."
          welcomeMessage="Hi! I can answer questions about the websites you've added. What would you like to know?"
          renderTrigger={(onClick) => (
            <Button onClick={onClick}>Open AI chat</Button>
          )}
        />
      </div>
      
      <div className="border-t border-gray-200 pt-6">
        <EmbedCodeGenerator 
          convexUrl={import.meta.env.VITE_CONVEX_URL as string}
          name="Knowledge Bot"
          infoMessage="This AI answers based on the website content you've added."
          welcomeMessage="Hi! I can answer questions about the websites you've added. What would you like to know?"
        />
      </div>
      
      <p className="mt-4 text-sm text-gray-500">
        Check out{" "}
        <Link target="_blank" href="https://docs.convex.dev/home">
          Convex docs
        </Link>{" "}
        to learn more about vector search.
      </p>
    </main>
  );
}

export default App;
