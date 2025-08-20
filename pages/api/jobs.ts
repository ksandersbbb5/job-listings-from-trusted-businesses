import type { NextApiRequest, NextApiResponse } from 'next';
import { getJobs } from '../../lib/fetchJobs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const jobs = await getJobs();
    res.status(200).json({ jobs });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Failed to load jobs' });
  }
}
