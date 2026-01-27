/**
 * API Route Test Helpers
 * Utilities for testing Next.js API routes
 */

import { NextRequest } from "next/server";

/**
 * Create a mock NextRequest for testing API routes
 */
export function createMockRequest(
  url: string,
  options: {
    method?: string;
    body?: Record<string, unknown>;
    headers?: Record<string, string>;
  } = {}
): NextRequest {
  const { method = "GET", body, headers = {} } = options;
  
  const request = new Request(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  }) as unknown as NextRequest;

  // Add NextRequest-specific properties
  Object.defineProperty(request, "nextUrl", {
    get() {
      return new URL(url, "http://localhost:3000");
    },
  });

  return request;
}

/**
 * Create mock route params
 */
export function createMockParams(params: Record<string, string>): Promise<Record<string, string>> {
  return Promise.resolve(params);
}

/**
 * Parse JSON response from API route
 */
export async function parseJSON(response: Response): Promise<unknown> {
  return response.json();
}

/**
 * Type for API route handler
 */
export type APIRouteHandler = (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => Promise<Response>;

/**
 * Test utilities for API routes
 */
export const apiTestUtils = {
  createMockRequest,
  createMockParams,
  parseJSON,
};