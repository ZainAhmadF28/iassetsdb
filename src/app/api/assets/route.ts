import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const where = search ? {
      OR: [
        { namaAset: { contains: search, mode: "insensitive" as const } },
        { nomorAset: { contains: search, mode: "insensitive" as const } },
      ],
    } : {};

    const assets = await prisma.asset.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: skip,
    });

    const total = await prisma.asset.count({ where });

    return Response.json({
      data: assets,
      total,
      hasMore: skip + assets.length < total,
    });
  } catch (error) {
    console.error("ERROR ASSETS:", error);
    return Response.json(
      { error: "DB ERROR" }, 
      { status: 500 }
    );
  }
}
