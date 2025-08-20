// pages/api/debug-rows.js
import { _debugFetchRaw } from '../../lib/fetchJobs.js';

export default async function handler(_req, res) {
  try {
    const rows = await _debugFetchRaw();
    res.status(200).json({ sampleCount: rows.length, sample: rows.slice(0, 5) });
  } catch (e) {
    res.status(500).json({ error: e?.message || String(e) });
  }
}
