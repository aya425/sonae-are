"use client";

export default function Page() {
  const handleClick = async () => {
    try {
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok || !data?.data?.url) {
        alert("Checkout URL の取得に失敗しました");
        return;
      }

      window.location.href = data.data.url;
    } catch (error) {
      console.error("Failed to start checkout", error);
      alert("通信に失敗しました");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>決済テスト</h1>
      <button onClick={handleClick}>決済する</button>
    </div>
  );
}