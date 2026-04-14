import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;
    const kondisi = searchParams.get("kondisi") || "";
    const kategori = searchParams.get("kategori") || "";

    const where: any = {};

    // Filter berdasarkan search
    if (search) {
      where.OR = [
        { namaAset: { contains: search, mode: "insensitive" as const } },
        { nomorAset: { contains: search, mode: "insensitive" as const } },
      ];
    }

    // Filter berdasarkan kondisi
    if (kondisi) {
      where.kondisi = kondisi;
    }

    // Filter berdasarkan kategori (kategoriSig)
    if (kategori) {
      where.kategoriSig = kategori;
    }

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Add logic here to create asset
    const newAsset = await prisma.asset.create({
      data: {
        id: body.id, // wajib ditambahkan dari form
        nomorAset: body.nomorAset,
        namaAset: body.namaAset,
        kodeKelas: body.kodeKelas,
        kelasAsetSmbr: body.kelasAsetSmbr,
        kategoriSig: body.kategoriSig || body.kelasAsetSig,
        jenis: body.jenis,
        merk: body.merk,
        type: body.type,
        kondisi: body.kondisi || "BAIK",
        qty: parseInt(body.qty) || 1,
        satuan: body.satuan,
        site: body.site,
        latitude: parseFloat(body.latitude) || null,
        longitude: parseFloat(body.longitude) || null,
        keterangan: body.keterangan,
      }
    });

    return Response.json({ data: newAsset }, { status: 201 });
  } catch (error) {
    console.error("ERROR CREATE ASSET:", error);
    return Response.json(
      { error: "Failed to create asset" },
      { status: 500 }
    );
  }
}
