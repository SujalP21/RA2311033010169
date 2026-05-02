// gets and caches bearer token for API calls
// reads credentials from Vite env variables

let _token: string | null = null;
let _expiresAt = 0;

export async function getToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  // reuse cached token if still valid
  if (_token && _expiresAt - now > 60) return _token;

  const res = await fetch("/api/auth", {
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

  if (!res.ok && res.status !== 201) {
    throw new Error(`Auth failed: ${res.status}`);
  }

  const data = await res.json();
  _token = data.access_token;
  _expiresAt = data.expires_in;
  return _token!;
}
