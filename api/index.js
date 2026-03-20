export const config = {
  api: {
    bodyParser: true
  }
};

export default async function handler(req, res) {
  try {
    // ✅ GET
    if (req.method === "GET") {
      return res.status(200).json({ message: "Zoho Backend Running ✅" });
    }

    // 🔥 FORCE PARSE BODY
    let body = {};

    if (req.body && Object.keys(req.body).length > 0) {
      body = req.body;
    } else {
      // fallback for raw body
      let raw = "";
      for await (const chunk of req) {
        raw += chunk;
      }
      body = raw ? JSON.parse(raw) : {};
    }

    console.log("PARSED BODY:", body);

    const name = body.name || "Customer";
    const phone = body.phone || "";
    const issue = body.issue || "";
    const email = body.email || "test@example.com";

    if (!phone || !issue) {
      return res.status(400).json({
        error: "phone and issue required",
        received: body
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
        details: tokenData
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

    return res.status(200).json({
      success: true,
      ticket_id: ticketData.id,
      zoho_response: ticketData
    });

  } catch (err) {
    return res.status(500).json({
      error: "Server crash",
      message: err.message
    });
  }
}
