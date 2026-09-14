import { z } from 'zod'

export type JoinMode = 'member' | 'guest'

export const joinSchema = z.object({
  nickname: z.string().trim().min(1, '닉네임을 입력해주세요.').max(20, '닉네임은 20자 이내로 입력해주세요.'),
  password: z.string().max(100, '비밀번호가 너무 깁니다.').optional(),
})

export type JoinForm = z.infer<typeof joinSchema>
