import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import * as bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Simple in-memory session store (use Redis/database in production)
const sessions = new Map<string, { userId: string; expiresAt: number }>();

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email dan password diperlukan" },
        { status: 400 }
      );
    }

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Email atau password salah" },
        { status: 401 }
      );
    }

    // Check role - only admin can login
    if (user.role !== "admin") {
      return NextResponse.json(
        { message: "Hanya admin yang dapat login" },
        { status: 403 }
      );
    }

    // Verify password dengan bcrypt
    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      return NextResponse.json(
        { message: "Email atau password salah" },
        { status: 401 }
      );
    }

    // Create session token
    const sessionToken = crypto.randomBytes(32).toString("hex");
    sessions.set(sessionToken, {
      userId: user.id,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });

    // Create response with user data
    const response = NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    // Set session cookie
    response.cookies.set("sessionToken", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
