// app/api/received-customers/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") ?? "1")
    const limit = parseInt(searchParams.get("limit") ?? "20")
    const search = searchParams.get("search") ?? ""
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")

    const skip = (page - 1) * limit

    const where: any = {}

    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: "insensitive" } },
        { nationalId: { contains: search } },
        { passportNumber: { contains: search } },
        { receiptNumber: { contains: search } },
      ]
    }

    if (dateFrom || dateTo) {
      where.receivedAt = {}
      if (dateFrom) where.receivedAt.gte = new Date(dateFrom)
      if (dateTo) where.receivedAt.lte = new Date(dateTo)
    }

    const [total, data] = await Promise.all([
      prisma.receivedCustomerRecord.count({ where }),
      prisma.receivedCustomerRecord.findMany({
        where,
        orderBy: { receivedAt: "desc" },
        skip,
        take: limit,
      }),
    ])

    return NextResponse.json({
      data,
      total,
      currentPage: page,
      lastPage: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error("[received-customers] GET error:", error)
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 })
  }
}
