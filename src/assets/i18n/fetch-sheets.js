#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

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
  const SERVICE_ACCOUNT_KEY = process.env.SERVICE_ACCOUNT_KEY;

  if (!SPREADSHEET_ID) {
    console.error('Missing SPREADSHEET_ID environment variable.');
    process.exit(1);
  }

  if (!SERVICE_ACCOUNT_KEY && !API_KEY) {
    console.error('Missing SERVICE_ACCOUNT_KEY or SHEETS_API_KEY environment variable.');
    process.exit(1);
  }

  const productsRange = 'Products!A2:R1000';
  const categoriesRange = 'Categories!A2:B1000';

  const productsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(productsRange)}?key=${API_KEY}`;
  const categoriesUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(categoriesRange)}?key=${API_KEY}`;

  try {
    let prodRes, catRes;

    if (SERVICE_ACCOUNT_KEY) {
      // SERVICE_ACCOUNT_KEY may be base64 or raw JSON
      let serviceAccount;
      try {
        serviceAccount = JSON.parse(Buffer.from(SERVICE_ACCOUNT_KEY, 'base64').toString());
      } catch (e) {
        try {
          serviceAccount = JSON.parse(SERVICE_ACCOUNT_KEY);
        } catch (ee) {
          throw new Error('SERVICE_ACCOUNT_KEY must be valid JSON or base64-encoded JSON');
        }
      }

      const jwtClient = new google.auth.JWT(
        serviceAccount.client_email,
        null,
        serviceAccount.private_key,
        ['https://www.googleapis.com/auth/spreadsheets.readonly']
      );

      await jwtClient.authorize();
      const sheets = google.sheets({ version: 'v4', auth: jwtClient });
      const [p, c] = await Promise.all([
        sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: productsRange }),
        sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: categoriesRange }),
      ]);

      prodRes = p.data;
      catRes = c.data;
    } else {
      const [p, c] = await Promise.all([fetchJson(productsUrl), fetchJson(categoriesUrl)]);
      prodRes = p;
      catRes = c;
    }

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
