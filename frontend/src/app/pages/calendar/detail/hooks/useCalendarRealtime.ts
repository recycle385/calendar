import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import { removeParticipantToken } from '../../../../../domains/participant'
import { createCalendarSocket } from '../../../../../shared/socket/socketClient'
import {
  clearDeletedCalendarData,
  refreshCalendarData,
  refreshParticipantData,
  refreshVoteData,
} from '../../../../cache/calendarCache'

export interface OnlineCalendarUser {
  sub: string
  nickname: string
  role: 'host' | 'guest'
}

export type RealtimeConnectionState = 'connecting' | 'connected' | 'disconnected'

interface CalendarRealtimeState {
  connectionState: RealtimeConnectionState
  onlineUsers: OnlineCalendarUser[] | null
  isClosed: boolean
  isDeleted: boolean
  voteNotification: {
    id: number
    nickname: string
  } | null
}

interface VoteUpdatedEvent {
  participantNickname: string
}

function isOnlineUser(value: unknown): value is OnlineCalendarUser {
  if (!value || typeof value !== 'object') return false
  const user = value as Partial<OnlineCalendarUser>
  return typeof user.sub === 'string' && typeof user.nickname === 'string'
    && (user.role === 'host' || user.role === 'guest')
}

export function parseVoteUpdatedEvent(value: unknown): VoteUpdatedEvent | null {
  if (!value || typeof value !== 'object') return null
  const participantNickname = (value as { participantNickname?: unknown }).participantNickname
  return typeof participantNickname === 'string' && participantNickname.trim()
    ? { participantNickname }
    : null
}

export function useCalendarRealtime(
  slug: string,
  participantToken?: string,
  participantUuid?: string,
): CalendarRealtimeState {
  const queryClient = useQueryClient()
  const [connectionState, setConnectionState] = useState<RealtimeConnectionState>('connecting')
  const [onlineUsers, setOnlineUsers] = useState<OnlineCalendarUser[] | null>(null)
  const [isClosed, setIsClosed] = useState(false)
  const [isDeleted, setIsDeleted] = useState(false)
  const [voteNotification, setVoteNotification] = useState<CalendarRealtimeState['voteNotification']>(null)

  useEffect(() => {
    setIsClosed(false)
    setIsDeleted(false)
    setOnlineUsers(null)
    setVoteNotification(null)

    if (!slug || !participantToken || !participantUuid) {
      setConnectionState('disconnected')
      return
    }

    setConnectionState('connecting')
    const socket = createCalendarSocket(participantToken)
    let notificationSequence = 0
    let notificationTimer: ReturnType<typeof setTimeout> | undefined

    const handleConnect = () => {
      setConnectionState('connected')
      socket.emit('joinCalendarRoom')
      void refreshCalendarData(queryClient, slug, participantUuid)
    }
    const handleDisconnect = () => {
      setConnectionState('disconnected')
      setOnlineUsers(null)
    }
    const handleConnectError = () => {
      setConnectionState('disconnected')
      setOnlineUsers(null)
    }
    const handleVoteUpdated = (payload: unknown) => {
      const event = parseVoteUpdatedEvent(payload)
      if (event) {
        notificationSequence += 1
        if (notificationTimer) clearTimeout(notificationTimer)
        setVoteNotification({ id: notificationSequence, nickname: event.participantNickname })
        notificationTimer = setTimeout(() => setVoteNotification(null), 4400)
      }
      void refreshVoteData(queryClient, slug, participantUuid)
    }
    const handleCalendarUpdated = () => {
      void refreshCalendarData(queryClient, slug, participantUuid)
    }
    const handleCalendarClosed = () => {
      setIsClosed(true)
      void refreshCalendarData(queryClient, slug, participantUuid)
    }
    const handleCalendarDeleted = () => {
      setIsDeleted(true)
      removeParticipantToken(slug)
      void clearDeletedCalendarData(queryClient, slug)
      socket.disconnect()
    }
    const handleOnlineUsers = (users: unknown) => {
      if (!Array.isArray(users)) return
      setOnlineUsers(users.filter(isOnlineUser))
    }
    const handleUserOnline = (user: unknown) => {
      if (!isOnlineUser(user)) return
      setOnlineUsers((current) => {
        const others = (current ?? []).filter((item) => item.sub !== user.sub)
        return [...others, user]
      })
      void refreshParticipantData(queryClient, slug, participantUuid)
    }
    const handleUserOffline = (user: unknown) => {
      if (!user || typeof user !== 'object' || typeof (user as { sub?: unknown }).sub !== 'string') return
      const userUuid = (user as { sub: string }).sub
      setOnlineUsers((current) => current?.filter((item) => item.sub !== userUuid) ?? null)
    }

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('connect_error', handleConnectError)
    socket.on('voteUpdated', handleVoteUpdated)
    socket.on('calendarUpdated', handleCalendarUpdated)
    socket.on('calendarClosed', handleCalendarClosed)
    socket.on('calendarDeleted', handleCalendarDeleted)
    socket.on('onlineUsers', handleOnlineUsers)
    socket.on('userOnline', handleUserOnline)
    socket.on('userOffline', handleUserOffline)
    socket.connect()

    return () => {
      if (notificationTimer) clearTimeout(notificationTimer)
      if (socket.connected) socket.emit('leaveCalendarRoom')
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('connect_error', handleConnectError)
      socket.off('voteUpdated', handleVoteUpdated)
      socket.off('calendarUpdated', handleCalendarUpdated)
      socket.off('calendarClosed', handleCalendarClosed)
      socket.off('calendarDeleted', handleCalendarDeleted)
      socket.off('onlineUsers', handleOnlineUsers)
      socket.off('userOnline', handleUserOnline)
      socket.off('userOffline', handleUserOffline)
      socket.disconnect()
    }
  }, [participantToken, participantUuid, queryClient, slug])

  return { connectionState, onlineUsers, isClosed, isDeleted, voteNotification }
}
