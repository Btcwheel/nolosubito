#!/usr/bin/env node
import sharp from "sharp";
import png2icons from "png2icons";
import fs from "fs";
import path from "path";

const SVG_SRC = path.resolve("public/logo-nolo.svg");
const OUT_DIR = path.resolve("operator-desktop/build");

fs.mkdirSync(OUT_DIR, { recursive: true });

// Copy SVG source
fs.copyFileSync(SVG_SRC, path.join(OUT_DIR, "icon.svg"));
console.log("  Copiato icon.svg");

// Render 1024×1024 PNG from SVG
const BIG_PNG = path.join(OUT_DIR, "__temp_1024.png");
await sharp(SVG_SRC)
  .resize(1024, 1024)
  .png()
  .toFile(BIG_PNG);
console.log("  Generato PNG 1024×1024");

const pngBuf = fs.readFileSync(BIG_PNG);

// ── .icns (Mac) ──
const icnsBuf = png2icons.createICNS(pngBuf, png2icons.BICUBIC, 0);
if (!icnsBuf) throw new Error("Failed to create ICNS");
fs.writeFileSync(path.join(OUT_DIR, "icon.icns"), icnsBuf);
console.log("  Generato icon.icns");

// ── .ico (Windows) ──
const icoBuf = png2icons.createICO(pngBuf, png2icons.BICUBIC, 0);
if (!icoBuf) throw new Error("Failed to create ICO");
fs.writeFileSync(path.join(OUT_DIR, "icon.ico"), icoBuf);
console.log("  Generato icon.ico");

// ── 512×512 PNG (tray icon) ──
await sharp(SVG_SRC)
  .resize(512, 512)
  .png()
  .toFile(path.join(OUT_DIR, "icon.png"));
console.log("  Generato icon.png 512×512");

// Cleanup temp
fs.unlinkSync(BIG_PNG);

console.log(`\nFatto. Icone in: ${OUT_DIR}`);
