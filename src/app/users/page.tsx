"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { format } from "date-fns";
import {
  Menu, Search, X, Loader2, Edit, Trash2, AlertTriangle, Plus
} from "lucide-react";
import Sidebar from "@/components/Sidebar";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalRecord, setTotalRecord] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{isOpen: boolean; id: string; nama: string}>({ isOpen: false, id: "", nama: "" });
  const [isDeleting, setIsDeleting] = useState(false);

  // ADD STATE
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newUser, setNewUser] = useState<Partial<User>>({});
  const [newPassword, setNewPassword] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // EDIT STATE
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<Partial<User>>({});
  const [isSaving, setIsSaving] = useState(false);

  const fetchUsers = async (currentPage: number, currentSearch: string, isNewSearch: boolean) => {
    try {
      if (isNewSearch) setLoading(true);
      else setFetchingMore(true);

      const { data } = await axios.get(`/api/users?page=${currentPage}&limit=50&search=${currentSearch}`);

      if (isNewSearch) {
        setUsers(data.data);
      } else {
        setUsers(prev => [...prev, ...data.data]);
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

  // Efek berjalan setiap pencarian berubah (debounce 500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchUsers(1, search, true);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Efek berjalan khusus jika Halaman bertambah dari Infinite Scroll
  useEffect(() => {
    if (page > 1) {
      fetchUsers(page, search, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleDelete = (id: string, nama: string) => {
    setDeleteConfirm({ isOpen: true, id, nama });
  };

  const executeDelete = async () => {
    const { id } = deleteConfirm;
    setIsDeleting(true);
    try {
      await axios.delete(`/api/users/${id}`);
      setUsers((prev) => prev.filter((user) => user.id !== id));
      setTotalRecord((prev) => prev - 1);
      setDeleteConfirm({ isOpen: false, id: "", nama: "" });
    } catch (error) {
      console.error("Gagal menghapus user", error);
      alert("Gagal menghapus user. Silakan coba lagi.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (id: string) => {
    const userToEdit = users.find(u => u.id === id);
    if (!userToEdit) return;
    setEditUser({ ...userToEdit });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editUser.id) return;
    setIsSaving(true);
    try {
      const response = await axios.put(`/api/users/${editUser.id}`, {
        name: editUser.name,
        email: editUser.email,
        role: editUser.role,
      });
      setUsers(prev => prev.map(u => u.id === editUser.id ? { ...u, ...response.data.data } : u));
      setEditModalOpen(false);
    } catch (error) {
      console.error("Gagal update user", error);
      alert("Gagal update user. Silakan coba lagi.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newPassword) {
      alert("Nama, Email, dan Password wajib diisi!");
      return;
    }

    setIsAdding(true);
    try {
      const response = await axios.post("/api/users", {
        name: newUser.name,
        email: newUser.email,
        password: newPassword,
        role: newUser.role || "user"
      });
      setUsers((prev) => [response.data.data, ...prev]);
      setTotalRecord((prev) => prev + 1);
      setAddModalOpen(false);
      setNewUser({});
      setNewPassword("");
    } catch (error) {
      console.error("Gagal menambah user", error);
      alert("Gagal menambah user. Silakan coba lagi.");
    } finally {
      setIsAdding(false);
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
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] uppercase rounded-full tracking-widest font-bold">Users</span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">PT. SEMEN BATURAJA TBK</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 mr-4 text-xs font-semibold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            {totalRecord} User Ditemukan
          </div>
        </div>
      </header>

      {/* SEARCH BAR */}
      <div className="px-4 py-4 shrink-0 z-10 w-full max-w-6xl mx-auto flex gap-3 items-center">
        {/* Tambah User Button */}
        <button
          onClick={() => setAddModalOpen(true)}
          className="px-5 py-3.5 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 font-semibold shadow-sm shadow-blue-600/30 hover:shadow-md transition-all duration-300 whitespace-nowrap flex items-center gap-2"
        >
          <Plus size={18} />
          <span>Tambah User</span>
        </button>

        <div className="relative group flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="text-gray-400 group-focus-within:text-blue-500 transition-colors duration-300" size={18} />
          </div>
          <input
            type="text"
            placeholder="Cari nama atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white border border-gray-200/80 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 shadow-sm transition-all duration-300 hover:shadow-md"
          />
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main
        className="px-4 pb-4 overflow-y-auto overflow-x-auto flex-1 relative custom-scrollbar"
        onScroll={handleScroll}
      >
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 min-w-max w-full overflow-hidden transition-all duration-300">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 backdrop-blur-md bg-white/90">
              <tr className="text-gray-500 text-[11px] font-bold uppercase tracking-wider border-b border-gray-100">
                <th className="p-4 pl-6">ID</th>
                <th className="p-4">Nama</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Dibuat</th>
                <th className="p-4 text-center pr-6">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                      <Loader2 className="animate-spin text-blue-500" size={32} />
                      <span className="font-medium animate-pulse">Memuat data user...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-400 flex-col items-center justify-center">
                    <Search className="mx-auto text-gray-300 mb-3" size={48} />
                    <span className="font-medium">Tidak ada user ditemukan</span>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr 
                    key={user.id} 
                    className="hover:bg-blue-50/50 border-b border-gray-50/50 transition-all duration-200 group"
                  >
                    <td className="p-4 pl-6 text-gray-500 font-mono text-[11px] truncate max-w-[100px]">{user.id}</td>
                    <td className="p-4 font-semibold text-gray-800">{user.name}</td>
                    <td className="p-4 text-gray-600">{user.email}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                        user.role === "admin" 
                          ? "bg-red-100 text-red-700" 
                          : "bg-gray-100 text-gray-700"
                      }`}>
                        {user.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500 text-xs">{format(new Date(user.createdAt), "dd/MM/yyyy HH:mm")}</td>
                    <td className="p-4 text-center pr-6">
                      <div className="flex gap-2 justify-center transition-opacity">
                        <button
                          onClick={() => handleEdit(user.id)}
                          className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(user.id, user.name)}
                          className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {fetchingMore && (
          <div className="py-6 text-center">
            <Loader2 className="animate-spin text-blue-500 mx-auto" size={24} />
          </div>
        )}
      </main>

      {/* SIDEBAR COMPONENT */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} currentPage="users" />

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 transition-all duration-300">
          <div 
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            onClick={() => !isDeleting && setDeleteConfirm({ isOpen: false, id: "", nama: "" })}
          ></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-300 border border-gray-100 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-5 shadow-inner">
              <AlertTriangle size={32} className={`${isDeleting ? "animate-pulse" : ""}`} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Konfirmasi Hapus</h3>
            <p className="text-gray-500 mb-8 text-sm leading-relaxed">
              Apakah Anda yakin ingin menghapus user <br/>
              <strong className="text-gray-700 font-bold">{deleteConfirm.nama}</strong>?<br/>
              <span className="text-xs text-red-400 mt-2 block">Tindakan ini tidak dapat dibatalkan.</span>
            </p>
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setDeleteConfirm({ isOpen: false, id: "", nama: "" })}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-all duration-300 active:scale-95 disabled:opacity-50"
              >
                Batal
              </button>
              <button 
                onClick={executeDelete}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl transition-all duration-300 active:scale-95 shadow-lg shadow-red-500/30 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="animate-spin" size={18} /> : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 transition-all duration-300">
          <div 
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            onClick={() => !isSaving && setEditModalOpen(false)}
          ></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg p-7 animate-in slide-in-from-bottom-5 duration-300 border border-gray-100 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl"><Edit size={18} /></div>
                Edit User
              </h3>
              <button 
                onClick={() => !isSaving && setEditModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                disabled={isSaving}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">ID</label>
                <input 
                  type="text" 
                  value={editUser.id || ""} 
                  className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-gray-200 text-gray-500 font-mono text-xs cursor-not-allowed shadow-sm"
                  disabled
                  readOnly
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nama</label>
                <input 
                  type="text" 
                  value={editUser.name || ""} 
                  onChange={(e) => setEditUser({...editUser, name: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 font-medium focus:text-gray-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm"
                  disabled={isSaving}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email</label>
                <input 
                  type="email" 
                  value={editUser.email || ""} 
                  onChange={(e) => setEditUser({...editUser, email: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 font-medium focus:text-gray-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm"
                  disabled={isSaving}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Role</label>
                <select 
                  value={editUser.role || "user"} 
                  onChange={(e) => setEditUser({...editUser, role: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 font-medium focus:text-gray-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm"
                  disabled={isSaving}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 w-full mt-6 pt-4 border-t border-gray-100">
              <button 
                onClick={() => setEditModalOpen(false)}
                disabled={isSaving}
                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-all duration-300 active:scale-95 disabled:opacity-50"
              >
                Batal
              </button>
              <button 
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all duration-300 active:scale-95 shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : "Simpan Perubahan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD USER MODAL */}
      {addModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 transition-all duration-300">
          <div 
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            onClick={() => !isAdding && setAddModalOpen(false)}
          ></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg p-7 animate-in slide-in-from-bottom-5 duration-300 border border-gray-100 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl"><Plus size={18} /></div>
                Tambah User
              </h3>
              <button 
                onClick={() => !isAdding && setAddModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                disabled={isAdding}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nama</label>
                <input 
                  type="text" 
                  value={newUser.name || ""} 
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 font-medium focus:text-gray-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm"
                  disabled={isAdding}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email</label>
                <input 
                  type="email" 
                  value={newUser.email || ""} 
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 font-medium focus:text-gray-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm"
                  disabled={isAdding}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Password</label>
                <input 
                  type="password" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 font-medium focus:text-gray-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm"
                  disabled={isAdding}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Role</label>
                <select 
                  value={newUser.role || "user"} 
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 font-medium focus:text-gray-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm"
                  disabled={isAdding}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 w-full mt-6 pt-4 border-t border-gray-100">
              <button 
                onClick={() => setAddModalOpen(false)}
                disabled={isAdding}
                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-all duration-300 active:scale-95 disabled:opacity-50"
              >
                Batal
              </button>
              <button 
                onClick={handleAddUser}
                disabled={isAdding}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all duration-300 active:scale-95 shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isAdding ? <Loader2 className="animate-spin" size={18} /> : "Tambah User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
