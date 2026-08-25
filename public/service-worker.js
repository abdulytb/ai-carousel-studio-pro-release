/**
 * AI CAROUSEL STUDIO PRO — Service Worker
 * ------------------------------------------------------------------
 * Strategi: NETWORK-FIRST untuk app shell (HTML/CSS/JS) — selalu coba
 * ambil versi TERBARU dari server dulu; cache cuma dipakai sebagai
 * fallback kalau user offline. Ini supaya Local AI Engine tetap jalan
 * 100% tanpa internet, TAPI update kode (bug fix, fitur baru) langsung
 * kepakai begitu di-deploy, tanpa nyangkut di versi lama.
 * (Versi lama pakai cache-first + CACHE_NAME statis — akibatnya browser
 * user bisa nyangkut permanen di build JS lama walau server sudah
 * dideploy dengan fix terbaru. Kalau ganti strategi lagi di masa depan,
 * WAJIB naikkan angka versi CACHE_NAME di bawah supaya cache lama
 * otomatis dibersihkan oleh event "activate".)
 * Panggilan ke provider AI (Gemini/Groq/OpenRouter) SENGAJA tidak di-cache
 * — request itu harus selalu live ke jaringan agar hasilnya tidak basi.
 */

const CACHE_NAME = "carousel-studio-pro-v2";

// Sesuaikan daftar ini dengan nama file build production Anda
// (contoh untuk Vite: /assets/index-xxxx.js, /assets/index-xxxx.css).
const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

function isAIProviderRequest(url) {
  return (
    url.includes("generativelanguage.googleapis.com") ||
    url.includes("api.groq.com") ||
    url.includes("openrouter.ai") ||
    url.includes("workers.dev") // proxy server milik user
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  if (isAIProviderRequest(request.url)) return; // selalu network, jangan di-cache

  // NETWORK-FIRST: coba ambil versi terbaru dari server dulu. Kalau
  // berhasil, update cache (buat fallback offline) lalu pakai hasil itu.
  // Cache CUMA dipakai kalau network benar-benar gagal (user offline).
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && response.type === "basic") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) => cached || caches.match("/index.html"))
      )
  );
});
