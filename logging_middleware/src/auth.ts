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

interface HttpResponse<T> {
  status: number;
  body: T;
}

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

/**
 * Loads client credentials from the .env file at project root.
 * The file should contain a JSON block with registration details.
 */
export function loadCredentials(): Credentials {
  const dir = path.resolve(__dirname, "..", "..");
  const envPath = path.join(dir, ".env");

  if (!fs.existsSync(envPath)) {
    throw new Error(
      `Credentials file not found at ${envPath}. ` +
        "Ensure .env with registration JSON exists at project root."
    );
  }

  const raw = fs.readFileSync(envPath, "utf-8");
  const blocks = raw
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  try {
    return JSON.parse(blocks[0]) as Credentials;
  } catch {
    throw new Error(
      "Failed to parse credentials from .env. Ensure valid JSON in first block."
    );
  }
}

/**
 * Makes an HTTP POST request returning parsed JSON.
 */
export function postJSON<T>(url: string, body: object): Promise<HttpResponse<T>> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const payload = JSON.stringify(body);

    const options: http.RequestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk: string) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode!, body: JSON.parse(data) as T });
        } catch {
          resolve({ status: res.statusCode!, body: data as unknown as T });
        }
      });
    });

    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

/**
 * Obtains a valid Bearer token, using cache when possible.
 * Refreshes automatically when within 60s of expiry.
 */
export async function getToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  if (cachedToken && tokenExpiresAt - now > 60) {
    return cachedToken;
  }

  const creds = loadCredentials();

  const response = await postJSON<AuthResponse>(AUTH_URL, {
    email: creds.email,
    name: creds.name,
    rollNo: creds.rollNo,
    accessCode: creds.accessCode,
    clientID: creds.clientID,
    clientSecret: creds.clientSecret,
  });

  if (![200, 201].includes(response.status) || !response.body.access_token) {
    throw new Error(
      `Authentication failed (HTTP ${response.status}): ${JSON.stringify(response.body)}`
    );
  }

  cachedToken = response.body.access_token;
  tokenExpiresAt = response.body.expires_in;

  return cachedToken;
}
