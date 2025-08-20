// pages/api/debug-source.js
export default async function handler(_req, res) {
  try {
    const url = process.env.SHEET_URL || process.env.NEXT_PUBLIC_SHEET_URL;
    if (!url) return res.status(500).json({ error: 'Missing SHEET_URL env var' });

    const r = await fetch(url, { cache: 'no-store' });
    const text = await r.text();
    res.status(200).json({
      sheetUrl: url,
      status: r.status,
      contentType: r.headers.get('content-type') || '',
      length: text.length,
      preview: text.slice(0, 1000) // inspect the first 1k chars
    });
  } catch (e) {
    res.status(500).json({ error: e?.message || String(e) });
  }
}
