import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { sendExpiryNotificationMail } from "@/lib/mail";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const appUrl = process.env.NEXT_PUBLIC_APP_URL;
const cronSecret = process.env.CRON_SECRET;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
}

if (!supabaseServiceRoleKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
}

if (!appUrl) {
  throw new Error("NEXT_PUBLIC_APP_URL is not set");
}

if (!cronSecret) {
  throw new Error("CRON_SECRET is not set");
}

const supabase = createSupabaseClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

type StockItemRow = {
  id: string;
  user_id: string;
  product_name: string;
  expires_at: string;
  notified_30days_at: string | null;
};

function addDays(base: Date, days: number) {
  const date = new Date(base);
  date.setDate(date.getDate() + days);
  return date;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}/${m}/${d}`;
}

function toDateOnlyString(date: Date) {
  return date.toISOString().slice(0, 10);
}

function calcDaysLeft(dateString: string) {
  const today = new Date();
  const expires = new Date(dateString);

  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const expiresOnly = new Date(expires.getFullYear(), expires.getMonth(), expires.getDate());

  const diffMs = expiresOnly.getTime() - todayOnly.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        {
          ok: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const today = new Date();
    const targetDate = addDays(today, 30);

    const fromDate = toDateOnlyString(today);
    const toDate = toDateOnlyString(targetDate);

    const { data: stockItems, error: stockItemsError } = await supabase
      .from("stock_items")
      .select("id, user_id, product_name, expires_at, notified_30days_at")
      .gte("expires_at", fromDate)
      .lte("expires_at", toDate)
      .is("notified_30days_at", null);

    if (stockItemsError) {
      throw new Error(`Failed to fetch stock items: ${stockItemsError.message}`);
    }

    const items = (stockItems ?? []) as StockItemRow[];

    console.log("[EXPIRE_NOTIFICATION_FETCH_RESULT]", {
      count: items.length,
      fromDate,
      toDate,
    });

    if (items.length === 0) {
      return NextResponse.json({
        ok: true,
        message: "No expiring items found",
        data: {
          targetUsers: 0,
          targetItems: 0,
          failedUsers: 0,
        },
      });
    }

    const groupedByUser = new Map<string, StockItemRow[]>();

    for (const item of items) {
      const current = groupedByUser.get(item.user_id) ?? [];
      current.push(item);
      groupedByUser.set(item.user_id, current);
    }

    let sentUsers = 0;
    let sentItems = 0;
    let failedUsers = 0;

    for (const [userId, userItems] of groupedByUser.entries()) {
      try {
        const { data: authUserResult, error: authUserError } =
          await supabase.auth.admin.getUserById(userId);

        if (authUserError) {
          throw new Error(`Failed to fetch auth user: ${authUserError.message}`);
        }

        const email = authUserResult.user?.email;

        if (!email) {
          throw new Error("User email is missing");
        }

        const mailResult = await sendExpiryNotificationMail({
          to: email,
          subject: "【そなえアレ】賞味期限が近い備蓄品があります",
          items: userItems.map((item) => ({
            productName: item.product_name,
            expiresAt: formatDate(item.expires_at),
            daysLeft: calcDaysLeft(item.expires_at),
          })),
          inventoryUrl: `${appUrl}/stock-items`,
        });

        console.log("[EXPIRE_NOTIFICATION_MAIL_RESULT]", {
          userId,
          email,
          mailResult,
        });

        const now = new Date().toISOString();
        const itemIds = userItems.map((item) => item.id);

        const { error: updateError } = await supabase
          .from("stock_items")
          .update({
            notified_30days_at: now,
          })
          .in("id", itemIds);

        if (updateError) {
          throw new Error(`Failed to update notified_30days_at: ${updateError.message}`);
        }

        const notificationLogs = userItems.map((item) => ({
          user_id: userId,
          stock_item_id: item.id,
          notification_type: "expiry_30days",
          sent_at: now,
        }));

        const { error: notificationLogError } = await supabase
          .from("notification_logs")
          .insert(notificationLogs);

        if (notificationLogError) {
          throw new Error(`Failed to insert notification logs: ${notificationLogError.message}`);
        }

        console.log("[EXPIRE_NOTIFICATION_SUCCESS]", {
          userId,
          sentItemCount: userItems.length,
        });

        sentUsers += 1;
        sentItems += userItems.length;
      } catch (userError) {
        console.error("[EXPIRE_NOTIFICATION_USER_PROCESS_ERROR]", {
          userId,
          error: userError,
        });
        failedUsers += 1;
      }
    }

    return NextResponse.json({
      ok: true,
      message: "Expire notification batch completed",
      data: {
        targetUsers: sentUsers,
        targetItems: sentItems,
        failedUsers,
      },
    });
  } catch (error) {
    console.error("[EXPIRE_NOTIFICATION_BATCH_ERROR]", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Expire notification batch failed",
      },
      { status: 500 }
    );
  }
}
