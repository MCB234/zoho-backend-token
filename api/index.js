export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      return res.status(200).json({ message: "Zoho Backend Running ✅" });
    }

    if (req.method === "POST") {
      const { name, phone, issue } = req.body;

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

      const zohoRes = await fetch("https://desk.zoho.com/api/v1/tickets", {
        method: "POST",
        headers: {
          "orgId": process.env.ZOHO_ORG_ID,
          "Authorization": `Zoho-oauthtoken ${tokenData.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          departmentId: process.env.ZOHO_DEPARTMENT_ID,
          subject: issue,
          description: issue,
          contact: {
            lastName: name,
            phone: phone
          }
        })
      });

      const data = await zohoRes.json();

      return res.status(200).json({
        success: true,
        ticket_id: data.id
      });
    }

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong" });
  }
}
