import { prisma } from "@/lib/prisma";

export async function getBranchHardwareConfig(branchCode: string) {
  try {
    const config = await prisma.branchHardwareConfig.findUnique({
      where: { branchCode },
      include: { devices: true }
    });
    return config;
  } catch (error) {
    console.error(`Failed to fetch hardware config for branch ${branchCode}:`, error);
    return null;
  }
}
