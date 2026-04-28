// app/api/customers/route.ts
// Updated to use ReceivedCustomerRecord from the new schema.
// This provides the data for the Clients/Customers page.

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") || ""

    const customers = await prisma.receivedCustomerRecord.findMany({
      where: search ? {
        OR: [
          { customerName: { contains: search, mode: "insensitive" } },
          { nationalId: { contains: search } },
          { passportNumber: { contains: search } },
        ]
      } : {},
      orderBy: { receivedAt: "desc" },
    })

    // Map to the format expected by the frontend if necessary
    // The previous code returned { id, name, nationalId, phone, email, createdAt }
    const mapped = customers.map(c => ({
      id: c.id,
      name: c.customerName,
      nationalId: c.nationalId,
      phone: c.phone,
      email: "", // Not stored in new schema, but returning empty for compatibility
      createdAt: c.receivedAt,
    }))

    return NextResponse.json(mapped)
  } catch (error) {
    console.error("Error fetching customers:", error)
    return NextResponse.json({ message: "Error fetching customers" }, { status: 500 })
  }
}

// POST is probably not needed anymore as customers are created via confirmation,
// but I'll leave a stub or remove it.
export async function POST() {
  return NextResponse.json({ message: "Creation of customers is now handled via the execution confirmation workflow." }, { status: 405 })
}
