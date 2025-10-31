/**
 * API Route: Realtime Biometrics Webhook
 * Endpoint: /api/attendance/realtime
 * Method: POST
 * 
 * This endpoint receives attendance data from OnlineRealSoft Third-Party API Integration
 */

import { handleRealtimeWebhook } from '../../../services/realtimeIntegration';

export default async function handler(req: any, res: any) {
  return await handleRealtimeWebhook(req, res);
}