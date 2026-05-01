"use client";

/**
 * Utility to report errors and bugs to the telemetry system.
 * This saves the incident to the database for developer review.
 */
export async function reportIncident(params: {
  message: string;
  category: 'bug' | 'error' | 'ui_failure';
  stack?: string;
  metadata?: Record<string, any>;
}) {
  try {
    const payload = {
      error_message: `[${params.category.toUpperCase()}] ${params.message}`,
      error_stack: params.stack || new Error().stack,
      route: window.location.pathname,
      user_agent: navigator.userAgent,
      metadata: {
        ...params.metadata,
        url: window.location.href,
        screen: `${window.innerWidth}x${window.innerHeight}`,
        timestamp: new Date().toISOString(),
      }
    };

    const response = await fetch("/api/telemetry/errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return response.ok;
  } catch (error) {
    console.error("Failed to report incident:", error);
    return false;
  }
}
