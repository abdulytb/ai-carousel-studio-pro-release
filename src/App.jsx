import React, { useState } from "react";
import Home from "./pages/Home.jsx";
import GambarSaja from "./pages/GambarSaja.jsx";

// Tab switcher SEDERHANA (bukan pakai library router) — sesuai prinsip
// "tanpa dependency wajib" yang dipegang sepanjang project ini. Cukup
// state lokal buat pilih halaman mana yang dirender, gak butuh URL routing
// beneran karena ini single-page app tanpa kebutuhan share-link per tab.
export default function App() {
  const [tab, setTab] = useState("carousel"); // "carousel" | "gambar"

  return (
    <div style={{ minHeight: "100vh", background: "#0B0D12" }}>
      <div style={{ display: "flex", gap: 8, padding: "12px 16px 0", maxWidth: 720, margin: "0 auto" }}>
        <button
          onClick={() => setTab("carousel")}
          style={{
            flex: 1, padding: "10px 16px", borderRadius: 10, border: "1px solid #1E222B", cursor: "pointer",
            fontWeight: 700, fontSize: 13,
            background: tab === "carousel" ? "linear-gradient(90deg,#8B5CF6,#EC4899)" : "#12151C",
            color: tab === "carousel" ? "#fff" : "#9BA0AC",
          }}
        >
          📑 Carousel Lengkap
        </button>
        <button
          onClick={() => setTab("gambar")}
          style={{
            flex: 1, padding: "10px 16px", borderRadius: 10, border: "1px solid #1E222B", cursor: "pointer",
            fontWeight: 700, fontSize: 13,
            background: tab === "gambar" ? "linear-gradient(90deg,#8B5CF6,#EC4899)" : "#12151C",
            color: tab === "gambar" ? "#fff" : "#9BA0AC",
          }}
        >
          🖼️ Gambar Saja
        </button>
      </div>

      {tab === "carousel" ? <Home /> : <GambarSaja />}
    </div>
  );
}
