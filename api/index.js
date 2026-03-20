export default async function handler(req, res) {
  try {
    // ✅ GET TEST
    if (req.method === "GET") {
      return res.status(200).json({ message: "Zoho Backend Running ✅" });
    }

    // ✅ SAFE BODY HANDLING
    const body = req.body || {};
    const name = body.name || "Customer";
    const phone = body.phone;
    const issue = body.issue;
    const email = body.email || "test@example.com";

    if (!phone || !issue) {
      return res.status(400).json({
        error: "phone and issue required"
      });
    }

    // 🔑 TOKEN
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
        error: "Token failed",
        response: tokenData
      });
    }

    // 🎫 CREATE TICKET
    const ticketRes = await fetch("https://desk.zoho.com/api/v1/tickets", {
      method: "POST",
      headers: {
        orgId: process.env.ZOHO_ORG_ID,
        Authorization: `Zoho-oauthtoken ${tokenData.access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        subject: issue,
        description: issue,
        departmentId: process.env.ZOHO_DEPARTMENT_ID,
        email: email,
        phone: phone,
        status: "Open",
        priority: "High",
        contact: {
          lastName: name,
          phone: phone,
          email: email
        }
      })
    });

    const ticketData = await ticketRes.json();

    if (!ticketData.id) {
      return res.status(400).json({
        error: "Zoho failed",
        response: ticketData
      });
    }

    return res.status(200).json({
      success: true,
      ticket_id: ticketData.id
    });

  } catch (err) {
    return res.status(500).json({
      error: "Crash",
      message: err.message
    });
  }
}
