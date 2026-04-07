"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    SwaggerUIBundle?: (config: Record<string, unknown>) => void;
  }
}

export default function SwaggerPage() {
  useEffect(() => {
    async function loadSwagger() {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/swagger-ui-dist/swagger-ui.css";
      document.head.appendChild(link);

      const script = document.createElement("script");
      script.src = "https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js";
      script.onload = () => {
        window.SwaggerUIBundle?.({
          url: "/api/openapi",
          dom_id: "#swagger-ui",
        });
      };

      document.body.appendChild(script);
    }

    loadSwagger();
  }, []);

  return (
    <main style={{ padding: 24 }}>
      <h1>そなえアレ API Docs</h1>
      <div id="swagger-ui" />
    </main>
  );
}