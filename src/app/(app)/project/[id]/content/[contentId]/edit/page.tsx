'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Loader2,
  ChevronLeft,
  RefreshCw,
  Send,
  CheckCircle2,
  Sparkles,
  Trash2,
  Save,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  getDraftVariant,
  regenerateDraftText,
  editDraftWithInstruction,
  generateVisualIdeas,
  saveDraftVariant,
  deleteDraftContent,
} from '@/lib/actions/content'
import type { VisualIdea } from '@/lib/actions/content'

export default function DraftEditorPage() {
  const params = useParams<{ id: string; contentId: string }>()
  const projectId = params.id
  const draftVariantId = params.contentId
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [postIdea, setPostIdea] = useState('')
  const [platform, setPlatform] = useState('')

  const [regenerating, setRegenerating] = useState(false)
  const [editInstruction, setEditInstruction] = useState('')
  const [editing, setEditing] = useState(false)

  const [visualIdeas, setVisualIdeas] = useState<VisualIdea[]>([])
  const [loadingVisualIdeas, setLoadingVisualIdeas] = useState(false)
  const [selectedVisualIdea, setSelectedVisualIdea] = useState<VisualIdea | null>(null)

  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [proceeding, setProceeding] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const variant = await getDraftVariant(draftVariantId)
      if (!variant) {
        router.replace(`/project/${projectId}/content/new`)
        return
      }
      setText(variant.text_body)
      setPostIdea(variant.post_idea)
      const ds = variant.draft_sets as { target_platform: string }
      setPlatform(ds?.target_platform ?? '')
      setLoading(false)
    }
    load()
  }, [draftVariantId, projectId, router])

  async function handleRegenerate() {
    setRegenerating(true)
    const result = await regenerateDraftText({ draftVariantId, projectId })
    if (result.error) toast.error(result.error)
    else { setText(result.text ?? ''); toast.success('Текст перегенерирован') }
    setRegenerating(false)
  }

  async function handleEdit() {
    if (!editInstruction.trim()) return
    setEditing(true)
    const result = await editDraftWithInstruction({
      draftVariantId,
      currentText: text,
      instruction: editInstruction,
    })
    if (result.error) toast.error(result.error)
    else { setText(result.text ?? ''); setEditInstruction(''); toast.success('Текст обновлён') }
    setEditing(false)
  }

  async function handleGenerateVisualIdeas() {
    setLoadingVisualIdeas(true)
    setVisualIdeas([])
    setSelectedVisualIdea(null)
    const result = await generateVisualIdeas({ draftVariantId, draftText: text, projectId })
    if (result.error) toast.error(result.error)
    else setVisualIdeas(result.ideas ?? [])
    setLoadingVisualIdeas(false)
  }

  async function handleProceed() {
    if (!selectedVisualIdea) return
    setProceeding(true)
    const result = await saveDraftVariant({
      draftVariantId,
      textBody: text,
      visualIdea: selectedVisualIdea.title,
      imagePrompt: selectedVisualIdea.dallePrompt,
      status: 'selected',
    })
    if (result.error) { toast.error(result.error); setProceeding(false); return }
    router.push(`/project/${projectId}/content/${draftVariantId}`)
  }

  async function handleSave() {
    setSaving(true)
    const result = await saveDraftVariant({ draftVariantId, textBody: text })
    if (result.error) toast.error(result.error)
    else { toast.success('Черновик сохранён'); router.push(`/project/${projectId}`) }
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirm('Удалить черновик? Это действие нельзя отменить.')) return
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

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/project/${projectId}`} className="text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold">Редактор черновика</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-sm text-muted-foreground">{postIdea}</p>
              {platform && <Badge variant="secondary" className="text-xs">{platform}</Badge>}
            </div>
          </div>
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

      {/* Text editor */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">Текст публикации</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRegenerate}
            disabled={regenerating}
            className="h-7 text-xs"
          >
            {regenerating
              ? <><Loader2 className="mr-1.5 h-3 w-3 animate-spin" />Перегенерируем…</>
              : <><RefreshCw className="mr-1.5 h-3 w-3" />Перегенерировать</>
            }
          </Button>
        </CardHeader>
        <CardContent>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={12}
            className="resize-none font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground mt-1.5 text-right">{text.length} символов</p>
        </CardContent>
      </Card>

      {/* AI Editor */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">AI Редактор</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={editInstruction}
              onChange={(e) => setEditInstruction(e.target.value)}
              placeholder="Сделай текст короче / добавь хэштеги / измени тон на более формальный…"
              onKeyDown={(e) => e.key === 'Enter' && !editing && handleEdit()}
              disabled={editing}
            />
            <Button size="sm" onClick={handleEdit} disabled={editing || !editInstruction.trim()}>
              {editing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Visual ideas */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">Визуальные идеи</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateVisualIdeas}
            disabled={loadingVisualIdeas}
            className="h-7 text-xs"
          >
            {loadingVisualIdeas
              ? <><Loader2 className="mr-1.5 h-3 w-3 animate-spin" />Генерируем…</>
              : <><Sparkles className="mr-1.5 h-3 w-3" />Сгенерировать идеи</>
            }
          </Button>
        </CardHeader>
        <CardContent>
          {visualIdeas.length === 0 && !loadingVisualIdeas && (
            <p className="text-xs text-muted-foreground py-2">
              Нажмите "Сгенерировать идеи" чтобы получить 3 визуальные концепции
            </p>
          )}
          {visualIdeas.length > 0 && (
            <div className="space-y-2">
              {visualIdeas.map((idea, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedVisualIdea(idea)}
                  className={cn(
                    'rounded-lg border p-3 cursor-pointer transition-all',
                    selectedVisualIdea === idea
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{idea.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{idea.description}</p>
                      <p className="text-xs text-muted-foreground/60 mt-1 font-mono truncate">
                        {idea.dallePrompt}
                      </p>
                    </div>
                    {selectedVisualIdea === idea && (
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Proceed button */}
      <div className="flex justify-end">
        <Button
          onClick={handleProceed}
          disabled={!selectedVisualIdea || proceeding}
          size="lg"
        >
          {proceeding
            ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Переходим…</>
            : 'Генерация креатива →'
          }
        </Button>
      </div>
    </div>
  )
}
