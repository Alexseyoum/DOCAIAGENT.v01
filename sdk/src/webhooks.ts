/**
 * Webhook verification utilities for Next.js API routes
 */

import type { WebhookPayload } from './types';

/**
 * Verify webhook signature
 */
export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    // Use Web Crypto API (works in both Node.js and browsers)
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payload)
    );

    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Timing-safe comparison
    return timingSafeEqual(signature, expectedSignature);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return false;
  }
}

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Parse and verify webhook payload
 */
export async function parseWebhookPayload(
  body: string,
  signature: string,
  secret: string
): Promise<WebhookPayload | null> {
  const isValid = await verifyWebhookSignature(body, signature, secret);

  if (!isValid) {
    throw new Error('Invalid webhook signature');
  }

  try {
    return JSON.parse(body) as WebhookPayload;
  } catch (error) {
    throw new Error('Invalid webhook payload');
  }
}

/**
 * Next.js API route handler for webhooks
 *
 * @example
 * ```ts
 * // app/api/webhooks/route.ts
 * import { createWebhookHandler } from '@document-agent/nextjs-sdk';
 *
 * const handler = createWebhookHandler({
 *   secret: process.env.WEBHOOK_SECRET!,
 *   onEvent: async (event, data) => {
 *     console.log('Received webhook event:', event, data);
 *     // Handle the event
 *   }
 * });
 *
 * export const POST = handler;
 * ```
 */
export function createWebhookHandler(options: {
  secret: string;
  onEvent: (event: string, data: any) => Promise<void>;
}) {
  return async (request: Request) => {
    try {
      const signature = request.headers.get('x-webhook-signature');
      const event = request.headers.get('x-webhook-event');

      if (!signature || !event) {
        return new Response(
          JSON.stringify({ error: 'Missing webhook headers' }),
          { status: 400 }
        );
      }

      const body = await request.text();
      const payload = await parseWebhookPayload(body, signature, options.secret);

      if (!payload) {
        return new Response(
          JSON.stringify({ error: 'Invalid webhook payload' }),
          { status: 400 }
        );
      }

      // Process the webhook
      await options.onEvent(payload.event, payload.data);

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200 }
      );
    } catch (error) {
      console.error('Webhook handler error:', error);
      return new Response(
        JSON.stringify({ error: 'Webhook processing failed' }),
        { status: 500 }
      );
    }
  };
}
