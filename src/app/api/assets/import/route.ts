import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as xlsx from "xlsx";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = xlsx.read(buffer, { type: "buffer" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(worksheet) as any[];

    if (!data.length) {
      return NextResponse.json({ error: "Excel file is empty" }, { status: 400 });
    }

    let successCount = 0;
    let failCount = 0;

    // NORMALISASI HEADER EXCEL (Mencegah error karena spasi/huruf besar-kecil)
    // "Kode Kelas", "KODE_KELAS", "kodeKelas" semuanya akan dibaca "kodekelas"
    const normalizedData = data.map((row) => {
      const newRow: any = {};
      for (const key in row) {
        if (row.hasOwnProperty(key)) {
          // Hilangkan spasi, underscore, strip, & ubah ke huruf kecil
          const cleanKey = key.replace(/[\s_\-]/g, '').toLowerCase();
          newRow[cleanKey] = row[key];
        }
      }
      return newRow;
    });

    for (const row of normalizedData) {
      try {
        // Mapping langsung dan aman ke nama database Anda yang sesungguhnya!
        // Jika ada 2 kolom Kode Kelas di Excel, Excel menamai kolom kedua "Kode Kelas_1"
        // yang setelah dinormalisasi bakal terbaca "kodekelas1".
        const assetData: any = {
          id: row.id || row.idaset || row.kodeaset || require("crypto").randomUUID(),
          kodeKelas: row.kodekelas1 || row.kodekelas || null,
          kelasAsetSmbr: row.kelasasetsmbr || row.kelassmbr || null,
          kategoriSig: row.kategorisig || row.kategori || null,
          nomorAset: row.nomoraset?.toString() || row.nomor?.toString() || "-",
          namaAset: row.namaaset?.toString() || row.nama?.toString() || "-",
          site: row.site || null,
          qty: parseInt(row.qty) || 1,
          satuan: row.satuan || null,
          jenis: row.jenis || null,
          merk: row.merk || null,
          type: row.type || row.tipe || null,
          latitude: parseFloat(row.latitude) || null,
          longitude: parseFloat(row.longitude) || null,
          kondisi: row.kondisi?.toUpperCase() || "BAIK",
          keterangan: row.keterangan || null,
          fotoUrl: row.fotourl || row.foto || null,
          qrCodeUrl: row.qrcodeurl || row.qrcode || null,
        };

        // Konversi Tanggal
        const rawDate = row.tanggalupdate || row.tglupdate || row.tanggaldari;
        if (rawDate) {
          const d = new Date(rawDate);
          assetData.tanggalUpdate = isNaN(d.getTime()) ? null : d;
        } else {
          assetData.tanggalUpdate = null;
        }

        // Handle NaN untuk coordinate
        if (isNaN(assetData.latitude)) assetData.latitude = null;
        if (isNaN(assetData.longitude)) assetData.longitude = null;

        // Pastikan Qty Valid
        if (isNaN(assetData.qty)) assetData.qty = 1;

        // Eksekusi Update atau Create ke Database (pakai ID atau Nomor Aset)
        let existingAsset = null;
        // Cari berdasarkan Nomor Aset terlebih dahulu jika valid
        if (assetData.nomorAset && assetData.nomorAset !== "-") {
          existingAsset = await prisma.asset.findFirst({
            where: { nomorAset: assetData.nomorAset }
          });
        }
        
        // Jika tidak ketemu dari Nomor Aset, coba cari menggunakan ID bawaan Excel
        const excelId = row.id || row.idaset || row.kodeaset;
        if (!existingAsset && excelId) {
          existingAsset = await prisma.asset.findUnique({
            where: { id: String(excelId) }
          });
        }

        if (existingAsset) {
          // Update data jika sudah ada
          const { id, ...dataToUpdate } = assetData; // buang property id agar tetap pakai id aslinya di database
          await prisma.asset.update({
            where: { id: existingAsset.id },
            data: dataToUpdate,
          });
        } else {
          // Buat data baru jika tidak ada
          await prisma.asset.create({
            data: assetData,
          });
        }
        
        successCount++;
      } catch (error) {
        console.error("Failed row:", row, error);
        failCount++;
      }
    }

    return NextResponse.json({ 
      message: "Import finished", 
      successCount, 
      failCount,
      total: data.length
    });
  } catch (error) {
    console.error("ERROR IMPORT:", error);
    return NextResponse.json({ error: "Failed to import assets" }, { status: 500 });
  }
}
