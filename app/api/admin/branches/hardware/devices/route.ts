import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/serialize";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { branchCode, name, type, role, connectionInfo, isDefault } = body;

    if (!branchCode || !name || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // If isDefault is true, unset other defaults of the same type for this branch
    if (isDefault) {
      await prisma.hardwareDevice.updateMany({
        where: { branchCode, type },
        data: { isDefault: false }
      });
    }

    const device = await prisma.hardwareDevice.create({
      data: {
        branchCode,
        name,
        type,
        role,
        connectionInfo: connectionInfo || {},
        isDefault: !!isDefault
      }
    });

    return NextResponse.json(serializeBigInt(device));
  } catch (error: any) {
    console.error("[ADMIN_DEVICE_POST_ERROR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await prisma.hardwareDevice.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[ADMIN_DEVICE_DELETE_ERROR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
