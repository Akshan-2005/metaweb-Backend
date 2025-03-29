require("dotenv").config();
const express = require("express");
const { Request, Response } = require("express");
const http = require("http");
const fs = require("fs");
const path = require("path");
const { Resend } = require("resend");
const cors = require("cors");
const xlsx = require("xlsx"); // ✅ Use xlsx for reading Excel files

const app = express();
const server = http.createServer(app);
const resend = new Resend(process.env.RESEND_API_KEY);

app.use(express.json());
app.use(cors({
  origin: "http://localhost:3000",
  methods: ["POST"],
  allowedHeaders: ["Content-Type"]
}));

const filePath = path.join(__dirname, "public", "form_data.xlsx");

// 📌 Route to handle form submission
app.post("/sendemail", async (req, res) => {
  console.log("Received email request");

  const { firstName, lastName, email, comemail, phone, org, help, budget, services } = req.body;

  // Append data to Excel file
  await createExcel(firstName, lastName, email, comemail, phone, org, help, budget, services);

  try {
    const sentEmail = await sendEmail(firstName, lastName, comemail, email, phone, org, help, budget, services);

    if (sentEmail === 1) {
      return res.status(200).json({ message: "Email sent and Excel file updated" });
    } else {
      return res.status(500).json({ error: sentEmail });
    }
  } catch (error) {
    console.error("Error in /sendemail:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// 📌 Function to send email
const sendEmail = async (firstName, lastName, comemail, email, phone, org, help, budget, services) => {
  try {
    const data = await resend.emails.send({
      from: "Contact Form <onboarding@resend.dev>",
      to: "akshanaggarwal20@gmail.com",
      subject: "Message from Contact Form",
      reply_to: email,
      html: `
      <div>
        <p><strong>First Name:</strong> ${firstName}</p>
        <p><strong>Last Name:</strong> ${lastName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Company Email:</strong> ${comemail}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Organization:</strong> ${org}</p>
        <p><strong>Help Request:</strong> ${help}</p>
        <p><strong>Budget:</strong> ${budget}</p>
        <p><strong>Services:</strong> ${services}</p>
      </div>
      `
    });

    console.log("Admin Email sent successfully:", data);

    const customerResponse = await resend.emails.send({
      from: "Born2Scale <contact@born2scale.com>",
      to: [email],
      subject: "Thank you for contacting",
      html: `
      <div>
        <p>dear ${firstName}</p>
        <p>Thank you for contacting Born2Scale! We are excited to help you scale your business with our expertise in:</p>
        <p>✅ <strong>Digital Marketing</strong> – Social media management, SEO, paid ads, and content marketing to boost your online presence.</p>
        <p>💻 <strong>Website Building</strong> – Custom-designed, high-performance websites tailored to your business needs.</p>
        <p>📢 <strong>Offline Marketing</strong> – Print media, events, and strategic outreach to enhance brand visibility.</p>
        <p>📊 <strong>Strategy Building</strong> – Market research and tailored business strategies for long-term growth.</p>
        <p>🤝 <strong>Business Consultation</strong> – Expert guidance to streamline operations and maximize profitability.</p>
        <h2>Our processes</h2>
        <p>🤝 <strong>Consultation</strong> – Understanding your business goals and challenges</p>
        <p>🤝 <strong>Strategy Development</strong> – Creating a custom plan aligned with your vision.</p>
        <p>🤝 <strong>Implementation</strong> – Executing the strategy with cutting-edge tools and expertise.</p>
        <p>🤝 <strong>Optimization & Growth</strong> – Monitoring, analyzing, and scaling for better results.</p>
        <p>We’d love to discuss how we can help you achieve your business goals. 
          Let’s schedule a quick call to explore the best solutions for your needs.</p>
        <p>Feel free to reply to this email or contact us at born2scale@gmail.com</p>
        <p>Best regards,</p>
        <p><strong>Aayush Aggarwal</strong></p>
        <p>Founder & CEO</p>
      </div>
      `
    });

    console.log("customer email sent", customerResponse);

    return 1;
  } catch (error) {
    console.error("Error sending email:", error);
    return { error: error.message };
  }
};

// 📌 Function to append data to Excel
async function createExcel(firstName, lastName, email, comemail, phone, org, help, budget, services) {
  let workbook;
  let worksheet;

  // Check if file exists
  if (fs.existsSync(filePath)) {
    // ✅ Read existing Excel file
    workbook = xlsx.readFile(filePath);
    worksheet = workbook.Sheets["Sheet1"];
  } else {
    // ✅ Create new workbook & worksheet
    workbook = xlsx.utils.book_new();
    worksheet = xlsx.utils.aoa_to_sheet([
      ["First Name", "Last Name", "Email", "Company Email", "Phone", "Organization", "Help Request", "Budget", "Services"]
    ]);
    xlsx.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  }

  // ✅ Convert worksheet to JSON (array format)
  let existingData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

  // ✅ Append new row
  existingData.push([firstName, lastName, email, comemail, phone, org, help, budget, services]);

  // ✅ Convert JSON back to worksheet
  const updatedWorksheet = xlsx.utils.aoa_to_sheet(existingData);
  workbook.Sheets["Sheet1"] = updatedWorksheet;

  // ✅ Write updated data back to Excel file
  xlsx.writeFile(workbook, filePath);

  console.log("Excel file updated successfully:", filePath);
}

app.get("/", async (req, res) => {
  try {
    const { data, error } = await resend.emails.send({
      from: "Born2Scale <contact@born2scale.com>", // Must be a verified domain email
      to: ["delivered@resend.dev"],
      subject: "Hello World",
      html: "<strong>It works!</strong>",
    });

    if (error) {
      console.error("Resend API Error:", error);
      return res.status(400).json({ error });
    }

    res.status(200).json({ data });
  } catch (err) {
    console.error("Error testing Resend API:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Start the server
const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
