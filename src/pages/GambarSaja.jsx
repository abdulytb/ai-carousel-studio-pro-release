import React, { useState, useEffect } from "react";
import { Sparkles, Loader2, Download } from "lucide-react";
import { IMAGE_STYLES, generateImageBatch } from "../ai/providers/imageProvider.js";
import { detectCategory, CATEGORIES } from "../ai/engines/categoryEngine.js";
import { downloadBlob, buildZip, dataUrlToUint8 } from "../lib/exportEngine.js";
import { loadSettings, saveSettings } from "../lib/storage.js";
import { chipStyle, secondaryBtnStyle } from "../components/common.jsx";

const COUNT_OPTIONS = [5, 6, 7, 8, 9, 10];

// Halaman TERPISAH dari Carousel Lengkap (lihat App.jsx) — khusus buat
// generate gambar AI mentah dari topik/kata kunci, TANPA konten teks
// carousel sama sekali. Ditujukan buat user yang mau olah teksnya sendiri
// pakai tools lain (Canva, AI lain, dst) — jadi cukup butuh foto AI-nya,
// bukan carousel jadi.
//
// Proxy URL & Gaya Gambar SENGAJA dibaca/disimpan ke localStorage key yang
// SAMA dengan halaman Carousel Lengkap (lihat loadSettings/saveSettings di
// lib/storage.js) — supaya 2 halaman ini tetap sinkron satu sama lain,
// user gak perlu isi Proxy URL dua kali di tempat berbeda.
export default function GambarSaja() {
  const [topik, setTopik] = useState("");
  const [jumlahGambar, setJumlahGambar] = useState(6);
  const [gayaGambar, setGayaGambar] = useState("realistic");
  const [proxyUrl, setProxyUrl] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const s = loadSettings();
    if (s) {
      setProxyUrl(s.heroImageProxyUrl || "");
      setGayaGambar(s.imageStyle || "realistic");
    }
  }, []);

  const handleGenerate = async () => {
    const t = topik.trim();
    if (!t) return;
    if (!proxyUrl.trim()) {
      setError("Proxy URL (Cloudflare Worker) belum diisi — wajib buat fitur gambar AI.");
