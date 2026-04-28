import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    // Extract basic data
    const customerId = formData.get("customerId") as string
    const amountRequested = parseFloat(formData.get("amountRequested") as string)
    const currencyCode = (formData.get("currencyCode") as string) || "USD"
    const notes = formData.get("notes") as string
    
    if (!customerId) {
      return NextResponse.json({ message: "Customer ID is required" }, { status: 400 })
    }

    // 1. Create the Reservation record first
    const reservation = await prisma.reservation.create({
      data: {
        customerId,
        amountRequested,
        currencyCode,
        notes,
        status: "pending"
      }
    })

    // 2. Process Files
    const files = formData.getAll("files") as File[]
    const mediaRecords = []

    for (const file of files) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Determine file path
      const isVideo = file.type.startsWith("video")
      const subDir = isVideo ? "videos" : "photos"
      const fileExtension = file.name.split(".").pop() || (isVideo ? "webm" : "jpg")
      const fileName = `${uuidv4()}.${fileExtension}`
      
      const uploadDir = join(process.cwd(), "public", "uploads", subDir)
      const filePath = join(uploadDir, fileName)
      const publicUrl = `/uploads/${subDir}/${fileName}`

      // Ensure directory exists (should already be there from my mkdir command, but just in case)
      await mkdir(uploadDir, { recursive: true })
      
      // Save to disk
      await writeFile(filePath, buffer)

      // Save metadata to DB
      const media = await prisma.media.create({
        data: {
          reservationId: reservation.id,
          type: isVideo ? "VIDEO" : "PHOTO",
          url: publicUrl,
        }
      })
      
      mediaRecords.push(media)
    }

    return NextResponse.json({
      reservation,
      media: mediaRecords
    }, { status: 201 })

  } catch (error) {
    console.error("Error processing upload:", error)
    return NextResponse.json({ message: "Error processing reservation and media" }, { status: 500 })
  }
}
