import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import fs from "fs";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for large payloads (images)
  app.use(express.json({ limit: "50mb" }));

  // API Route for Background Removal using Remove.bg
  app.post("/api/remove-bg", async (req, res) => {
    const { image } = req.body; // Base64 string
    const API_KEY = process.env.REMOVE_BG_API_KEY;

    if (!API_KEY) {
      return res.status(500).json({ error: "REMOVE_BG_API_KEY is not configured on the server." });
    }

    if (!image) {
      return res.status(400).json({ error: "No image data provided." });
    }

    try {
      // Remove base64 prefix if present
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      
      // Use FormData if available (Node 18+), otherwise fallback or use URLSearchParams carefully
      const formData = new URLSearchParams();
      formData.append("size", "auto");
      formData.append("image_file_b64", base64Data);

      console.log("Sending request to Remove.bg...");
      const response = await fetch("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: {
          "X-Api-Key": API_KEY,
        },
        body: formData, // fetch will set the correct Content-Type for URLSearchParams or FormData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Could not parse error response" }));
        console.error("Remove.bg API error response:", errorData);
        return res.status(response.status).json({ 
          error: errorData.errors?.[0]?.detail || errorData.message || "Remove.bg API failed" 
        });
      }

      const resultBlob = await response.arrayBuffer();
      console.log("Background removal successful, sending result back.");
      res.setHeader("Content-Type", "image/png");
      res.send(Buffer.from(resultBlob));
    } catch (error: any) {
      console.error("Background removal proxy error:", error);
      res.status(500).json({ error: "Internal server error during background removal." });
    }
  });

  // API to check if the API key is configured
  app.get("/api/config", (req, res) => {
    res.json({
      hasRemoveBgKey: !!process.env.REMOVE_BG_API_KEY,
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
