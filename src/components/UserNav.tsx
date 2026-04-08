"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";

export default function UserNav() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded-lg">
      <div className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center text-white text-sm font-semibold">
        {user.name.charAt(0).toUpperCase()}
      </div>
      <div className="text-left hidden sm:block">
        <p className="text-sm font-semibold text-gray-800">{user.name}</p>
        <p className="text-xs text-gray-500 capitalize">{user.role}</p>
      </div>
    </div>
  );
}
