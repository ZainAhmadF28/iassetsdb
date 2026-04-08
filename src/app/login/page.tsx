"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Login gagal. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
      {/* Logo */}
      <div className="-mb-8">
        <img
          src="/icon.png"
          alt="Logo SMBR"
          className="h-64 w-64 object-contain"
        />
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md relative z-10 pt-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Login Admin
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Masuk untuk mengakses dashboard
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          {/* Email Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Email
            </label>
            <div
              className={`relative flex items-center px-4 py-3 rounded-xl border-2 transition-colors ${
                focusedField === "email"
                  ? "border-green-700 bg-green-50"
                  : error
                  ? "border-red-300 bg-red-50"
                  : "border-gray-200 bg-gray-50 hover:border-gray-300"
              }`}
            >
              <Mail className="w-5 h-5 text-green-700 mr-3 flex-shrink-0" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                placeholder="admin@example.com"
                className="w-full bg-transparent text-gray-900 placeholder-gray-400 outline-none text-sm"
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Password
            </label>
            <div
              className={`relative flex items-center px-4 py-3 rounded-xl border-2 transition-colors ${
                focusedField === "password"
                  ? "border-green-700 bg-green-50"
                  : error
                  ? "border-red-300 bg-red-50"
                  : "border-gray-200 bg-gray-50 hover:border-gray-300"
              }`}
            >
              <Lock className="w-5 h-5 text-green-700 mr-3 flex-shrink-0" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                placeholder="••••••••"
                className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 outline-none text-sm"
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-500 hover:text-gray-700 ml-2 flex-shrink-0"
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-green-700 hover:bg-green-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 mt-8"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Memproses...
              </>
            ) : (
              "Login Admin"
            )}
          </button>
        </form>

        {/* Footer Info */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            Hanya admin yang dapat login ke sistem ini.
          </p>
        </div>
      </div>
    </div>
  );
}