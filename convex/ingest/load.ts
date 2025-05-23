import { CheerioAPI, load } from "cheerio";
import { v } from "convex/values";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { map } from "modern-async";
import { internal } from "../_generated/api";
import { internalAction, internalMutation, action } from "../_generated/server";
import { Doc } from "../_generated/dataModel";

export const scrapeSite = internalAction({
  args: {
    sitemapUrl: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { sitemapUrl, limit }) => {
    const response = await fetch(sitemapUrl);
    const xml = await response.text();
    const $ = load(xml, { xmlMode: true });
    const urls = $("url > loc")
      .map((_i, elem) => $(elem).text())
      .get()
      .slice(0, limit);
    await map(urls, (url) =>
      ctx.scheduler.runAfter(0, internal.ingest.load.fetchSingle, { url })
    );
  },
});

export const fetchSingle = internalAction({
  args: {
    url: v.string(),
  },
  handler: async (ctx, { url }) => {
    const response = await fetch(url);
    const text = parsePage(await response.text());
    if (text.length > 0) {
      await ctx.runMutation(internal.ingest.load.updateDocument, { url, text });
    }
  },
});

export const updateDocument = internalMutation(
  async (ctx, { url, text }: { url: string; text: string }) => {
    const latestVersion = await ctx.db
      .query("documents")
      .withIndex("byUrl", (q) => q.eq("url", url))
      .order("desc")
      .first();

    const hasChanged = latestVersion === null || latestVersion.text !== text;
    if (hasChanged) {
      const documentId = await ctx.db.insert("documents", { url, text });
      const splitter = RecursiveCharacterTextSplitter.fromLanguage("markdown", {
        chunkSize: 2000,
        chunkOverlap: 100,
      });
      const chunks = await splitter.splitText(text);
      await map(chunks, async (chunk) => {
        await ctx.db.insert("chunks", {
          documentId,
          text: chunk,
          embeddingId: null,
        });
      });
    }
  }
);

export const eraseStaleDocumentsAndChunks = internalMutation({
  args: {
    forReal: v.boolean(),
  },
  handler: async (ctx, args) => {
    const allDocuments = await ctx.db
      .query("documents")
      .order("desc")
      .collect();
    const byUrl: Record<string, Doc<"documents">[]> = {};
    allDocuments.forEach((doc) => {
      byUrl[doc.url] ??= [];
      byUrl[doc.url].push(doc);
    });
    await map(Object.values(byUrl), async (docs) => {
      if (docs.length > 1) {
        await map(docs.slice(1), async (doc) => {
          const chunks = await ctx.db
            .query("chunks")
            .withIndex("byDocumentId", (q) => q.eq("documentId", doc._id))
            .collect();
          if (args.forReal) {
            await ctx.db.delete(doc._id);
            await map(chunks, (chunk) => ctx.db.delete(chunk._id));
          } else {
            console.log(
              "Would delete",
              doc._id,
              doc.url,
              new Date(doc._creationTime),
              "chunk count: " + chunks.length
            );
          }
        });
      }
    });
  },
});

export const scrapeWebsite = action({
  args: {
    url: v.string(),
  },
  handler: async (ctx, { url }) => {
    try {
      // First, check if URL is valid
      new URL(url);
      
      // Fetch and process the single page
      await ctx.scheduler.runAfter(0, internal.ingest.load.fetchSingle, { url });
      
      // Start the embedding process for any new chunks
      await ctx.scheduler.runAfter(1000, internal.ingest.embed.embedAll, {});
      
      return { success: true, message: "Website scraping initiated" };
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : "Invalid URL or scraping failed" 
      };
    }
  },
});

function parsePage(text: string) {
  const $ = load(text);
  // Try to get content from common content containers, or fall back to body
  const content = $("main").length 
    ? $("main") 
    : $("article").length 
      ? $("article") 
      : $(".content, .markdown").length 
        ? $(".content, .markdown") 
        : $("body");
  
  return parse($, content)
    .replace(/(?:\n\s+){3,}/g, "\n\n")
    .trim();
}

function parse($: CheerioAPI, element: any) {
  let result = "";

  $(element)
    .contents()
    .each((_, el) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
      if (el.type === "text") {
        result += $(el).text().trim() + " ";
        return;
      }
      const tagName = (el as any).tagName;
      switch (tagName) {
        case "code":
          if ($(el).has("span").length > 0) {
            result +=
              "```\n" +
              $(el)
                .children()
                .map((_, line) => $(line).text())
                .get()
                .join("\n") +
              "\n```\n";
            return;
          }
          result += " `" + $(el).text() + "` ";
          return;
        case "a": {
          if ($(el).hasClass("hash-link")) {
            return;
          }
          let href = $(el).attr("href")!;
          if (href.startsWith("/")) {
            href = "https://docs.convex.dev" + href;
          }
          result += " [" + $(el).text() + "](" + href + ") ";
          return;
        }
        case "strong":
        case "em":
          result += " " + $(el).text() + " ";
          return;
        case "h1":
        case "h2":
        case "h3":
        case "h4":
        case "h5":
          result += "#".repeat(+tagName.slice(1)) + " " + $(el).text() + "\n\n";
          return;
      }
      result += parse($, el);
      result += "\n\n";
    });

  return result;
}
