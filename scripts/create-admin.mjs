const BASE = "http://localhost:3000";

async function main() {
  const payload = {
    email: "eyalaroussi144@gmail.com",
    password: "evva1234",
    name: "Admin Evva",
    role: "AGENCY_ADMIN",
  };

  try {
    const res = await fetch(`${BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const body = await res.json().catch(() => ({}));
    console.log("STATUS", res.status);
    console.log("BODY", JSON.stringify(body, null, 2));
  } catch (err) {
    console.error("Request failed:", err);
    process.exit(1);
  }
}

main();

