import { NextResponse } from "next/server";

const spec = {
  openapi: "3.0.0",
  info: {
    title: "RM Talking Copilot API",
    version: "1.0.0",
    description:
      "Backend APIs for the RM Talking Copilot — AI-powered relationship manager assistant.",
  },
  servers: [{ url: process.env.NEXT_PUBLIC_APP_URL ?? "" }],
  paths: {
    "/api/clients": {
      get: {
        summary: "List all clients",
        description:
          "Returns all clients. Pass `?id=<clientId>` to fetch a single client with their recent interactions.",
        parameters: [
          {
            name: "id",
            in: "query",
            required: false,
            schema: { type: "string" },
            description: "Client ID to fetch a single client with interactions",
          },
        ],
        responses: {
          "200": {
            description: "Success",
            content: {
              "application/json": {
                schema: {
                  oneOf: [
                    {
                      type: "object",
                      properties: {
                        clients: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              id: { type: "string" },
                              name: { type: "string" },
                              profile: { type: "object" },
                            },
                          },
                        },
                      },
                    },
                    {
                      type: "object",
                      properties: {
                        client: { type: "object" },
                        interactions: { type: "array", items: { type: "object" } },
                      },
                    },
                  ],
                },
              },
            },
          },
          "404": { description: "Client not found" },
        },
      },
    },
    "/api/assist": {
      post: {
        summary: "Ask a question about a client (streaming)",
        description:
          "Streams an AI-generated answer grounded in the client's profile and relevant documents. Response is a text stream (SSE). Check the `x-sources` response header (URL-decoded JSON) for cited sources.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["clientId", "question"],
                properties: {
                  clientId: { type: "string", example: "demo-rm" },
                  question: {
                    type: "string",
                    example: "What is this client's risk tolerance?",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Streamed text response",
            headers: {
              "x-sources": {
                description:
                  "URL-encoded JSON array of sources: [{source: string, type: string}]",
                schema: { type: "string" },
              },
            },
            content: { "text/plain": { schema: { type: "string" } } },
          },
          "400": { description: "clientId and question are required" },
          "404": { description: "Client not found" },
        },
      },
    },
    "/api/brief": {
      post: {
        summary: "Generate a client brief (streaming)",
        description:
          "Streams an AI-generated pre-meeting brief based on the client's profile and recent interactions. Response is a text stream. Check the `x-sources` header for cited sources.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["clientId"],
                properties: {
                  clientId: { type: "string", example: "demo-rm" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Streamed text response",
            headers: {
              "x-sources": {
                description:
                  "URL-encoded JSON array of sources: [{source: string, type: string}]",
                schema: { type: "string" },
              },
            },
            content: { "text/plain": { schema: { type: "string" } } },
          },
          "400": { description: "clientId is required" },
          "404": { description: "Client not found" },
        },
      },
    },
  },
};

export async function GET() {
  return NextResponse.json(spec);
}
