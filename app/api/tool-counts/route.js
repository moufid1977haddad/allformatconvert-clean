import { getToolCounts } from '@/lib/toolCounts';

export async function GET() {
  return Response.json(getToolCounts());
}
