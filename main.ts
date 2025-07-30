import { serveDir } from "https://deno.land/std/http/file_server.ts";

Deno.serve((req) => serveDir(req, { fsRoot: "./public" }));
