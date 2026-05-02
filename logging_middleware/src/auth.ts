import * as http from "http";
import * as fs from "fs";
import * as path from "path";

const AUTH_URL = "http://20.207.122.201/evaluation-service/auth";

interface Credentials {
  email: string;
  name: string;
  rollNo: string;
  accessCode: string;
  clientID: string;
  clientSecret: string;
}

interface AuthResponse {
  token_type: string;
  access_token: string;
  expires_in: number;
}

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

// reads registration creds from .env (JSON format) at project root
export function loadCredentials(): Credentials {
  const root = path.resolve(__dirname, "..", "..");
  const envPath = path.join(root, ".env");

  if (!fs.existsSync(envPath)) {
    throw new Error(`No .env found at ${envPath}`);
  }

  const content = fs.readFileSync(envPath, "utf-8");
  // take the first non-empty block as the JSON creds
  const blocks = content.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);

  try {
    return JSON.parse(blocks[0]) as Credentials;
  } catch {
    throw new Error("Could not parse credentials from .env — check JSON format");
  }
}

// generic POST helper using native http
function postJSON<T>(url: string, body: object): Promise<{ status: number; body: T }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const payload = JSON.stringify(body);

    const req = http.request(
      {
        hostname: parsed.hostname,
        port: parsed.port || 80,
        path: parsed.pathname,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (res) => {
        let raw = "";
        res.on("data", (c: string) => (raw += c));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode!, body: JSON.parse(raw) as T });
          } catch {
            resolve({ status: res.statusCode!, body: raw as unknown as T });
          }
        });
      }
    );

    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

// fetches a bearer token, caching it until ~60s before expiry
export async function getToken(): Promise<string> {
  const nowSec = Math.floor(Date.now() / 1000);

  // reuse if still valid
  if (cachedToken && tokenExpiresAt - nowSec > 60) {
    return cachedToken;
  }

  const creds = loadCredentials();

  const resp = await postJSON<AuthResponse>(AUTH_URL, {
    email: creds.email,
    name: creds.name,
    rollNo: creds.rollNo,
    accessCode: creds.accessCode,
    clientID: creds.clientID,
    clientSecret: creds.clientSecret,
  });

  if (![200, 201].includes(resp.status) || !resp.body.access_token) {
    throw new Error(`Auth failed (${resp.status}): ${JSON.stringify(resp.body)}`);
  }

  cachedToken = resp.body.access_token;
  tokenExpiresAt = resp.body.expires_in;

  return cachedToken;
}
