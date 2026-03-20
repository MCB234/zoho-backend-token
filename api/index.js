export default async function handler(req, res) {
  try {
    // ✅ HEALTH CHECK
    if (req.method === "GET") {
      return res.status(200).json({ message: "Zoho Backend Running ✅" });
    }

    // ✅ FIX: HANDLE ELEVENLABS BODY
    const data = req.body?.body || req.body || {};

    const name = data.name || "Customer";
    const phone = data.phone;
    const issue = data.issue;
    const email = data.email || "test@example.com";

    // ✅ VALIDATION
    if (!phone || !issue) {
      return res.status(400).json({
        error: "phone and issue required",
        received: data
      });
    }

    // 🔑 STEP 1: GET ACCESS TOKEN
    const tokenRes = await fetch("https://accounts.zoho.com/oauth/v2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
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
        error: "Zoho token failed",
        details: tokenData
      });
    }

    const accessToken = tokenData.access_token;

    // 🎫 STEP 2: CREATE TICKET
    const ticketRes = await fetch("https://desk.zoho.com/api/v1/tickets", {
      method: "POST",
      headers: {
        orgId: process.env.ZOHO_ORG_ID,
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        subject: issue,
        description: issue,
        departmentId: process.env.ZOHO_DEPARTMENT_ID,
        email,
        phone,
        status: "Open",
        priority: "High",
        contact: {
          lastName: name,
          phone,
          email
        }
      })
    });

    const ticketData = await ticketRes.json();

    // ✅ RESPONSE
    return res.status(200).json({
      success: true,
      ticket_id: ticketData.id || null,
      zoho_response: ticketData
    });

  } catch (err) {
    return res.status(500).json({
      error: "Server crash",
      message: err.message
    });
  }
}
