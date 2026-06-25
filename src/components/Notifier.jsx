import { useEffect, useRef, useCallback, useState } from 'react'
import db from '../data/db'

function getToday() {
  return new Date().toISOString().slice(0, 10)
}

function getCurrentMinutes() {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

function timeToMinutes(t) {
  if (!t) return -1
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function dayMatches(reminder, today) {
  if (!reminder.recurring || reminder.recurring === 'none') {
    return reminder.date === today
  }
  const todayDate = new Date(today + 'T00:00:00')
  const todayDow = todayDate.getDay()
  const reminderDate = new Date(reminder.date + 'T00:00:00')
  const dayOfMonth = todayDate.getDate()

  if (reminder.recurring === 'daily') return true
  if (reminder.recurring === 'weekdays') return todayDow >= 1 && todayDow <= 5
  if (reminder.recurring === 'weekends') return todayDow === 0 || todayDow === 6
  if (reminder.recurring === 'weekly') return todayDow === reminderDate.getDay()
  if (reminder.recurring === 'monthly') return dayOfMonth === reminderDate.getDate()
  return false
}

function getSentKey() {
  return 'aurora-notified-sent'
}

function loadSent() {
  try {
    return JSON.parse(localStorage.getItem(getSentKey()) || '{}')
  } catch { return {} }
}

function saveSent(sent) {
  try {
    localStorage.setItem(getSentKey(), JSON.stringify(sent))
  } catch {}
}

function markSent(reminderId, time) {
  const today = getToday()
  const sent = loadSent()
  if (!sent[today]) sent[today] = {}
  sent[today][reminderId + '-' + time] = true
  saveSent(sent)
}

function wasSent(reminderId, time) {
  const today = getToday()
  const sent = loadSent()
  return !!(sent[today] && sent[today][reminderId + '-' + time])
}

const NOTIF_WINDOW = 2

function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const now = ctx.currentTime
    const notes = [523.25, 659.25, 783.99]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + i * 0.12)
      gain.gain.setValueAtTime(0.15, now + i * 0.12)
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.3)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + i * 0.12)
      osc.stop(now + i * 0.12 + 0.3)
    })
  } catch {}
}

const ICON_DATA = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAABIAAAASABGyWs+AAABhklEQVR4nO2asWrDMBCGf0Qo3Yt4y9KpezZP6dQ36dQ36ZsUT50K3UqXDBkMhiK30lmyZUm2zv2gQQiS7vNPOp1kBgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIB/y4wxy7IsX4QQJ60113UJgqDTWn9orQ+tNVlr2bbtJsec+F+jlHrSWj+01h+lFBFCqLV+R5Naa6KU+qW1JiGEEEJ7jDHdGGP6f+0hpRS11sQYQ4wx5Dk2TdO01poYY4gxhggh5J7HtV6vF7XWRAghrbUQQpDWmjzH3batEEIQIYSstYQQQt7jum3bkhBC1loihJD7uO5+rLVkjCFjDDHGkGMMJ4SQ1pqMMUQIQYwx5D7HrbWktaZaayKEkL2P67ZtS60LK5QSUsoXnOPe94SU8uXnUsoX570/pJS01n2PFUIIISSp65qUUn2PlVKKiqKIOGNkjCHXdfUdK4QQIoSgrus4533fY4UQgqIo4jtPzvug5/H3B4UQgrqu4zzGmOdY59i2bYlzHnHOk1rrG2MM9/0DAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD4T3wD2JIKnCiFLm4AAAAASUVORK5CYII='

function sendBrowserNotif(title, body) {
  try {
    playChime()
    const n = new Notification(title, {
      body,
      icon: ICON_DATA,
      tag: 'aurora-reminder',
      requireInteraction: true,
      silent: true,
    })
    setTimeout(() => n.close(), 12000)
  } catch (err) {
    console.warn('[Notifier] Browser notification failed:', err)
  }
}

export default function Notifier({ onPendingChange, onNotify }) {
  const [granted, setGranted] = useState(false)
  const notifiedThisSession = useRef(new Set())

  useEffect(() => {
    if (!('Notification' in window)) return
    if (Notification.permission === 'granted') {
      setGranted(true)
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(p => {
        if (p === 'granted') setGranted(true)
      })
    }
  }, [])

  useEffect(() => {
    const check = async () => {
      try {
        const today = getToday()
        const nowMinutes = getCurrentMinutes()
        const all = await db.reminders.toArray()
        const todaysReminders = all.filter(r => dayMatches(r, today) && !r.completed)

        for (const r of todaysReminders) {
          if (!r.notificationTime) continue
          const notifMinutes = timeToMinutes(r.notificationTime)
          if (notifMinutes < 0) continue

          const timeDiff = nowMinutes - notifMinutes
          if (timeDiff < 0 || timeDiff > NOTIF_WINDOW) continue
          if (wasSent(r.id, r.notificationTime)) continue
          if (notifiedThisSession.current.has(r.id + '-' + r.notificationTime)) continue

          markSent(r.id, r.notificationTime)
          notifiedThisSession.current.add(r.id + '-' + r.notificationTime)

          if (granted) {
            sendBrowserNotif(r.title, 'Priority: ' + (r.priority || 'medium') + ' | Category: ' + (r.category || 'general'))
          }

          if (onNotify) {
            onNotify({
              title: r.title,
              priority: r.priority || 'medium',
              category: r.category || 'general',
              notificationTime: r.notificationTime,
            })
          }
        }

        if (onPendingChange) {
          const withNotif = todaysReminders.filter(r => r.notificationTime)
          const pendingCount = withNotif.filter(r => {
            return !notifiedThisSession.current.has(r.id + '-' + r.notificationTime) && !wasSent(r.id, r.notificationTime)
          }).length
          const withoutNotif = todaysReminders.filter(r => !r.notificationTime && !r.completed).length
          onPendingChange(pendingCount + withoutNotif)
        }
      } catch (err) {
        console.warn('[Notifier] Check:', err)
      }
    }

    check()
    const interval = setInterval(check, 15000)
    return () => clearInterval(interval)
  }, [granted, onPendingChange, onNotify])

  return null
}
