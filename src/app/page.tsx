"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { format } from "date-fns";
import {
  Menu, Search, Home, Maximize, LogOut,
  Edit, Trash2, X, DownloadCloud, Loader2
} from "lucide-react";


interface Asset {
  id: string;
  nomorAset: string;
  namaAset: string;
  kodeKelas: string | null;
  kelasAsetSmbr: string | null;
  kategoriSig: string | null;
  kondisi: string;
  qty: number;
  satuan: string | null;
  site: string | null;
  latitude: number | null;
  longitude: number | null;
  tanggalUpdate: string | null;
  keterangan: string | null;
  fotoUrl: string | null;
  qrCodeUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function Dashboard() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalRecord, setTotalRecord] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const fetchAssets = async (currentPage: number, currentSearch: string, isNewSearch: boolean) => {
    try {
      if (isNewSearch) setLoading(true);
      else setFetchingMore(true);

      const { data } = await axios.get(`/api/assets?page=${currentPage}&limit=50&search=${currentSearch}`);

      if (isNewSearch) {
        setAssets(data.data);
      } else {
        setAssets(prev => [...prev, ...data.data]);
      }
      setHasMore(data.hasMore);
      setTotalRecord(data.total);
    } catch (error) {
      console.error("Gagal load data", error);
    } finally {
      setLoading(false);
      setFetchingMore(false);
    }
  };

  // Efek berjalan setiap pencarian berubah (debounce 500ms agar server tidak berat)
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchAssets(1, search, true);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Efek berjalan khusus jika Halaman bertambah dari Infinite Scroll
  useEffect(() => {
    if (page > 1) {
      fetchAssets(page, search, false);
    }
  }, [page]);

  // Fungsi Deteksi Scroll mentok bawah
  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 200) {
      if (hasMore && !loading && !fetchingMore) {
        setPage(prev => prev + 1);
      }
    }
  };

  // Fitur Export Excel — memanggil API server-side (ExcelJS, styled, QR code)
  const handleExportExcel = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const response = await axios.get(`/api/export?search=${encodeURIComponent(search)}`, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Data_Aset_${format(new Date(), "yyyyMMdd")}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Gagal export", error);
    } finally {
      setIsExporting(false);
    }
  };

  // Fungsi pembantu untuk membuat URL file nembak ke Backend API
  const getFileUrl = (url: string | null) => {
    if (!url) return undefined;
    if (url.startsWith("http")) return url;
    // Ganti base URL ini sesuai dengan URL dan port backend API Anda (tempat file /uploads/... berada)
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://192.168.110.119:3002";
    return `${backendUrl}${url}`;
  };

  const getKondisiBadge = (kondisi: string) => {
    switch (kondisi) {
      case "BAIK": return <span className="px-2 py-1 text-xs font-bold bg-green-100 text-green-700 rounded">Baik</span>;
      case "RUSAK": return <span className="px-2 py-1 text-xs font-bold bg-orange-100 text-orange-700 rounded">Rusak</span>;
      case "RUSAK_BERAT": return <span className="px-2 py-1 text-xs font-bold bg-red-100 text-red-700 rounded">Rusak Berat</span>;
      case "HILANG": return <span className="px-2 py-1 text-xs font-bold bg-gray-200 text-gray-700 rounded">Hilang</span>;
      default: return <span className="px-2 py-1 text-xs font-bold bg-gray-100 text-gray-500 rounded">Blm Dicek</span>;
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-gray-50 font-sans text-sm flex flex-col">
      <header className="bg-[#1B5E40] text-white p-3 flex items-center justify-between shadow-md z-10 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-white/10 rounded-md hover:bg-white/20 transition">
            <Menu size={20} />
          </button>
          <div>
            <h1 className="font-semibold text-lg leading-tight">Admin Panel - Aset</h1>
            <p className="text-xs text-green-200">PT. SEMEN BATURAJA TBK</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 bg-white/10 rounded-md hover:bg-white/20 transition"><Home size={18} /></button>
          <button className="p-2 bg-white/10 rounded-md hover:bg-white/20 transition"><Maximize size={18} /></button>
          <button className="p-2 bg-white/10 rounded-md hover:bg-white/20 transition"><LogOut size={18} /></button>
        </div>
      </header>

      <div className="bg-[#2C7A51] px-4 py-3 flex items-center justify-between shrink-0">
        <div className="text-white flex items-center gap-2 font-medium">
          <span className="bg-white/20 px-2 py-1 rounded">{totalRecord} record</span>
        </div>
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Cari nama atau nomor aset..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-md bg-white/90 text-gray-800 placeholder-gray-500 focus:outline-none focus:bg-white border-none shadow-inner"
          />
        </div>
      </div>

      <main
        className="p-4 overflow-y-auto overflow-x-auto flex-1 relative"
        onScroll={handleScroll}
      >
        <div className="bg-white rounded-md shadow min-w-max w-full">
          <table className="w-full whitespace-nowrap text-left border-collapse min-w-full">
            <thead className="sticky top-0 z-10 shadow-sm">
              <tr className="bg-[#1B5E40] text-white text-xs uppercase tracking-wider">
                <th className="p-3 border-b-2 border-green-800 rounded-tl-md">NOMOR ASET</th>
                <th className="p-3 border-b-2 border-green-800">NAMA ASET</th>
                <th className="p-3 border-b-2 border-green-800">KODE KELAS</th>
                <th className="p-3 border-b-2 border-green-800">KELAS SMBR</th>
                <th className="p-3 border-b-2 border-green-800">KATEGORI SIG</th>
                <th className="p-3 border-b-2 border-green-800">KONDISI</th>
                <th className="p-3 border-b-2 border-green-800">QTY</th>
                <th className="p-3 border-b-2 border-green-800">SATUAN</th>
                <th className="p-3 border-b-2 border-green-800">SITE</th>
                <th className="p-3 border-b-2 border-green-800">LATITUDE</th>
                <th className="p-3 border-b-2 border-green-800">LONGITUDE</th>
                <th className="p-3 border-b-2 border-green-800">TGL UPDATE</th>
                <th className="p-3 border-b-2 border-green-800">KETERANGAN</th>
                <th className="p-3 border-b-2 border-green-800 text-center">FOTO</th>
                <th className="p-3 border-b-2 border-green-800 text-center">QR CODE</th>
                <th className="p-3 border-b-2 border-green-800 text-center rounded-tr-md">AKSI</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {loading ? (
                <tr><td colSpan={16} className="p-4 text-center">Loading data...</td></tr>
              ) : assets.length === 0 ? (
                <tr><td colSpan={16} className="p-4 text-center">Tidak ada data aset</td></tr>
              ) : (
                assets.map((asset, idx) => (
                  <tr key={asset.id} className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-green-50 border-b border-gray-100`}>
                    <td className="p-3 font-semibold">{asset.nomorAset}</td>
                    <td className="p-3">{asset.namaAset}</td>
                    <td className="p-3">{asset.kodeKelas || '-'}</td>
                    <td className="p-3">{asset.kelasAsetSmbr || '-'}</td>
                    <td className="p-3"><span className="text-xs font-bold text-green-800 uppercase">{asset.kategoriSig || 'PERLENGKAPAN'}</span></td>
                    <td className="p-3">{getKondisiBadge(asset.kondisi)}</td>
                    <td className="p-3 font-bold">{asset.qty}</td>
                    <td className="p-3">{asset.satuan || '-'}</td>
                    <td className="p-3">{asset.site || '-'}</td>
                    <td className="p-3">{asset.latitude || '-'}</td>
                    <td className="p-3">{asset.longitude || '-'}</td>
                    <td className="p-3">{asset.tanggalUpdate ? format(new Date(asset.tanggalUpdate), "dd/MM/yy, HH.mm") : '-'}</td>
                    <td className="p-3 truncate max-w-[150px]" title={asset.keterangan || ""}>{asset.keterangan || '-'}</td>
                    {/* Kolom Foto */}
                    <td className="p-2 text-center">
                      {asset.fotoUrl ? (
                        <a href={getFileUrl(asset.fotoUrl)} target="_blank" rel="noopener noreferrer" title="Lihat Foto" className="text-blue-500 underline text-xs">
                          <img
                            src={getFileUrl(asset.fotoUrl)}
                            alt="Foto Aset"
                            className="w-12 h-12 object-cover rounded border border-gray-200 mx-auto hover:scale-110 transition-transform"
                            onError={(e) => { 
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).parentElement!.innerText = 'Link Foto'; 
                            }}
                          />
                        </a>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    {/* Kolom QR Code */}
                    <td className="p-2 text-center">
                      {asset.qrCodeUrl ? (
                        <a href={getFileUrl(asset.qrCodeUrl)} target="_blank" rel="noopener noreferrer" title="Lihat QR Code" className="text-blue-500 underline text-xs">
                          <img
                            src={getFileUrl(asset.qrCodeUrl)}
                            alt="QR Code"
                            className="w-12 h-12 object-contain mx-auto hover:scale-110 transition-transform"
                            onError={(e) => { 
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).parentElement!.innerText = 'Link QR';
                            }}
                          />
                        </a>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-2">
                        <button className="p-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded-full transition" title="Edit">
                          <Edit size={14} />
                        </button>
                        <button className="p-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-full transition" title="Hapus">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {fetchingMore && (
            <div className="flex justify-center p-4">
              <Loader2 className="animate-spin text-green-700" size={24} />
            </div>
          )}
        </div>
      </main>

      <button
        onClick={handleExportExcel}
        disabled={isExporting}
        title="Export Data ke Excel"
        className={`fixed bottom-6 right-6 p-4 ${isExporting ? 'bg-gray-400' : 'bg-[#1B5E40] hover:bg-green-800'} text-white rounded-full shadow-xl transition transform hover:scale-105 z-40`}
      >
        {isExporting ? <Loader2 className="animate-spin" size={24} /> : <DownloadCloud size={24} />}
      </button>

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex">
          <div className="bg-[#1B5E40] w-72 h-full shadow-2xl flex flex-col transform transition-transform text-white">
            <div className="p-4 flex items-center justify-between border-b border-green-800">
              <h2 className="font-bold text-lg flex items-center gap-2">Pilih Tabel</h2>
              <button onClick={() => setIsSidebarOpen(false)} className="p-1 bg-white/10 rounded-full hover:bg-white/20"><X size={20} /></button>
            </div>
            <div className="p-4 flex-1 space-y-3">
              <div className="p-3 rounded-xl bg-white text-[#1B5E40] font-bold shadow flex justify-between items-center cursor-pointer">
                <span>📦 Aset <br /><span className="text-xs text-gray-500 font-normal">CRUD + semua kolom</span></span>
                <span className="text-green-600">✓</span>
              </div>
              <div className="p-3 rounded-xl bg-white/10 hover:bg-white/20 font-bold flex justify-between items-center cursor-pointer transition">
                <span>👥 User <br /><span className="text-xs text-green-200 font-normal">Read-only</span></span>
              </div>
              <div className="p-3 rounded-xl bg-white/10 hover:bg-white/20 font-bold flex justify-between items-center cursor-pointer transition">
                <span>📈 Activity Log <br /><span className="text-xs text-green-200 font-normal">Read-only</span></span>
              </div>
            </div>
            <div className="p-4">
              <button className="flex items-center justify-center gap-2 p-3 w-full bg-red-500 hover:bg-red-600 rounded-xl font-bold transition shadow-md">
                <LogOut size={18} /> Logout
              </button>
            </div>
          </div>
          <div className="flex-1 cursor-pointer" onClick={() => setIsSidebarOpen(false)}></div>
        </div>
      )}
    </div>
  );
}