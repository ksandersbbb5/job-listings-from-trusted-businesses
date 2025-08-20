import { getJobs } from '../../lib/fetchJobs';

export default async function handler(_req, res) {
  try {
    const jobs = await getJobs();
    res.status(200).json({ jobs });
  } catch (e) {
    res.status(500).json({ error: e?.message || 'Failed to load jobs' });
  }
}
