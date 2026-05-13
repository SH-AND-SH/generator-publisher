'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import {
  Loader2,
  ChevronLeft,
  RefreshCw,
  Send,
  CheckCircle2,
  ImageIcon,
  Trash2,
  Save,
} from 'lucide-react'
import {
  getDraftVariant,
  generateImage,
  regenerateImageWithInstruction,
  approveContent,
  saveDraftVariant,
  deleteDraftContent,
} from '@/lib/actions/content'

export default function ContentDetailPage() {
  const params = useParams<{ id: string; contentId: string }>()
  const projectId = params.id
  const draftVariantId = params.contentId
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [generatingImage, setGeneratingImage] = useState(false)
  const [text, setText] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [originalPrompt, setOriginalPrompt] = useState('')

  const [regenInstruction, setRegenInstruction] = useState('')
  const [regenerating, setRegenerating] = useState(false)

  const [approving, setApproving] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const loadAndGenerate = useCallback(async () => {
    setLoading(true)
    const variant = await getDraftVariant(draftVariantId)
    if (!variant) {
      router.replace(`/project/${projectId}/content/new`)
      return
    }
    setText(variant.text_body)
    setOriginalPrompt(variant.image_prompt)

    const hints = variant.preview_hints as { generatedImageUrl?: string } | null
    if (hints?.generatedImageUrl) {
      setImageUrl(hints.generatedImageUrl)
      setLoading(false)
    } else if (variant.image_prompt) {
      setLoading(false)
      setGeneratingImage(true)
      const result = await generateImage({ draftVariantId, projectId })
      if (result.error) toast.error(result.error)
      else setImageUrl(result.imageUrl ?? null)
      setGeneratingImage(false)
    } else {
      setLoading(false)
    }
  }, [draftVariantId, projectId, router])

  useEffect(() => {
    loadAndGenerate()
  }, [loadAndGenerate])

  async function handleRegenerate() {
    if (!regenInstruction.trim()) return
    setRegenerating(true)
    const result = await regenerateImageWithInstruction({
      draftVariantId,
      originalPrompt,
      instruction: regenInstruction,
      projectId,
    })
    if (result.error) toast.error(result.error)
    else { setImageUrl(result.imageUrl ?? null); setRegenInstruction(''); toast.success('Изображение обновлено') }
    setRegenerating(false)
  }

  async function handleApprove() {
    if (!imageUrl || !text.trim()) return
    setApproving(true)
    const result = await approveContent({ draftVariantId, projectId, finalText: text })
    if (result.error) { toast.error(result.error); setApproving(false); return }
    router.push(`/project/${projectId}/content/${result.contentItemId}/planner`)
  }

  async function handleSave() {
    setSaving(true)
    const result = await saveDraftVariant({ draftVariantId, textBody: text })
    if (result.error) toast.error(result.error)
    else { toast.success('Сохранено'); router.push(`/project/${projectId}`) }
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirm('Удалить? Это действие нельзя отменить.')) return
    setDeleting(true)
    await deleteDraftContent({ draftVariantId, projectId })
    router.push(`/project/${projectId}`)
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const canApprove = imageUrl !== null && text.trim().length > 0

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/project/${projectId}`} className="text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-semibold">Генерация креатива</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleDelete} disabled={deleting} className="text-destructive hover:text-destructive">
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
            Сохранить
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Image panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                Изображение
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-square rounded-md overflow-hidden bg-muted flex items-center justify-center relative">
                {generatingImage && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted/80 z-10">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Генерируем изображение…</p>
                  </div>
                )}
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt="Generated"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : !generatingImage ? (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <ImageIcon className="h-10 w-10" />
                    <p className="text-xs">Изображение не сгенерировано</p>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {/* Image instruction */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">AI редактор изображения</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  value={regenInstruction}
                  onChange={(e) => setRegenInstruction(e.target.value)}
                  placeholder="Сделай фон светлее / добавь человека / другой стиль…"
                  onKeyDown={(e) => e.key === 'Enter' && !regenerating && handleRegenerate()}
                  disabled={regenerating}
                />
                <Button
                  size="sm"
                  onClick={handleRegenerate}
                  disabled={regenerating || !regenInstruction.trim()}
                >
                  {regenerating
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <RefreshCw className="h-4 w-4" />
                  }
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Text panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Текст публикации</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={14}
                className="resize-none font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1.5 text-right">{text.length} символов</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Approve button */}
      <div className="flex items-center justify-between pt-2 border-t">
        <div className="text-xs text-muted-foreground">
          {!imageUrl && <span className="text-amber-500">⚠ Нужно изображение</span>}
          {imageUrl && !text.trim() && <span className="text-amber-500">⚠ Текст пустой</span>}
          {canApprove && (
            <span className="flex items-center gap-1 text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" /> Готово к утверждению
            </span>
          )}
        </div>
        <Button
          onClick={handleApprove}
          disabled={!canApprove || approving}
          size="lg"
          className="min-w-40"
        >
          {approving
            ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Утверждаем…</>
            : 'Утвердить контент'
          }
        </Button>
      </div>
    </div>
  )
}
