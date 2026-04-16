import nodemailer from "nodemailer";
import { Resend } from "resend";

const mailProvider = process.env.MAIL_PROVIDER ?? "resend";
const mailFrom = process.env.MAIL_FROM;

if (!mailFrom) {
  throw new Error("MAIL_FROM is not set.");
}

const resendApiKey = process.env.RESEND_API_KEY;
const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT;

const resend = mailProvider === "resend" && resendApiKey ? new Resend(resendApiKey) : null;

const smtpTransport =
  mailProvider === "smtp"
    ? nodemailer.createTransport({
        host: smtpHost,
        port: Number(smtpPort ?? 1025),
        secure: false,
      })
    : null;

export type ExpiryMailItem = {
  productName: string;
  expiresAt: string;
  daysLeft: number;
};

export async function sendTestMail(to: string) {
  const subject = "【そなえアレ】テストメール";
  const html = `
    <div>
      <h1>テストメール</h1>
      <p>これはメール送信の疎通確認です。</p>
      <p>
        <a href="http://localhost:3000/stock-items">備蓄品一覧を見る</a>
      </p>
    </div>
  `;

  if (mailProvider === "smtp") {
    if (!smtpTransport) {
      throw new Error("SMTP transport is not initialized.");
    }

    return await smtpTransport.sendMail({
      from: mailFrom!,
      to,
      subject,
      html,
    });
  }

  if (!resend) {
    throw new Error("Resend is not initialized.");
  }

  const result = await resend.emails.send({
    from: mailFrom!,
    to: [to],
    subject,
    html,
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result;
}

export async function sendExpiryNotificationMail(params: {
  to: string;
  subject: string;
  items: ExpiryMailItem[];
  inventoryUrl: string;
}) {
  const { to, subject, items, inventoryUrl } = params;

  const itemsHtml = items
    .map(
      (item) => `
        <li>
          ${item.productName} / 賞味期限: ${item.expiresAt} / 残り${item.daysLeft}日
        </li>
      `
    )
    .join("");

  const html = `
    <div>
      <h1>賞味期限が近い備蓄品があります</h1>

      <p>
        ご登録いただいている備蓄の中に、
        賞味期限が近い商品があります。
      </p>

      <p>以下の商品をご確認ください。</p>

      <ul>
        ${itemsHtml}
      </ul>

      <p>
        <a href="${inventoryUrl}">
          備蓄品一覧で確認・見直しする
        </a>
      </p>

      <p>
        必要に応じて、再購入や入れ替えを行いましょう。
      </p>

      <hr />

      <p style="font-size: 12px; color: gray;">
        ※商品の最終的な賞味期限は、必ず商品パッケージの表示をご確認ください。
      </p>
    </div>
  `;

  if (mailProvider === "smtp") {
    if (!smtpTransport) {
      throw new Error("SMTP transport is not initialized.");
    }

    return await smtpTransport.sendMail({
      from: mailFrom!,
      to,
      subject,
      html,
    });
  }

  if (!resend) {
    throw new Error("Resend is not initialized.");
  }

  const result = await resend.emails.send({
    from: mailFrom!,
    to: [to],
    subject,
    html,
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result;
}
