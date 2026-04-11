import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const job = await prisma.jobPosting.findFirst({
    where: { id, published: true },
    select: { id: true, title: true, department: true, location: true, type: true, description: true, published: true },
  });
  if (!job) return NextResponse.json(null, { status: 404 });
  return NextResponse.json(job);
}
