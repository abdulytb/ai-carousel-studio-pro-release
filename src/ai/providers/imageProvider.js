// Provider gambar hero — pakai Cloudflare Workers AI (model FLUX Schnell)
// lewat Worker proxy milik user sendiri (proxy-server/worker.js, endpoint
// POST /image). GRATIS 10.000 neuron/hari, TANPA kartu, TANPA auto-debet —
// beda dari Gemini (butuh billing aktif) dan lebih relevan/berkualitas
// dibanding Pollinations anonim (rate-limit ketat, kurang taat prompt).
//
// WAJIB lewat proxy: Workers AI cuma bisa diakses dari dalam Worker
// (binding env.AI), bukan REST API langsung dari browser.
//
// Kegagalan gambar TETAP tidak boleh menggagalkan carousel — pemanggilnya
// (Home.jsx) sudah fallback ke slide tanpa gambar + notice heroImageError.

// Daftar gaya gambar — ditambahkan sebagai SUFFIX terpisah ke prompt
// internal (bukan dicampur ke kolom topik yang diketik user), supaya
// kolom topik tetap murni berisi apa yang diketik user.
export const IMAGE_STYLES = {
  realistic: { label: "Realistis", suffix: "" },
  ghibli: { label: "Studio Ghibli", suffix: ", Studio Ghibli anime style, soft watercolor textures, whimsical hand-drawn illustration" },
  pastel: { label: "Pastel", suffix: ", soft pastel color palette, dreamy minimalist illustration, gentle lighting" },
  minecraft: { label: "Minecraft", suffix: ", Minecraft blocky voxel art style, pixelated textures, game screenshot" },
  clay: { label: "Clay / Claymation", suffix: ", claymation stop-motion style, clay texture, soft studio lighting" },
  render3d: { label: "3D Render", suffix: ", 3D render, Pixar-style, vibrant colors, soft global illumination" },
  cyberpunk: { label: "Cyberpunk", suffix: ", cyberpunk neon-lit futuristic style, vibrant neon colors, high contrast, rain-slicked streets aesthetic" },
  anime: { label: "Anime", suffix: ", anime illustration style, vibrant cel-shaded coloring, detailed anime character design" },
  watercolor: { label: "Watercolor", suffix: ", watercolor painting style, soft flowing pigments, artistic paper texture, delicate color bleeding" },
  isometric: { label: "Isometric", suffix: ", isometric 3D illustration style, clean geometric shapes, flat vibrant colors, miniature diorama feel" },
  vintage: { label: "Vintage Film", suffix: ", vintage retro film photography style, grainy film texture, warm faded tones, 1970s aesthetic" },
  lineart: { label: "Line Art", suffix: ", minimalist line art style, single continuous line drawing, clean black outlines on plain background" },
  lowpoly: { label: "Low Poly", suffix: ", low poly 3D style, faceted geometric shapes, flat shading, angular polygon aesthetic" },
  vaporwave: { label: "Vaporwave", suffix: ", vaporwave aesthetic, retro-futuristic pastel neon colors, glitch elements, 80s synthwave vibe" },
};

export async function generateHeroImage({ proxyUrl, topic, badge, style }) {
  if (!proxyUrl || !proxyUrl.trim()) {
    throw new Error("Proxy URL (Cloudflare Worker) belum diisi — gambar hero butuh proxy karena Workers AI cuma bisa diakses dari server.");
  }

  const styleSuffix = IMAGE_STYLES[style]?.suffix || "";
  const prompt = `Professional editorial photograph closely related to this topic: "${topic}" (context: ${badge || "general"}). Cinematic lighting, high detail, vertical portrait composition, no text or watermark or logo anywhere in the image, no visible captions${styleSuffix}.`;

  const endpoint = `${proxyUrl.trim().replace(/\/$/, "")}/image`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    const detail = (await res.text().catch(() => "")).slice(0, 200);
    throw new Error(`Workers AI Image error (${res.status}): ${detail}`);
  }

  const data = await res.json();
  if (!data.image) throw new Error("Workers AI: respons tidak berisi gambar.");
  return data.image; // sudah data URL base64 lengkap dari worker
}

// Generate 1 gambar PER SLIDE (bukan cuma hero) — dipakai kalau toggle
// "Gambar AI di Semua Slide" aktif. Sengaja SEQUENTIAL (satu-satu, bukan
// Promise.all paralel) supaya tidak membanjiri Workers AI dengan banyak
// request bersamaan (rawan kena rate limit kalau paralel).
//
// Kegagalan di satu slide TIDAK menggagalkan slide lain — images[i] berisi
// data URL atau null (null = slide itu fallback tanpa gambar, dirender
// ModernTemplate/dst seperti biasa oleh SlideCanvas.jsx). errors berisi
// pesan asli tiap kegagalan (dulu ditelan diam-diam pakai catch kosong —
// itu sebabnya pesan di UI cuma generik "sebagian gambar gagal" tanpa
// penyebab pasti; sekarang penyebabnya ikut dikembalikan ke pemanggil).
export async function generateSlideImages({ proxyUrl, topic, badge, style, slides }) {
  const images = [];
  const errors = [];
  for (const slide of slides) {
    try {
      // Prompt disesuaikan per slide (bukan topik generik berulang) supaya
      // gambar tiap slide BEDA-BEDA, relevan sama isi slide itu sendiri.
      const focusedTopic = slide.title ? `${topic} — fokus pada: ${slide.title}` : topic;
      const img = await generateHeroImage({ proxyUrl, topic: focusedTopic, badge, style });
      images.push(img);
    } catch (err) {
      images.push(null);
      errors.push(err.message);
    }
  }
  return { images, errors };
}

// Generate N gambar dari TOPIK YANG SAMA — TANPA konten carousel/teks sama
// sekali (tidak ada judul/body per gambar seperti generateSlideImages).
// Dipakai khusus halaman "Gambar Saja" (src/pages/GambarSaja.jsx) untuk
// pengguna yang cuma butuh foto AI mentah, teksnya mau diolah sendiri di
// tools lain. Tetap SEQUENTIAL (alasan sama seperti generateSlideImages).
// Workers AI tetap menghasilkan gambar yang berbeda-beda tiap panggilan
// walau prompt sama persis, berkat randomness bawaan model (parameter
// "seed" eksplisit sengaja sudah dihapus — lihat catatan di worker.js).
export async function generateImageBatch({ proxyUrl, topic, badge, style, count }) {
  const images = [];
  const errors = [];
  for (let i = 0; i < count; i++) {
    try {
      const img = await generateHeroImage({ proxyUrl, topic, badge, style });
      images.push(img);
    } catch (err) {
      images.push(null);
      errors.push(err.message);
    }
  }
  return { images, errors };
}
