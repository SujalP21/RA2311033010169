/**
 * Browser-compatible auth service.
 * Gets and caches Bearer tokens for evaluation service API calls.
 */

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

export async function getToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  if (cachedToken && tokenExpiresAt - now > 60) {
    return cachedToken;
  }

  const response = await fetch("/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: import.meta.env.VITE_CLIENT_EMAIL,
      name: import.meta.env.VITE_CLIENT_NAME,
      rollNo: import.meta.env.VITE_CLIENT_ROLL,
      accessCode: import.meta.env.VITE_CLIENT_ACCESS_CODE,
      clientID: import.meta.env.VITE_CLIENT_ID,
      clientSecret: import.meta.env.VITE_CLIENT_SECRET,
    }),
  });

  if (!response.ok && response.status !== 201) {
    throw new Error(`Auth failed: HTTP ${response.status}`);
  }

  const data = await response.json();
  cachedToken = data.access_token;
  tokenExpiresAt = data.expires_in;

  return cachedToken!;
}
