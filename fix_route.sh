#!/bin/bash
TARGET="/opt/alwaha/frontend/.next/server/app/api/purchase-requests/[uuid]/start-execution/route.js"
OLD="const token = authHeader?.startsWith(\"Bearer \") ? authHeader.substring(7) : undefined"
NEW="const token = (authHeader?.startsWith(\"Bearer \") ? authHeader.substring(7) : \"\") || req.cookies.get(\"alwaha-jwt\")?.value || \"\""
sed -i "s|$OLD|$NEW|g" "$TARGET"
