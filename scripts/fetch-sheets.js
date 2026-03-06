#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

async function fetchJson(url) {
  if (typeof fetch === 'undefined') {
    try {
      global.fetch = require('node-fetch');
    } catch (e) {
      console.error('Fetch is not available. Run with Node 18+ or install node-fetch.');
      process.exit(1);
    }
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} when fetching ${url}`);
  return res.json();
}

async function main() {
  const API_KEY = process.env.SHEETS_API_KEY;
  const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

  if (!API_KEY || !SPREADSHEET_ID) {
    console.error('Missing SHEETS_API_KEY or SPREADSHEET_ID environment variables.');
    process.exit(1);
  }

  const productsRange = 'Products!A2:R1000';
  const categoriesRange = 'Categories!A2:B1000';

  const productsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(productsRange)}?key=${API_KEY}`;
  const categoriesUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(categoriesRange)}?key=${API_KEY}`;

  try {
    const [prodRes, catRes] = await Promise.all([fetchJson(productsUrl), fetchJson(categoriesUrl)]);

    const prodRows = prodRes.values || [];
    const catRows = catRes.values || [];

    const products = prodRows.map(row => ({
      id: Number(row[0] ?? 0),
      name: row[1] ?? '',
      price: Number(row[2] ?? 0),
      description: row[3] ?? '',
      imageUrl: row[4] ?? '',
      category: Number(row[5] ?? 0),
      topSale: (row[6] ?? '').toString().toLowerCase() === 'true',
      tagline: row[7] ?? '',
      origin: row[8] ?? '',
      harvestSeason: row[9] ?? '',
      processingMethod: row[10] ?? '',
      benefits: row[11] ?? '',
      preparation: row[12] ?? '',
      recipe1Title: row[13] ?? '',
      recipe1Steps: row[14] ?? '',
      recipe2Title: row[15] ?? '',
      recipe2Steps: row[16] ?? '',
      storageTips: row[17] ?? '',
      bundleSuggestions: row[18] ?? '',
    }));

    const categories = catRows.map(row => ({ id: Number(row[0] ?? 0), name: row[1] ?? '' }));

    const outDir = path.join(__dirname, '..', 'public', 'data');
    fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, 'sheets.json');
    fs.writeFileSync(outPath, JSON.stringify({ products, categories }, null, 2), 'utf8');
    console.log('Wrote', outPath);
  } catch (err) {
    console.error('Failed to fetch sheets:', err.message || err);
    process.exit(1);
  }
}

main();
