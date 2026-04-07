import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const GET = async (req: NextRequest) => {
  try {
    const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "50");
    const search = req.nextUrl.searchParams.get("search") || "";
    
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { catatan: { contains: search, mode: "insensitive" } },
        { action: { contains: search, mode: "insensitive" } },
        { asset: { namaAset: { contains: search, mode: "insensitive" } } },
        { user: { name: { contains: search, mode: "insensitive" } } }
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.assetLog.findMany({
        where,
        include: {
          asset: {
            select: {
              id: true,
              namaAset: true,
              nomorAset: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip
      }),
      prisma.assetLog.count({ where })
    ]);

    const hasMore = skip + limit < total;

    return NextResponse.json({
      data: logs,
      total,
      hasMore,
      page,
      limit
    });
  } catch (error) {
    console.error("Error fetching logs:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data log" },
      { status: 500 }
    );
  }
};
