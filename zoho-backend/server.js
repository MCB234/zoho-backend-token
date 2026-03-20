import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

let accessToken = null;
let expiry = 0;

async function getToken() {
  if (accessToken && Date.now() < expiry) return accessToken;

  const res = await fetch("https://accounts.zoho.com/oauth/v2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: process.env.ZOHO_REFRESH_TOKEN,
      client_id: process.env.ZOHO_CLIENT_ID,
      client_secret: process.env.ZOHO_CLIENT_SECRET,
      grant_type: "refresh_token"
    })
  });

  const data = await res.json();
  accessToken = data.access_token;
  expiry = Date.now() + (data.expires_in * 1000 - 60000);

  return accessToken;
}

app.post("/create-ticket", async (req, res) => {
  try {
    const token = await getToken();

    const zoho = await fetch("https://desk.zoho.com/api/v1/tickets", {
      method: "POST",
      headers: {
        "orgId": process.env.ZOHO_ORG_ID,
        "Authorization": `Zoho-oauthtoken ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        departmentId: process.env.ZOHO_DEPARTMENT_ID,
        subject: req.body.issue,
        description: req.body.issue,
        contact: {
          lastName: req.body.name,
          phone: req.body.phone
        }
      })
    });

    const data = await zoho.json();
    res.json({ ticket_id: data.id });

  } catch (err) {
    res.status(500).json({ error: "Ticket creation failed" });
  }
});

app.get("/get-ticket", async (req, res) => {
  try {
    const token = await getToken();

    const zoho = await fetch(`https://desk.zoho.com/api/v1/tickets/${req.query.ticket_id}`, {
      headers: {
        "orgId": process.env.ZOHO_ORG_ID,
        "Authorization": `Zoho-oauthtoken ${token}`
      }
    });

    const data = await zoho.json();
    res.json({ status: data.status });

  } catch (err) {
    res.status(500).json({ error: "Failed to fetch ticket" });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
