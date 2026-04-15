import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Mengambil, Mengupdate, Menghapus 1 Kolom Custom
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const column = await prisma.assetCustomColumn.findUnique({
      where: { id },
    });
    if (!column) return NextResponse.json({ error: "Column not found" }, { status: 404 });
    return NextResponse.json(column);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch column" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, key, type, options, required, order } = body;

    const updatedColumn = await prisma.assetCustomColumn.update({
      where: { id },
      data: {
        name,
        key: key?.replace(/[\s_\-]/g, '').toLowerCase(),
        type,
        options: options ? JSON.parse(JSON.stringify(options)) : null,
        required: !!required,
        order: Number(order) || 0,
      },
    });
    return NextResponse.json(updatedColumn);
  } catch (error) {
    console.error("Failed to update column:", error);
    return NextResponse.json({ error: "Failed to update column" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.assetCustomColumn.delete({
      where: { id },
    });
    return NextResponse.json({ message: "Column deleted successfully" });
  } catch (error) {
    console.error("Failed to delete column:", error);
    return NextResponse.json({ error: "Failed to delete column" }, { status: 500 });
  }
}
