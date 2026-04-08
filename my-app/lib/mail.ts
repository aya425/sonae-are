import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const mailFrom = process.env.MAIL_FROM;

if (!resendApiKey) {
  throw new Error("RESEND_API_KEY is not set.");
}

if (!mailFrom) {
  throw new Error("MAIL_FROM is not set.");
}

const resend = new Resend(resendApiKey);

export type ExpiryMailItem = {
  productName: string;
  expiresAt: string;
  daysLeft: number;
};

export async function sendTestMail(to: string) {
  return await resend.emails.send({
    from: mailFrom!,
    to: [to],
    subject: "【そなえアレ】テストメール",
    html: `
      <div>
        <h1>テストメール</h1>
        <p>これはメール送信の疎通確認です。</p>
        <p>
          <a href="http://localhost:3000/inventory">備蓄品一覧を見る</a>
        </p>
      </div>
    `,
  });
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

  return await resend.emails.send({
    from: mailFrom!,
    to: [to],
    subject,
    html: `
      <div>
    <h1>賞味期限が近い備蓄があります</h1>

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
    `,
  });
}
