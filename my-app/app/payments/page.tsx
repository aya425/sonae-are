"use client";

export default function Page() {
  const handleClick = async () => {
    const res = await fetch("/api/payments/checkout", {
      method: "POST",
    });

    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("Checkout URL の取得に失敗しました");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>決済テスト</h1>
      <button onClick={handleClick}>決済する</button>
    </div>
  );
}