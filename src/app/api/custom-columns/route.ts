import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/custom-columns
export async function GET() {
  try {
    const columns = await prisma.assetCustomColumn.findMany({
      orderBy: { order: "asc" },
    });
    return NextResponse.json(columns);
  } catch (error: any) {
    console.error("Failed to fetch custom columns:", error);
    return NextResponse.json({ error: "Failed to fetch custom columns" }, { status: 500 });
  }
}

// POST /api/custom-columns
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, key, type, options, required, order } = body;

    if (!name || !key || !type) {
      return NextResponse.json({ error: "Name, key, and type are required" }, { status: 400 });
    }

    const newColumn = await prisma.assetCustomColumn.create({
      data: {
        name,
        key: key.replace(/[\s_\-]/g, '').toLowerCase(), // pastikan tanpa spasi/karakter aneh
        type,
        options: options ? JSON.parse(JSON.stringify(options)) : null,
        required: !!required,
        order: Number(order) || 0,
      },
    });

    return NextResponse.json(newColumn, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create custom column:", error);
    return NextResponse.json({ error: "Failed to create custom column" }, { status: 500 });
  }
}
