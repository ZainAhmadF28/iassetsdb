import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const where: any = {};

    // Filter berdasarkan search
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: skip,
    });

    const total = await prisma.user.count({ where });

    return Response.json({
      data: users,
      total,
      hasMore: skip + users.length < total,
    });
  } catch (error) {
    console.error("ERROR USERS:", error);
    return Response.json(
      { error: "DB ERROR" },
      { status: 500 }
    );
  }
}

import * as bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const hashedPassword = await bcrypt.hash(body.password, 10);
    
    const newUser = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: hashedPassword,
        role: body.role || "user",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    return Response.json({ data: newUser }, { status: 201 });
  } catch (error) {
    console.error("ERROR CREATE USER:", error);
    return Response.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
