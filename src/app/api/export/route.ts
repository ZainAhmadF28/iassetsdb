import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    const whereFilter: any = {};
    if (search) {
      whereFilter.OR = [
        { namaAset: { contains: search, mode: "insensitive" } },
        { nomorAset: { contains: search, mode: "insensitive" } },
      ];
    }

    const assets = await prisma.asset.findMany({
      where: whereFilter,
      orderBy: { updatedAt: "desc" },
    });

    // Fetch custom columns
    const customColumns = await prisma.assetCustomColumn.findMany({
      orderBy: { order: "asc" },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "IAssets SMBR";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("DATA ASET");

    // ── Column Definitions ──
    const baseColumns = [
      { header: "No",           key: "no",            width: 5  },
      { header: "ID Aset",      key: "id",            width: 20 },
      { header: "Nomor Aset",   key: "nomorAset",     width: 22 },
      { header: "Nama Aset",    key: "namaAset",      width: 32 },
      { header: "Kode Kelas",   key: "kodeKelas",     width: 15 },
      { header: "Kelas SMBR",   key: "kelasAsetSmbr", width: 28 },
      { header: "Kategori SIG", key: "kategoriSig",   width: 20 },
      { header: "Kondisi",      key: "kondisi",       width: 14 },
      { header: "QTY",          key: "qty",           width: 8  },
      { header: "Satuan",       key: "satuan",        width: 12 },
      { header: "Site",         key: "site",          width: 22 },
      { header: "Latitude",     key: "latitude",      width: 14 },
      { header: "Longitude",    key: "longitude",     width: 14 },
      { header: "Tgl Update",   key: "tanggalUpdate", width: 22 },
      { header: "Keterangan",   key: "keterangan",    width: 32 },
      { header: "Foto",         key: "foto",          width: 14 },
      { header: "QR Code",      key: "qr",            width: 14 },
    ];

    // Add custom columns
    const customColumnsHeaders = customColumns.map(col => ({
      header: col.name,
      key: `custom_${col.key}`,
      width: 20
    }));

    sheet.columns = [
      ...baseColumns,
      ...customColumnsHeaders,
      { header: "Created At",   key: "createdAt",     width: 22 },
      { header: "Updated At",   key: "updatedAt",     width: 22 },
    ];

    // ── Header Styling ──
    const headerRow = sheet.getRow(1);
    headerRow.height = 28;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1B5E40" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      cell.border = {
        top:    { style: "thin", color: { argb: "FF0D3D26" } },
        left:   { style: "thin", color: { argb: "FF0D3D26" } },
        bottom: { style: "thin", color: { argb: "FF0D3D26" } },
        right:  { style: "thin", color: { argb: "FF0D3D26" } },
      };
    });

    // ── Data Rows ──
    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      const rowIndex = i + 2;
      const row = sheet.getRow(rowIndex);

      row.height = 75;

      row.values = {
        no:            i + 1,
        id:            asset.id,
        nomorAset:     asset.nomorAset,
        namaAset:      asset.namaAset,
        kodeKelas:     asset.kodeKelas     || "-",
        kelasAsetSmbr: asset.kelasAsetSmbr || "-",
        kategoriSig:   (asset as any).kategoriSig || (asset as any).kelasAsetSig || "-",
        kondisi:       asset.kondisi,
        qty:           asset.qty,
        satuan:        asset.satuan        || "-",
        site:          asset.site          || "-",
        latitude:      asset.latitude      ?? "-",
        longitude:     asset.longitude     ?? "-",
        tanggalUpdate: asset.tanggalUpdate
          ? new Date(asset.tanggalUpdate).toLocaleString("id-ID")
          : "-",
        keterangan:    asset.keterangan    || "-",
        createdAt:     new Date(asset.createdAt).toLocaleString("id-ID"),
        updatedAt:     new Date(asset.updatedAt).toLocaleString("id-ID"),
      };

      // Add custom fields values
      customColumns.forEach(col => {
        const value = (asset as any).customFields?.[col.key];
        (row.values as any)[`custom_${col.key}`] = value !== undefined && value !== null ? String(value) : "-";
      });

      row.alignment = { vertical: "middle", wrapText: false };

      // Zebra stripe
      const bgColor = i % 2 === 0 ? "FFFFFFFF" : "FFF0F7F4";
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: bgColor },
        };
        cell.border = {
          top:    { style: "hair", color: { argb: "FFD0D0D0" } },
          left:   { style: "hair", color: { argb: "FFD0D0D0" } },
          bottom: { style: "hair", color: { argb: "FFD0D0D0" } },
          right:  { style: "hair", color: { argb: "FFD0D0D0" } },
        };
      });

      // ── Foto: Embed jika URL lokal, hyperlink jika URL http ──
      try {
        const fotoUrl = asset.fotoUrl;
        if (fotoUrl) {
          let extension = "png";
          if (fotoUrl.toLowerCase().endsWith(".jpg") || fotoUrl.toLowerCase().endsWith(".jpeg")) extension = "jpeg";

          let buffer;
          try {
            const urlToFetch = fotoUrl.startsWith("http") 
              ? fotoUrl 
              : `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://10.143.172.190:3000"}${fotoUrl}`;
            
            const response = await fetch(urlToFetch);
            if (response.ok) {
              const arrayBuffer = await response.arrayBuffer();
              buffer = Buffer.from(arrayBuffer);
            }
          } catch (fetchErr) {
            console.error("Gagal download gambar untuk digabung ke excel", fetchErr);
          }

          if (buffer) {
            const imageId = workbook.addImage({
              buffer: buffer as any,
              extension: extension as any,
            });
            const fotoColIndex = 15; // Kolom Foto (0-based)
            sheet.addImage(imageId, {
              tl: { col: fotoColIndex + 0.1, row: rowIndex - 1 + 0.1 } as any,
              ext: { width: 65, height: 65 },
              editAs: "oneCell",
            });
          } else {
             const fotoCell = row.getCell("foto");
             fotoCell.value = { text: "Link Foto", hyperlink: fotoUrl.startsWith("http") ? fotoUrl : `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://10.143.172.190:3000"}${fotoUrl}` };
             fotoCell.font = { color: { argb: "FF1565C0" }, underline: true };
          }
        }
      } catch (e) {
        console.error("Foto error:", e);
      }

      // ── QR Code: Generate dari id ──
      try {
        if (asset.id) {
          const qrBase64 = await QRCode.toDataURL(asset.id, {
            margin: 1,
            width: 100,
          });
          const base64Data = qrBase64.replace(/^data:image\/png;base64,/, "");
          const imageId = workbook.addImage({
            base64: base64Data,
            extension: "png",
          });
          const qrColIndex = 16; // Kolom QR Code (0-based)
          sheet.addImage(imageId, {
            tl: { col: qrColIndex + 0.1, row: rowIndex - 1 + 0.1 } as any,
            ext: { width: 65, height: 65 },
            editAs: "oneCell",
          });
        }
      } catch (e) {
        console.error("QR error:", e);
      }
    }

    // ── Freeze header row ──
    sheet.views = [{ state: "frozen", xSplit: 0, ySplit: 1 }];

    // ── Generate buffer ──
    const buffer = await workbook.xlsx.writeBuffer();

    const filename = `Data_Aset_${new Date().toISOString().slice(0, 10)}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Gagal export Excel" }, { status: 500 });
  }

  
}
