export default async function handler(req, res) {
  try {
    // ✅ HANDLE GET
    if (req.method === "GET") {
      return res.status(200).json({ message: "Zoho Backend Running ✅" });
    }

    // ✅ PARSE BODY (IMPORTANT FIX)
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const { name, phone, issue, email } = body;

    // 🔑 GET TOKEN
    const tokenRes = await fetch("https://accounts.zoho.com/oauth/v2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        refresh_token: process.env.ZOHO_REFRESH_TOKEN,
        client_id: process.env.ZOHO_CLIENT_ID,
        client_secret: process.env.ZOHO_CLIENT_SECRET,
        grant_type: "refresh_token"
      })
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return res.status(500).json({
        error: "Token failed",
        details: tokenData
      });
    }

    // 🎫 CREATE TICKET
    const zohoRes = await fetch("https://desk.zoho.com/api/v1/tickets", {
      method: "POST",
      headers: {
        "orgId": process.env.ZOHO_ORG_ID,
        "Authorization": `Zoho-oauthtoken ${tokenData.access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        subject: issue,
        description: issue,
        departmentId: process.env.ZOHO_DEPARTMENT_ID,
        email: email || "test@example.com",
        phone: phone,
        status: "Open",
        priority: "High",
        contact: {
          lastName: name || "Customer",
          phone: phone,
          email: email || "test@example.com"
        }
      })
    });

    const data = await zohoRes.json();

    console.log("Zoho Response:", data);

    if (!data.id) {
      return res.status(400).json({
        error: "Zoho error",
        zoho_response: data
      });
    }

    return res.status(200).json({
      success: true,
      ticket_id: data.id
    });

  } catch (err) {
    console.error("ERROR:", err);
    return res.status(500).json({
      error: "Internal error",
      details: err.message
    });
  }
}
