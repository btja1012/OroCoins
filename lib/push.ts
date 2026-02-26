import webpush from 'web-push'
import { sql } from './db'

function initWebPush() {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@orospv.com'
  if (pub && priv) webpush.setVapidDetails(subject, pub, priv)
}

export async function sendPushToRolesAndSeller(sellerName: string, payload: {
  title: string
  body: string
}) {
  try {
    initWebPush()
    const db = sql()

    // Get user IDs: the specific seller + all admins/super_admins
    const users = await db`
      SELECT id FROM admin_users
      WHERE (seller_name = ${sellerName} OR role IN ('admin', 'super_admin'))
      AND is_active = true
    `

    for (const user of users) {
      const subs = await db`
        SELECT * FROM push_subscriptions WHERE user_id = ${user.id}
      `
      for (const sub of subs) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify(payload)
          )
        } catch (err: unknown) {
          // Remove expired subscriptions
          if (err && typeof err === 'object' && 'statusCode' in err && (err as { statusCode: number }).statusCode === 410) {
            await db`DELETE FROM push_subscriptions WHERE id = ${sub.id}`
          }
        }
      }
    }
  } catch {
    // Push failures are non-fatal — don't break the order creation
  }
}
