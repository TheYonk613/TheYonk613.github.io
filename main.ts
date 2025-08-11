import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { serveDir } from "https://deno.land/std@0.208.0/http/file_server.ts";

// Define clean URL routes
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

  // Handle clean URL routes
  if (routes[path]) {
    const redirectUrl = new URL(routes[path], url);
    return new Response(null, {
      status: 302,
      headers: {
        "Location": redirectUrl.pathname + url.search
      }
    });
  }

  // Serve static files
  return serveDir(req, {
    fsRoot: ".",
    urlRoot: "",
    showDirListing: false,
    showDotfiles: false
  });
}

console.log("🚀 Younker Studio server running on http://localhost:8000");
console.log("📝 Clean URLs enabled:");
Object.keys(routes).forEach(route => {
  console.log(`   ${route} → ${routes[route]}`);
});

await serve(handler, { port: 8000 });
