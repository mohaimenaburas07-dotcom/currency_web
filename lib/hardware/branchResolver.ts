import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { HARDWARE_CONFIG } from './config';

/**
 * Resolves the branch code from the request.
 * Priority:
 * 1. Explicit branchId in query searchParams
 * 2. branch_code associated with the logged-in user (from alwaha-jwt)
 * 3. Fallback to DEFAULT_BRANCH_ID from config
 */
export async function resolveBranchId(req: NextRequest): Promise<string> {
  const { searchParams } = new URL(req.url);
  const queryBranch = searchParams.get('branchId');
  
  // 1. Check if branchId is provided in query and it's not the placeholder
  if (queryBranch && queryBranch !== 'DEFAULT_BRANCH' && queryBranch !== HARDWARE_CONFIG.DEFAULT_BRANCH_ID) {
    return queryBranch;
  }

  // 2. Try to resolve from authenticated user
  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      // Decode JWT payload (standard Base64)
      const payloadBase64 = token.split('.')[1];
      if (payloadBase64) {
        const payloadJson = Buffer.from(payloadBase64, 'base64').toString();
        const decoded = JSON.parse(payloadJson);
        const username = decoded?.sub;
        
        if (username) {
          console.log(`[BranchResolver] Resolving branch for user: ${username}`);
          const user = await prisma.users.findUnique({
            where: { username },
            select: { branch_code: true }
          });
          
          if (user?.branch_code) {
            console.log(`[BranchResolver] Resolved branch_code: ${user.branch_code}`);
            return user.branch_code;
          } else {
            console.warn(`[BranchResolver] User ${username} found but has no branch_code`);
          }
        }
      }
    } catch (e) {
      console.error("[BranchResolver] Failed to resolve branch from JWT", e);
    }
  }

  // 3. Fallback
  return HARDWARE_CONFIG.DEFAULT_BRANCH_ID;
}
