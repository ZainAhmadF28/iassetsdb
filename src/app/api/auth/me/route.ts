import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Simple in-memory session store
const sessions = new Map<string, { userId: string; expiresAt: number }>();

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("sessionToken")?.value;

    if (!sessionToken) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const session = sessions.get(sessionToken);

    if (!session || session.expiresAt < Date.now()) {
      sessions.delete(sessionToken);
      return NextResponse.json({ message: "Session expired" }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!user) {
      sessions.delete(sessionToken);
      return NextResponse.json({ message: "User not found" }, { status: 401 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}
