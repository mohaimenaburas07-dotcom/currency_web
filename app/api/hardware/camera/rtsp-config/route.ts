import { NextRequest, NextResponse } from 'next/server';
import { getBranchHardwareConfig } from '@/lib/hardware/dbConfig';
import { hardwareRegistry } from '@/lib/hardware/hardwareRegistry';

const MEDIAMTX_API_BASE = 'http://localhost:9997/v3/config/paths';
const MEDIAMTX_WHEP_BASE = 'http://localhost:8889';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get('branchId') || 'DEFAULT_BRANCH';
  // Default to stream 2 (Substream) for better WebRTC compatibility (usually H.264)
  const streamId = parseInt(searchParams.get('streamId') || '2', 10);

  try {
    const config = await getBranchHardwareConfig(branchId);
    if (!config || (!config.camera_ip && !config.cameraIp)) {
      return NextResponse.json({ success: false, error: 'Camera IP not configured' }, { status: 404 });
    }

    // @ts-ignore
    const camera = hardwareRegistry.getCamera(branchId, config) as any;

    if (!camera.getLiveStreamConfig) {
      return NextResponse.json({ success: false, error: 'Live stream not supported on this adapter' }, { status: 400 });
    }

    const streamConfig = await camera.getLiveStreamConfig(streamId);

    if (!streamConfig.success || !streamConfig.data?.rtspUrl) {
      return NextResponse.json({ success: false, error: 'Failed to resolve RTSP URL from adapter' }, { status: 502 });
    }

    // Stream name: alphanumeric+underscore only
    const streamName = `branch_${branchId.replace(/[^a-zA-Z0-9]/g, '_')}_cam_1_stream_${streamId}`;
    const rtspUrl: string = streamConfig.data.rtspUrl;
    const redacted = rtspUrl.replace(/:([^@]+)@/, ':***@');

    console.log(`[RTSP Config] ── Stream registration starting ──`);
    console.log(`[RTSP Config] branchId    : ${branchId}`);
    console.log(`[RTSP Config] streamName  : ${streamName}`);
    console.log(`[RTSP Config] RTSP source : ${redacted}`);

    const payload = {
      source: rtspUrl,
      sourceOnDemand: true,
      sourceOnDemandStartTimeout: '30s', // Increased for slow RTSP initialization
      sourceOnDemandCloseAfter: '15s',
    };

    // ── Strategy: PATCH (upsert) first, then ADD if path doesn't exist yet ─────
    // PATCH updates an existing path config; ADD creates a new one.
    // If ADD returns "path already exists" we treat it as success (idempotent).

    let registered = false;

    // 1. Try PATCH (update existing path)
    try {
      const patchUrl = `${MEDIAMTX_API_BASE}/patch/${streamName}`;
      console.log(`[RTSP Config] PATCH ${patchUrl}`);
      const patchRes = await fetch(patchUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const patchBody = await patchRes.text();
      console.log(`[RTSP Config] PATCH response: ${patchRes.status} — ${patchBody}`);
      if (patchRes.ok) {
        console.log(`[RTSP Config] ✓ Path updated via PATCH.`);
        registered = true;
      }
    } catch (e: any) {
      console.log(`[RTSP Config] PATCH failed (network): ${e.message}`);
    }

    // 2. If PATCH didn't work, try POST /add
    if (!registered) {
      const addUrl = `${MEDIAMTX_API_BASE}/add/${streamName}`;
      console.log(`[RTSP Config] POST ${addUrl}`);

      let addRes: Response;
      let addBody: string;
      try {
        addRes = await fetch(addUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        addBody = await addRes.text();
      } catch (networkErr: any) {
        console.error(`[RTSP Config] Network error reaching MediaMTX: ${networkErr.message}`);
        return NextResponse.json({
          success: false,
          error: `Cannot reach MediaMTX at localhost:9997 — ${networkErr.message}`,
          hint: 'Confirm mediamtx.exe is running and api: true is set in mediamtx.yml',
        }, { status: 503 });
      }

      console.log(`[RTSP Config] ADD response: ${addRes.status} — ${addBody}`);

      // "path already exists" is a valid success — the path is already registered and usable
      const alreadyExists = addBody.includes('path already exists');

      if (addRes.ok || alreadyExists) {
        console.log(`[RTSP Config] ✓ Path ${alreadyExists ? 'already exists (reusing)' : 'created via ADD'}.`);
        registered = true;
      } else {
        // Genuine error from MediaMTX
        return NextResponse.json({
          success: false,
          error: `MediaMTX rejected path registration (HTTP ${addRes.status})`,
          detail: addBody,
          streamName,
          rtspSourceRedacted: redacted,
        }, { status: 502 });
      }
    }

    // ── Return safe WHEP URL to frontend ─────────────────────────────────────
    const whepUrl = `${MEDIAMTX_WHEP_BASE}/${streamName}/whep`;
    console.log(`[RTSP Config] ✓ WHEP URL: ${whepUrl}`);

    return NextResponse.json({
      success: true,
      data: { webrtcUrl: whepUrl, streamName },
    });

  } catch (error: any) {
    console.error('[RTSP Config] Unexpected error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
