import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import { removeParticipantToken } from '../../../domains/participant'
import { createCalendarSocket } from '../../../shared/socket/socketClient'

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
}

function isOnlineUser(value: unknown): value is OnlineCalendarUser {
  if (!value || typeof value !== 'object') return false
  const user = value as Partial<OnlineCalendarUser>
  return typeof user.sub === 'string' && typeof user.nickname === 'string'
    && (user.role === 'host' || user.role === 'guest')
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

  useEffect(() => {
    setIsClosed(false)
    setIsDeleted(false)
    setOnlineUsers(null)

    if (!slug || !participantToken || !participantUuid) {
      setConnectionState('disconnected')
      return
    }

    setConnectionState('connecting')
    const socket = createCalendarSocket(participantToken)

    const invalidateDetailQueries = () => {
      void queryClient.invalidateQueries({ queryKey: ['calendar', slug] })
      void queryClient.invalidateQueries({ queryKey: ['calendar', slug, 'participants'] })
      void queryClient.invalidateQueries({ queryKey: ['calendar', slug, 'vote-status'] })
      void queryClient.invalidateQueries({ queryKey: ['calendar', slug, 'votes', participantUuid] })
    }

    const handleConnect = () => {
      setConnectionState('connected')
      socket.emit('joinCalendarRoom')
      invalidateDetailQueries()
    }
    const handleDisconnect = () => {
      setConnectionState('disconnected')
      setOnlineUsers(null)
    }
    const handleConnectError = () => {
      setConnectionState('disconnected')
      setOnlineUsers(null)
    }
    const handleVoteUpdated = () => {
      void queryClient.invalidateQueries({ queryKey: ['calendar', slug, 'vote-status'] })
      void queryClient.invalidateQueries({ queryKey: ['calendar', slug, 'participants'] })
      void queryClient.invalidateQueries({ queryKey: ['calendar', slug, 'votes', participantUuid] })
    }
    const handleCalendarUpdated = () => {
      invalidateDetailQueries()
      void queryClient.invalidateQueries({ queryKey: ['calendar', 'my'] })
    }
    const handleCalendarClosed = () => {
      setIsClosed(true)
      invalidateDetailQueries()
      void queryClient.invalidateQueries({ queryKey: ['calendar', 'my'] })
    }
    const handleCalendarDeleted = () => {
      setIsDeleted(true)
      removeParticipantToken(slug)
      queryClient.removeQueries({ queryKey: ['calendar', slug] })
      void queryClient.invalidateQueries({ queryKey: ['calendar', 'my'] })
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
      void queryClient.invalidateQueries({ queryKey: ['calendar', slug, 'participants'] })
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

  return { connectionState, onlineUsers, isClosed, isDeleted }
}
