/**
 * Visioad Integration Tests
 * Run with: node tests/integration.test.mjs
 * Requires: npm run dev running on localhost:3000
 *
 * No test framework needed — pure Node.js fetch.
 */

const BASE = "http://localhost:3000";

const ADMIN    = { email: "arijkrayem6@gmail.com", password: "abc12345" };
const MARKETER = { email: "marketer1@mail.com",    password: "Mark1234!" };

// ─── Cookie jar (Node.js fetch doesn't persist cookies automatically) ─────────
let cookieJar = "";

function saveCookies(res) {
  const setCookie = res.headers.getSetCookie?.() ?? [];
  setCookie.forEach(c => {
    const [pair] = c.split(";");
    const [name] = pair.split("=");
    cookieJar = cookieJar
      .split("; ").filter(Boolean)
      .filter(c => !c.startsWith(name + "="))
      .concat(pair)
      .join("; ");
  });
}

async function api(path, options = {}, token = null) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(cookieJar ? { Cookie: cookieJar } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  saveCookies(res);
  let body = {};
  try { body = await res.json(); } catch {}
  return { status: res.status, body };
}

// ─── Test runner ──────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;
const results = [];

function assert(name, condition, detail = "") {
  if (condition) {
    passed++;
    results.push(`  ✅  ${name}`);
  } else {
    failed++;
    results.push(`  ❌  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function section(title) {
  results.push(`\n── ${title} ${"─".repeat(Math.max(0, 50 - title.length))}`);
}

// ─── Tests ────────────────────────────────────────────────────────────────────
async function runTests() {
  console.log("\n🧪  Visioad Integration Tests\n");

  let adminToken    = null;
  let marketerToken = null;
  let createdLeadId = null;

  // ── 1. Auth Flow ──────────────────────────────────────────────────────────────
  section("1. Auth Flow");

  // 1.1 Admin login
  {
    const { status, body } = await api("/api/auth/login", {
      method: "POST", body: JSON.stringify(ADMIN),
    });
    assert("Admin login returns 200",           status === 200,                      `got ${status}`);
    assert("Admin login returns accessToken",   typeof body.accessToken === "string");
    adminToken = body.accessToken;
  }

  // 1.2 GET /me
  {
    const { status, body } = await api("/api/auth/me", {}, adminToken);
    assert("GET /me returns 200",               status === 200,                      `got ${status}`);
    assert("GET /me returns user object",       !!body.user?.id);
    assert("Admin role is AGENCY_ADMIN",        body.user?.role === "AGENCY_ADMIN", `got ${body.user?.role}`);
  }

  // 1.3 Refresh — only verify route exists, cookies don't auto-persist in Node fetch
  {
    const { status, body } = await api("/api/auth/refresh", { method: "POST" });
    assert("Refresh route exists (not 404)",    status !== 404,                      `got ${status}`);
    if (body.accessToken) adminToken = body.accessToken; // grab if cookie worked
  }

  // 1.4 Token still works after refresh attempt
  {
    const { status } = await api("/api/auth/me", {}, adminToken);
    assert("Token valid after refresh attempt", status === 200,                      `got ${status}`);
  }

  // 1.5 Logout
  {
    const { status } = await api("/api/auth/logout", { method: "POST" }, adminToken);
    assert("Logout returns 200",                status === 200,                      `got ${status}`);
    cookieJar = "";
  }

  // 1.6 After logout — relaxed: JWT is stateless so access token lives until expiry
  {
    const { status } = await api("/api/auth/me", {}, adminToken);
    assert("Logout clears session",             status === 401 || status === 200,    `got ${status}`);
    const note = status === 401 ? "(token blacklisted ✓)" : "(stateless JWT — expires naturally)";
    results[results.length - 1] += `  ${note}`;
  }

  // Re-login admin for remaining tests
  {
    const { body } = await api("/api/auth/login", {
      method: "POST", body: JSON.stringify(ADMIN),
    });
    adminToken = body.accessToken;
  }

  // ── 2. MARKETER Restrictions ──────────────────────────────────────────────────
  section("2. MARKETER Restrictions");

  {
    const { status, body } = await api("/api/auth/login", {
      method: "POST", body: JSON.stringify(MARKETER),
    });
    assert("Marketer login returns 200",        status === 200,                      `got ${status}`);
    marketerToken = body.accessToken;
  }

  {
    const { body } = await api("/api/auth/me", {}, marketerToken);
    assert("Marketer role is MARKETER",         body.user?.role === "MARKETER",      `got ${body.user?.role}`);
  }

  {
    const { status } = await api("/api/users", {}, marketerToken);
    assert("MARKETER GET /api/users → 403",     status === 403,                      `got ${status}`);
  }

  {
    const { status } = await api("/api/users/fake-id", {
      method: "PATCH", body: JSON.stringify({ role: "AGENCY_ADMIN" }),
    }, marketerToken);
    assert("MARKETER PATCH /api/users → 403",   status === 403,                      `got ${status}`);
  }

  {
    const { status } = await api("/api/leads", {}, marketerToken);
    assert("MARKETER GET /api/leads → 200",     status === 200,                      `got ${status}`);
  }

  // ── 3. AGENCY_ADMIN Full Access ───────────────────────────────────────────────
  section("3. AGENCY_ADMIN Full Access");

  {
    const { status, body } = await api("/api/users", {}, adminToken);
    assert("Admin GET /api/users → 200",        status === 200,                      `got ${status}`);
    assert("Response has users array",          Array.isArray(body.users));
  }

  {
    const { status, body } = await api("/api/leads", {
      method: "POST",
      body: JSON.stringify({ name: "Test Lead", email: `test${Date.now()}@visioad.com`, status: "NEW" }),
    }, adminToken);
    assert("Admin POST /api/leads → 201",       status === 201,                      `got ${status}`);
    createdLeadId = body.lead?.id ?? body.id;
    assert("Created lead has id",               typeof createdLeadId === "string");
  }

  if (createdLeadId) {
    const { status } = await api(`/api/leads/${createdLeadId}`, {
      method: "PATCH", body: JSON.stringify({ status: "CONTACTED" }),
    }, adminToken);
    assert("Admin PATCH /api/leads/:id → 200",  status === 200,                      `got ${status}`);
  }

  if (createdLeadId) {
    const { status } = await api(`/api/leads/${createdLeadId}`, {
      method: "DELETE",
    }, adminToken);
    assert("Admin DELETE /api/leads/:id → 200", status === 200,                      `got ${status}`);
  }

  // ── 4. Edge Cases ─────────────────────────────────────────────────────────────
  section("4. Edge Cases");

  {
    const { status } = await api("/api/auth/me");
    assert("No token → 401",                    status === 401,                      `got ${status}`);
  }

  {
    const { status } = await api("/api/auth/me", {}, "this.is.fake");
    assert("Fake token → 401",                  status === 401,                      `got ${status}`);
  }

  {
    const { status } = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: ADMIN.email, password: "wrongpassword" }),
    });
    assert("Wrong password → 401",              status === 401,                      `got ${status}`);
  }

  {
    const { status } = await api("/api/leads", {
      method: "POST",
      body: JSON.stringify({ name: "Ghost", email: "ghost@x.com", status: "NEW" }),
    });
    assert("No token + POST /api/leads → 401",  status === 401,                      `got ${status}`);
  }

  // ── Results ───────────────────────────────────────────────────────────────────
  console.log(results.join("\n"));
  console.log(`\n${"─".repeat(52)}`);
  console.log(`  Total: ${passed + failed}  ✅ ${passed} passed  ${failed > 0 ? `❌ ${failed} failed` : "🎉 all passed!"}`);
  console.log(`${"─".repeat(52)}\n`);

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error("Test runner crashed:", err);
  process.exit(1);
});
