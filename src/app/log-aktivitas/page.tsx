"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { format } from "date-fns";
import {
  Menu, Search, X, Loader2
} from "lucide-react";
import Sidebar from "@/components/Sidebar";

interface AssetLog {
  id: string;
  assetId: string;
  userId: string | null;
  action: string;
  oldValue: string | null;
  newValue: string | null;
  catatan: string | null;
  createdAt: string;
  asset: {
    id: string;
    namaAset: string;
    nomorAset: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export default function LogAktivitasPage() {
  const [logs, setLogs] = useState<AssetLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalRecord, setTotalRecord] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AssetLog | null>(null);

  const fetchLogs = async (currentPage: number, currentSearch: string, isNewSearch: boolean) => {
    try {
      if (isNewSearch) setLoading(true);
      else setFetchingMore(true);

      const { data } = await axios.get(
        `/api/logs?page=${currentPage}&limit=50&search=${currentSearch}`
      );

      if (isNewSearch) {
        setLogs(data.data);
      } else {
        setLogs(prev => [...prev, ...data.data]);
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchLogs(1, search, true);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (page > 1) {
      fetchLogs(page, search, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 200) {
      if (hasMore && !loading && !fetchingMore) {
        setPage(prev => prev + 1);
      }
    }
  };

  const getActionBadgeColor = (action: string) => {
    switch (action.toUpperCase()) {
      case "CREATE":
        return "bg-green-100 text-green-700";
      case "UPDATE":
        return "bg-blue-100 text-blue-700";
      case "DELETE":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-50 font-sans text-sm flex flex-col transition-colors duration-300">
      {/* HEADER */}
      <header className="mx-4 mt-4 bg-white/70 backdrop-blur-lg border border-gray-200/60 p-4 shrink-0 rounded-2xl shadow-sm flex items-center justify-between z-10 transition-all duration-300">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsSidebarOpen(true)} 
            className="p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl transition-all duration-300 hover:shadow-md hover:scale-105 active:scale-95"
          >
            <Menu size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <img src="/icon.png" alt="Admin Panel" className="h-8 w-auto" />
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] uppercase rounded-full tracking-widest font-bold">Log</span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">PT. SEMEN BATURAJA TBK</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 mr-4 text-xs font-semibold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
            {totalRecord} Log Ditemukan
          </div>
        </div>
      </header>

      {/* SEARCH BAR */}
      <div className="px-4 py-4 shrink-0 z-10 w-full max-w-6xl mx-auto flex gap-3 items-center">
        <div className="relative group flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="text-gray-400 group-focus-within:text-purple-500 transition-colors duration-300" size={18} />
          </div>
          <input
            type="text"
            placeholder="Cari aset, user, atau catatan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white border border-gray-200/80 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-400 shadow-sm transition-all duration-300 hover:shadow-md"
          />
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="px-4 pb-4 overflow-y-auto overflow-x-auto flex-1 relative custom-scrollbar" onScroll={handleScroll}>
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 min-w-max w-full overflow-hidden transition-all duration-300">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 backdrop-blur-md bg-white/90">
              <tr className="text-gray-500 text-[11px] font-bold uppercase tracking-wider border-b border-gray-100">
                <th className="p-4 pl-6">Waktu</th>
                <th className="p-4">Action</th>
                <th className="p-4">Nomor Aset</th>
                <th className="p-4">Nama Aset</th>
                <th className="p-4">User</th>
                <th className="p-4 text-center pr-6">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                      <Loader2 className="animate-spin text-purple-500" size={32} />
                      <span className="font-medium animate-pulse">Memuat data log...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-400 flex-col items-center justify-center">
                    <Search className="mx-auto text-gray-300 mb-3" size={48} />
                    <span className="font-medium">Tidak ada log ditemukan</span>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr 
                    key={log.id} 
                    className="hover:bg-purple-50/50 border-b border-gray-50/50 transition-all duration-200 group"
                  >
                    <td className="p-4 pl-6">
                      {new Date(log.createdAt).toLocaleString("id-ID", {
                        timeZone: "Asia/Jakarta",
                      })}
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 text-[11px] font-bold rounded-full whitespace-nowrap ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-gray-600 text-xs">{log.asset?.nomorAset}</td>
                    <td className="p-4 font-semibold text-gray-800">{log.asset?.namaAset}</td>
                    <td className="p-4 text-gray-600">{log.user?.name || "Sistem"}</td>
                    <td className="p-4 text-center pr-6">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 font-bold rounded-lg transition-all text-xs"
                      >
                        Lihat
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {fetchingMore && (
            <div className="flex justify-center p-6 border-t border-gray-50">
              <Loader2 className="animate-spin text-purple-500" size={24} />
            </div>
          )}
        </div>
      </main>

      {/* DETAIL MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 transition-all duration-300">
          <div 
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            onClick={() => setSelectedLog(null)}
          ></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-7 animate-in zoom-in-95 duration-300 border border-gray-100 flex flex-col max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-start mb-6 pb-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-1">Detail Aktivitas Log</h2>
                <p className="text-xs text-gray-500 font-mono">{selectedLog.id}</p>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-6">
              {/* Waktu & Action */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Waktu</p>
                  <p className="text-sm text-gray-800 font-medium">{format(new Date(selectedLog.createdAt), "dd MMMM yyyy HH:mm:ss")}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Tipe Action</p>
                  <span className={`inline-block px-3 py-1.5 text-xs font-bold rounded-full ${getActionBadgeColor(selectedLog.action)}`}>
                    {selectedLog.action}
                  </span>
                </div>
              </div>

              {/* Aset Info */}
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
                <p className="text-xs font-bold text-purple-600 uppercase tracking-widest mb-3">Informasi Aset</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Nomor Aset</p>
                    <p className="text-sm font-mono font-bold text-gray-800">{selectedLog.asset?.nomorAset}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">ID Aset</p>
                    <p className="text-xs font-mono text-gray-600">{selectedLog.asset?.id}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 mb-1">Nama Aset</p>
                    <p className="text-sm font-medium text-gray-800">{selectedLog.asset?.namaAset}</p>
                  </div>
                </div>
              </div>

              {/* User Info */}
              {selectedLog.user ? (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Informasi User</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Nama</p>
                      <p className="text-sm font-medium text-gray-800">{selectedLog.user.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Email</p>
                      <p className="text-xs font-mono text-gray-600">{selectedLog.user.email}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">User</p>
                  <p className="text-sm text-gray-700">Sistem (Otomatis)</p>
                </div>
              )}

              {/* Changes */}
              {(selectedLog.oldValue || selectedLog.newValue) && (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Perubahan Data</p>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedLog.oldValue && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <p className="text-xs font-bold text-red-600 mb-2">Nilai Lama</p>
                        <p className="text-sm text-gray-800 font-mono break-all bg-white p-3 rounded-lg max-h-40 overflow-y-auto">
                          {selectedLog.oldValue}
                        </p>
                      </div>
                    )}
                    {selectedLog.newValue && (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                        <p className="text-xs font-bold text-green-600 mb-2">Nilai Baru</p>
                        <p className="text-sm text-gray-800 font-mono break-all bg-white p-3 rounded-lg max-h-40 overflow-y-auto">
                          {selectedLog.newValue}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Catatan */}
              {selectedLog.catatan && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Catatan</p>
                  <p className="text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-xl p-4">
                    {selectedLog.catatan}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-6 pt-6 border-t border-gray-200 flex gap-3">
              <button 
                onClick={() => setSelectedLog(null)}
                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-all duration-300 active:scale-95"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR COMPONENT */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} currentPage="log-aktivitas" />
    </div>
  );
}
