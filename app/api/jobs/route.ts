// app/api/jobs/route.ts
import { NextResponse } from 'next/server';
import { getJobs } from '../../../lib/fetchJobs';

export const revalidate = 60;

export async function GET() {
  try {
    const jobs = await getJobs();
    return NextResponse.json({ jobs }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to load jobs' }, { status: 500 });
  }
}
