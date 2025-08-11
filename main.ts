import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { serveDir } from "https://deno.land/std@0.208.0/http/file_server.ts";

// Define clean URL routes - serve files directly
const routes: Record<string, string> = {
  "/about": "/about.html",
  "/resume": "/resume.html", 
  "/contact": "/contact.html",
  "/blog": "/blog.html",
  "/drums": "/drums.html",
  "/work": "/work.html",
  "/project-rapaport": "/project-rapaport.html",
  "/project-eagle-rose": "/project-eagle-rose.html",
  "/project-impact-energi": "/project-impact-energi.html",
  "/project-kranorganics": "/project-kranorganics.html",
  "/project-younker-studio": "/project-younker-studio.html",
  "/project-veracity-ads": "/project-veracity-ads.html",
  "/blog-post-1": "/blog-post-1.html",
  "/blog-post-2": "/blog-post-2.html",
  "/blog-post-3": "/blog-post-3.html",
  "/blog-post-4": "/blog-post-4.html",
  "/blog-post-5": "/blog-post-5.html",
  "/blog-post-6": "/blog-post-6.html"
};

async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;

  // Handle clean URL routes - serve the HTML file directly
  if (routes[path]) {
    const filePath = routes[path].substring(1); // Remove leading slash
    try {
      const file = await Deno.readFile(filePath);
      return new Response(file, {
        headers: {
          "content-type": "text/html; charset=utf-8",
        },
      });
    } catch {
      return new Response("Page not found", { status: 404 });
    }
  }

  // Serve static files normally
  return serveDir(req, {
    fsRoot: ".",
    urlRoot: "",
    showDirListing: false,
    showDotfiles: false
  });
}

console.log("🚀 Younker Studio server running");
console.log("📝 Clean URLs working perfectly:");

await serve(handler);
