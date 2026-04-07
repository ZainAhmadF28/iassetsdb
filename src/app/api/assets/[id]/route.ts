import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const updatedAsset = await prisma.asset.update({
      where: { id },
      data: {
        namaAset: body.namaAset,
        kondisi: body.kondisi,
        qty: body.qty !== undefined ? Number(body.qty) : undefined,
        satuan: body.satuan,
        site: body.site,
        keterangan: body.keterangan,
        tanggalUpdate: new Date().toISOString(),
      },
    });

    return NextResponse.json({ message: "Asset updated successfully", data: updatedAsset });
  } catch (error) {
    console.error("ERROR UPDATING ASSET:", error);
    return NextResponse.json({ error: "Failed to update asset" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    await prisma.asset.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Asset deleted successfully" });
  } catch (error) {
    console.error("ERROR DELETING ASSET:", error);
    return NextResponse.json({ error: "Failed to delete asset" }, { status: 500 });
  }
}