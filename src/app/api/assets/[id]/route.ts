import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updatedAsset = await prisma.asset.update({
      where: { id },
      data: {
        id: body.id !== undefined ? body.id : undefined,
        nomorAset: body.nomorAset,
        namaAset: body.namaAset,
        kelasAsetSmbr: body.kelasAsetSmbr,
        kategoriSig: body.kategoriSig || body.kelasAsetSig, // Handle both
        jenis: body.jenis,
        merk: body.merk,
        type: body.type,
        qty: body.qty !== undefined ? Number(body.qty) : undefined,
        satuan: body.satuan,
        latitude: body.latitude !== undefined && body.latitude !== null ? parseFloat(body.latitude) : null,
        longitude: body.longitude !== undefined && body.longitude !== null ? parseFloat(body.longitude) : null,
        site: body.site,
        kondisi: body.kondisi,
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await prisma.asset.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Asset deleted successfully" });
  } catch (error) {
    console.error("ERROR DELETING ASSET:", error);
    return NextResponse.json({ error: "Failed to delete asset" }, { status: 500 });
  }
}