import nodemailer from "nodemailer";
import { Resend } from "resend";

export type ExpiryMailItem = {
  productName: string;
  expiresAt: string;
  daysLeft: number;
};

type SendMailParams = {
  to: string;
  subject: string;
  html: string;
};

function getMailProvider() {
  return process.env.MAIL_PROVIDER ?? "resend";
}

function getMailFrom() {
  const mailFrom = process.env.MAIL_FROM;

  if (!mailFrom) {
    throw new Error("MAIL_FROM is not set.");
  }

  return mailFrom;
}

function getAppBaseUrl() {
  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_BASE_URL;

  if (!appBaseUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL or APP_BASE_URL is not set.");
  }

  return appBaseUrl.replace(/\/$/, "");
}

function createSmtpTransport() {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;

  if (!smtpHost) {
    throw new Error("SMTP_HOST is not set.");
  }

  if (!smtpPort) {
    throw new Error("SMTP_PORT is not set.");
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: Number(smtpPort),
    secure: false,
  });
}

function createResendClient() {
  const resendApiKey = process.env.RESEND_API_KEY ?? process.env.MAIL_API_KEY;

  console.log("[MAIL_ENV_CHECK]", {
    mailProvider: process.env.MAIL_PROVIDER ?? "resend",
    hasResendApiKey: Boolean(process.env.RESEND_API_KEY),
    hasMailApiKey: Boolean(process.env.MAIL_API_KEY),
    hasMailFrom: Boolean(process.env.MAIL_FROM),
  });

  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY or MAIL_API_KEY is not set.");
  }

  return new Resend(resendApiKey);
}

async function sendMail(params: SendMailParams) {
  const { to, subject, html } = params;

  const mailProvider = getMailProvider();
  const mailFrom = getMailFrom();

  if (mailProvider === "smtp") {
    const smtpTransport = createSmtpTransport();

    return await smtpTransport.sendMail({
      from: mailFrom,
      to,
      subject,
      html,
    });
  }

  if (mailProvider === "resend") {
    const resend = createResendClient();

    const result = await resend.emails.send({
      from: mailFrom,
      to: [to],
      subject,
      html,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result;
  }

  throw new Error(`Unsupported MAIL_PROVIDER: ${mailProvider}`);
}

function buildTestMailHtml() {
  const stockItemsUrl = `${getAppBaseUrl()}/stock-items`;

  return `
    <div>
      <h1>テストメール</h1>
      <p>これはメール送信の疎通確認です。</p>
      <p>
        <a href="${stockItemsUrl}">備蓄品一覧を見る</a>
      </p>
    </div>
  `;
}

function buildExpiryNotificationHtml(items: ExpiryMailItem[], inventoryUrl: string) {
  const itemsHtml = items
    .map(
      (item) => `
        <li>
          ${item.productName} / 賞味期限: ${item.expiresAt} / 残り${item.daysLeft}日
        </li>
      `
    )
    .join("");

  return `
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
}

export async function sendTestMail(to: string) {
  const subject = "【そなえアレ】テストメール";
  const html = buildTestMailHtml();

  return await sendMail({
    to,
    subject,
    html,
  });
}

export async function sendExpiryNotificationMail(params: {
  to: string;
  subject: string;
  items: ExpiryMailItem[];
  inventoryUrl: string;
}) {
  const { to, subject, items, inventoryUrl } = params;

  const html = buildExpiryNotificationHtml(items, inventoryUrl);

  return await sendMail({
    to,
    subject,
    html,
  });
}
