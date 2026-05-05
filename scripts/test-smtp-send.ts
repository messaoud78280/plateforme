import nodemailer from "nodemailer";
import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const fromAddr = process.env.SMTP_FROM_EMAIL || user;
  const to = process.argv[2] || "hanadjebailipro@gmail.com";

  if (!host || !user || !pass || !fromAddr) {
    console.error("MISSING_SMTP_ENV");
    process.exit(2);
  }

  const secureRaw = (process.env.SMTP_SECURE ?? "").trim().toLowerCase();
  const secure =
    secureRaw === "true" ||
    secureRaw === "1" ||
    (!secureRaw && port === 465);

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  await transporter.verify();
  console.log("SMTP_VERIFY_OK");

  const info = await transporter.sendMail({
    from: "BeWork Test <" + fromAddr + ">",
    to,
    subject: "[BeWork] Test SMTP " + new Date().toISOString(),
    text: "Si tu vois ce message, SMTP fonctionne.",
  });

  console.log("SEND_OK", info.messageId);
}

main().catch((e) => {
  console.error("SMTP_FAIL", e instanceof Error ? e.message : e);
  process.exit(1);
});
