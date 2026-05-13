import type { Database } from '@/types/database'

type PlatformEnum = Database['public']['Enums']['platform']

export const SOCIAL_PLATFORMS: {
  id: PlatformEnum
  name: string
  charLimit: number
  formats: string[]
}[] = [
  { id: 'instagram', name: 'Instagram',  charLimit: 2200,  formats: ['Пост', 'Stories', 'Reels', 'Карусель'] },
  { id: 'facebook',  name: 'Facebook',   charLimit: 63206, formats: ['Пост', 'Stories', 'Reels'] },
  { id: 'linkedin',  name: 'LinkedIn',   charLimit: 3000,  formats: ['Статья', 'Пост', 'Документ'] },
  { id: 'twitter_x', name: 'Twitter/X',  charLimit: 280,   formats: ['Тред', 'Твит', 'Цитата'] },
  { id: 'telegram',  name: 'Telegram',   charLimit: 4096,  formats: ['Сообщение', 'Пост канала'] },
  { id: 'tiktok',    name: 'TikTok',     charLimit: 2200,  formats: ['Видео', 'Stories'] },
]

export const CONTENT_STATUS_LABELS: Record<string, string> = {
  draft: 'Черновик',
  in_review: 'На проверке',
  approved: 'Утверждено',
  scheduled: 'Запланировано',
  published: 'Опубликовано',
  publish_failed: 'Ошибка',
}

export const PROJECT_COLORS = [
  '#4f7cff', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f43f5e', '#84cc16',
]

export function getProjectColor(id: string): string {
  const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return PROJECT_COLORS[hash % PROJECT_COLORS.length]
}

export const OPENAI_TEXT_MODEL = 'gpt-5.5'
