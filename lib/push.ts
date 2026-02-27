import webpush from 'web-push'
import { sql } from './db'

function initWebPush() {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@orospv.com'
  if (!pub || !priv) {
    console.error('[push] VAPID keys missing — NEXT_PUBLIC_VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY not set')
    return false
  }
  webpush.setVapidDetails(subject, pub, priv)
  return true
}

export async function sendPushToRolesAndSeller(sellerName: string, payload: {
  title: string
  body: string
}, clientName?: string | null) {
  try {
    const ready = initWebPush()
    if (!ready) return

    const db = sql()

    const users = await db`
      SELECT id, username FROM admin_users
      WHERE (
        seller_name = ${sellerName}
        OR role IN ('admin', 'super_admin')
        ${clientName ? db`OR seller_name = ${clientName}` : db``}
      )
      AND is_active = true
    `

    console.log(`[push] Sending to ${users.length} user(s) for seller=${sellerName}`)

    for (const user of users) {
      const subs = await db`
        SELECT * FROM push_subscriptions WHERE user_id = ${user.id}
      `
      console.log(`[push] User ${user.username} has ${subs.length} subscription(s)`)

      for (const sub of subs) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify(payload)
          )
          console.log(`[push] ✓ Sent to ${user.username}`)
        } catch (err: unknown) {
          const statusCode = err && typeof err === 'object' && 'statusCode' in err
            ? (err as { statusCode: number }).statusCode
            : null
          console.error(`[push] ✗ Failed for ${user.username}: status=${statusCode}`, err)
          if (statusCode === 410) {
            await db`DELETE FROM push_subscriptions WHERE id = ${sub.id}`
            console.log(`[push] Removed expired subscription for ${user.username}`)
          }
        }
      }
    }
  } catch (err) {
    console.error('[push] Unexpected error:', err)
  }
}

export async function sendPushToSeller(sellerName: string, payload: {
  title: string
  body: string
}) {
  try {
    const ready = initWebPush()
    if (!ready) return

    const db = sql()
    const users = await db`
      SELECT id, username FROM admin_users
      WHERE seller_name = ${sellerName} AND is_active = true
    `

    console.log(`[push] Sending to ${users.length} user(s) for seller=${sellerName}`)

    for (const user of users) {
      const subs = await db`
        SELECT * FROM push_subscriptions WHERE user_id = ${user.id}
      `
      console.log(`[push] User ${user.username} has ${subs.length} subscription(s)`)

      for (const sub of subs) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify(payload)
          )
          console.log(`[push] ✓ Sent to ${user.username}`)
        } catch (err: unknown) {
          const statusCode = err && typeof err === 'object' && 'statusCode' in err
            ? (err as { statusCode: number }).statusCode
            : null
          console.error(`[push] ✗ Failed for ${user.username}: status=${statusCode}`, err)
          if (statusCode === 410) {
            await db`DELETE FROM push_subscriptions WHERE id = ${sub.id}`
            console.log(`[push] Removed expired subscription for ${user.username}`)
          }
        }
      }
    }
  } catch (err) {
    console.error('[push] Unexpected error in sendPushToSeller:', err)
  }
}

export async function sendPushToAdmins(excludeUsername: string, payload: {
  title: string
  body: string
}) {
  try {
    const ready = initWebPush()
    if (!ready) return

    const db = sql()
    const users = await db`
      SELECT id, username FROM admin_users
      WHERE role IN ('admin', 'super_admin')
        AND username != ${excludeUsername}
        AND is_active = true
    `

    console.log(`[push] Sending to ${users.length} admin(s), excluding ${excludeUsername}`)

    for (const user of users) {
      const subs = await db`SELECT * FROM push_subscriptions WHERE user_id = ${user.id}`
      for (const sub of subs) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify(payload)
          )
          console.log(`[push] ✓ Sent to ${user.username}`)
        } catch (err: unknown) {
          const statusCode = err && typeof err === 'object' && 'statusCode' in err
            ? (err as { statusCode: number }).statusCode : null
          if (statusCode === 410) {
            await db`DELETE FROM push_subscriptions WHERE id = ${sub.id}`
          }
        }
      }
    }
  } catch (err) {
    console.error('[push] Unexpected error in sendPushToAdmins:', err)
  }
}

export async function sendPushToUser(userId: number, payload: {
  title: string
  body: string
}) {
  const ready = initWebPush()
  if (!ready) return { ok: false, error: 'VAPID keys missing' }

  const db = sql()
  const subs = await db`SELECT * FROM push_subscriptions WHERE user_id = ${userId}`

  if (subs.length === 0) return { ok: false, error: 'No subscriptions found' }

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      )
    } catch (err: unknown) {
      const statusCode = err && typeof err === 'object' && 'statusCode' in err
        ? (err as { statusCode: number }).statusCode
        : null
      if (statusCode === 410) {
        await db`DELETE FROM push_subscriptions WHERE id = ${sub.id}`
      }
      return { ok: false, error: `Push failed: ${statusCode}`, detail: err }
    }
  }
  return { ok: true }
}
