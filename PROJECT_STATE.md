# PROJECT STATE — Generator / Publisher
> Файл для быстрого восстановления контекста после перезагрузки / смены кодера / потери чата.
> Обновлять после каждой завершённой задачи или важного решения.
> Последнее обновление: 2026-05-13

---

## 1. Суть продукта

**Generator / Publisher** — AI-система управления контентом для маркетологов, которые ведут несколько продуктов/приложений одновременно.

**Главная идея:** маркетолог загружает любой набор ресурсов (ссылка, текст, скриншот, PDF, App Store страница, пост конкурента) → система парсит их → генерирует варианты постов с учётом памяти конкретного проекта → маркетолог одобряет текст + промпт → система генерирует картинку → контент публикуется.

**Две ключевые особенности:**
1. **Изолированная память по проектам** — AI знает тон, аудиторию, антипаттерны и лучшие примеры отдельно для каждого проекта. Кросс-проектного заражения нет.
2. **Approve-before-image** — изображение генерируется только после явного одобрения текста + визуального промпта. Снижает waste на дорогую генерацию картинок.

**Этапы развития:**
- Этап 1 (текущий): картинка + текст
- Этап 2 (будущий): видеоконтент

**Владелец продукта:** Dmitri Antipenko
**Контроль:** Ilya Shainov

---

## 2. Технический стек

| Слой | Технология | Версия |
|------|-----------|--------|
| Frontend | Next.js App Router | 16.2.4 |
| UI | React | 19.2.4 |
| Компоненты | shadcn/ui v4 + base-ui/react | — |
| Стили | Tailwind CSS | v4 |
| Async state | TanStack React Query | v5 |
| Local state | Zustand | v5 |
| БД | Supabase Postgres | — |
| Auth | Supabase Auth (magic link) | — |
| Storage | Supabase Storage | — |
| AI текст | Claude API (Anthropic) | Sonnet 4.6 |
| AI картинки | DALL-E 3 (OpenAI) | — |
| Deploy | Vercel | — |

**ВАЖНО:** Backend — только Next.js Server Actions. Отдельного Python/FastAPI нет и не планируется в V1. Всё серверное — server actions в Next.js + прямые запросы к Supabase.

---

## 3. Доступы и ссылки

| Ресурс | URL |
|--------|-----|
| Приложение (прод) | https://generator-publisher.vercel.app |
| GitHub репозиторий | https://github.com/sh-n-sh/generator-publisher |
| Supabase проект | https://supabase.com/dashboard/project/xiwbgsmgiqlxcvanfbzm |
| Vercel Dashboard | https://vercel.com/dmitriys-projects-46d420d9/generator-publisher |
| Локальный код | /Users/dmitrij/Desktop/new ai-content-system/generator-publisher |
| Спецификация | /Users/dmitrij/Desktop/new ai-content-system/прод докс, спецификации , план и прочее/спецификации/01-developer-spec.md |
| Дизайн-спек | /Users/dmitrij/Desktop/new ai-content-system/прод докс, спецификации , план и прочее/спецификации/02-design-spec.md |

**Env переменные (локально в .env.local, в Vercel добавлены):**
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role (только server-side)
- `OPENAI_API_KEY` — OpenAI ключ (для DALL-E 3)
- `NEXT_PUBLIC_APP_URL` — https://generator-publisher.vercel.app

---

## 4. Архитектура базы данных

Полная схема задеплоена в одной миграции `001_initial_schema.sql`.

**23 таблицы:**

| Группа | Таблицы |
|--------|---------|
| Workspace & Team | workspaces, workspace_memberships |
| Projects | projects, project_profiles |
| Project Intelligence | project_context_memories, few_shot_examples, project_anti_patterns |
| Content Pipeline | resource_bundles, resource_items, draft_sets, draft_variants, content_items |
| Media | image_assets |
| Ideas | ideas |
| Publishing | publish_jobs, calendar_entries |
| Analytics | metrics_snapshots |
| Trends | trend_signals |
| Workspace-level | workspace_scheduling_signals, integrations, alerts, shared_system_analytics |

**18 enum'ов** — все workflow-статусы, типы платформ, форматы контента.

**RLS** включён на всех таблицах. Пользователь видит только данные своего workspace.

**Триггеры:**
- `add_workspace_owner` — при создании workspace автоматически добавляет владельца в memberships
- `init_project_context` — при создании проекта инициализирует profile и memory контейнеры

---

## 5. Ключевые архитектурные решения

### Admin client для server mutations
Supabase SSR client не передаёт JWT в database queries из server actions в Next.js 16. Решение: отдельный `createAdminClient()` (service role) используется только в server actions после явной проверки auth через anon client.
- Файл: `src/lib/supabase/server.ts`
- **Никогда не использовать admin client на клиенте**

### Approve-before-image workflow
В `content_items` два поля: `approved_text_at` и `approved_prompt_at`. Запись в `image_assets` только после заполнения обоих. Кнопка генерации картинки заблокирована UI до этого момента.

### SSI — двухуровневые scheduling signals
- `shared_system_analytics` — анонимизированные кросс-воркспейсовые паттерны (читают все)
- `workspace_scheduling_signals` — воркспейс-уровневые, строятся на SSI + локальной аналитике
- Вес SSI уменьшается по мере накопления собственной аналитики

### Trend Scout MVP — только 2 источника (бесплатно)
1. Мониторинг URL конкурентов
2. AI-поиск по ключевым словам проекта через Claude
Внешние API (Mention, Exploding Topics) — отложены до подтверждения спроса.

### Изоляция данных — принципиальный момент
Проект A никогда не видит данные проекта B. Обеспечено на трёх уровнях: RLS в Postgres, scope в запросах, архитектура промптов.

### proxy.ts вместо middleware.ts
Next.js 16 переименовал middleware. Файл лежит в `src/proxy.ts`.

---

## 6. Структура файлов (Sprint 1)

```
src/
├── app/
│   ├── (app)/                        # Защищённые роуты
│   │   ├── dashboard/page.tsx        # Workspace dashboard
│   │   ├── layout.tsx                # App shell с sidebar
│   │   ├── project/
│   │   │   ├── [id]/page.tsx         # Project dashboard (5 блоков skeleton)
│   │   │   └── create/               # Форма создания проекта
│   │   └── workspace/create/         # Форма создания workspace
│   ├── auth/
│   │   ├── callback/                 # Magic link callback
│   │   └── confirm/route.ts
│   ├── sign-in/                      # Страница входа
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── layout/app-sidebar.tsx        # Sidebar с workspace switcher
│   └── ui/                           # shadcn компоненты
├── lib/
│   ├── actions/
│   │   ├── auth.ts                   # Sign in / Sign out
│   │   ├── project.ts                # Create project
│   │   └── workspace.ts              # Create workspace
│   └── supabase/
│       ├── client.ts                 # Браузерный клиент
│       ├── middleware.ts             # SSR клиент для middleware
│       └── server.ts                 # Server клиент + admin клиент
├── proxy.ts                          # Next.js 16 middleware (защита роутов)
└── types/database.ts                 # Автогенерированные TypeScript типы БД
```

---

## 7. Статус по спринтам

### Sprint 1 — App Shell + Auth + DB (16–22 апр) ✅ ЗАВЕРШЁН
- ✅ Полная DB схема (23 таблицы, RLS, триггеры)
- ✅ Auth (magic link, middleware, защита роутов, callback)
- ✅ Workspace creation (форма + admin client fix)
- ✅ Project creation (форма)
- ✅ App shell (sidebar, layout, workspace switcher)
- ✅ Dashboard скелеты (workspace + project)
- ✅ Vercel деплой (auto-deploy при push в main)
- ✅ TypeScript типы для всей БД
- ✅ AGENTS.md + clean-code.md (стандарты кода)
- ✅ GitHub перенесён в org sh-n-sh
- ✅ Vercel переподключён к sh-n-sh/generator-publisher
- ✅ OpenAI API key добавлен в Vercel и .env.local

### Sprint 2 — AI Content Generation Core ⏳ В РАБОТЕ (старт: 13 мая 2026)
> ТЗ: `/прод докс.../спецификации/TZ-Sprint2.md` (v3.0) | Дизайн проверен 2026-05-13

**Фаза 0 — Константы:**
- ❌ Создать `src/lib/constants.ts` (SOCIAL_PLATFORMS: 6 платформ, twitter_x, без Buffer)

**Фаза 1 — Обновление Sprint 1 UI:**
- ❌ Sidebar: список проектов из БД, коллапс, русский язык
- ❌ WorkspaceDashboard: русский, цветные карточки
- ❌ ProjectDashboard: мини-канбан, счётчики статусов, русский
- ❌ Skeleton pages: 11 пустых страниц для новых маршрутов

**Фаза 2 — CreateProject + DB:**
- ❌ 3-шаговый визард (Основы → Аудитория → Каналы)
- ❌ Brand Voice генерация через Claude API
- ❌ Visual DNA анализ через Claude Vision
- ❌ Сохранение в projects + project_profiles (UPDATE триггерной записи)

**Фаза 3 — ContentTaskBuilder:**
- ❌ 6 платформ, Guided mode (идеи через Claude), AI mode (пост через Claude)

**Фаза 4 — DraftEditor:**
- ❌ AI regen + AI editor + AI visual ideas

**Фаза 5 — ContentDetail ("Генерация креатива"):**
- ❌ DALL-E 3 автогенерация + AI редактор + Approve-before-image

**Фаза 6 — ContentPlanner:**
- ❌ calendar_entries + publish_jobs + scheduling

### Sprint 3 — Publishing + Calendar ❌ НЕ НАЧАТ
- ❌ US-301 — Workspace Calendar (полноценный)
- ❌ US-302 — ProjectKanban (канбан-доска: неделя / месяц)
- ❌ US-303 — Telegram Integration (реальная публикация)
- ❌ US-304 — Buffer Integration (реальная публикация)
- ❌ US-305 — Publish Jobs Worker (cron / webhook)

### Sprint 4 — Analytics + Learning Loop (7–13 мая) ❌ НЕ НАЧАТ
- ❌ US-401 — Metrics Sync
- ❌ US-402 — Project Analytics Dashboard
- ❌ US-403 — Learning Loop
- ❌ US-404 — Workspace Dashboard (финальная версия)

### Sprint 5 — Trend Scout + Idea Bank (14–20 мая) ❌ НЕ НАЧАТ
- ❌ US-501 — Trend Scout
- ❌ US-502 — Trend → Content flow
- ❌ US-503 — Idea Bank

### Sprint 6 — Team + Settings + Polish (21–27 мая) ❌ НЕ НАЧАТ
- ❌ US-601 — Invite flow
- ❌ US-602 — Team Settings
- ❌ US-603 — Integration Settings
- ❌ US-604 — Notification Settings
- ❌ US-605 — Workspace Settings
- ❌ US-606 — Polish + Billing scaffold

---

## 8. Текущий активный таск

**Sprint 2 — НАЧАТ (2026-05-13)**

**Первый шаг (Фаза 0):**
Создать `src/lib/constants.ts` с `SOCIAL_PLATFORMS` (6 платформ, `twitter_x`, без Buffer).

**Второй шаг (Фаза 1):**
Обновить существующие страницы Sprint 1 (Sidebar, WorkspaceDashboard, ProjectDashboard) под дизайн.
Создать 11 skeleton-страниц для новых маршрутов.

**Затем (Фазы 2–6):**
Новые страницы генерации контента в порядке пайплайна.

**Полное ТЗ (v3.0):** `/прод докс, спецификации , план и прочее/спецификации/TZ-Sprint2.md`

---

## 9. Открытые вопросы и решения

| Вопрос | Решение |
|--------|---------|
| Resend SMTP | Не настроен. Supabase встроенный SMTP лимит 2 email/час. Настроить перед продакшн-запуском: Supabase → Auth → SMTP → вставить Resend API key |
| Дизайн | Figma Make: https://www.figma.com/make/9TQZnNqWkB9k09PByxMgKQ — проверен 2026-05-13, актуален |
| Billing | Заглушка. Stripe-ready поля в схеме уже есть. Видимый billing — не в V1 |
| Mobile | Desktop-first. На мобильном работает просмотр, полноценное создание — только desktop |

---

## 10. Стандарты разработки

**Обязательно читать перед кодингом:**
- `AGENTS.md` — правила Next.js 16 + стандарты чистого кода
- `CLAUDE.md` → `.claude/clean-code.md` — детальные правила для Claude

**Главные правила:**
- Все серверные мутации — только через server actions с admin client
- Никогда не использовать service role key на клиенте
- RLS обязателен — не обходить на уровне запросов
- TypeScript strict — никаких `any`
- Компоненты из shadcn/ui — не изобретать своё

---

## 11. Как быстро восстановить работу

1. Открыть папку проекта: `/Users/dmitrij/Desktop/new ai-content-system/generator-publisher`
2. Прочитать этот файл (PROJECT_STATE.md)
3. Проверить текущий статус: `git log --oneline -5`
4. Посмотреть что не сделано в разделе "Статус по спринтам"
5. Взять следующую задачу из "Текущий активный таск"
6. Прочитать `TZ-Sprint2.md` (актуальное ТЗ для Sprint 2)
7. Начать кодить

---

> **Правило обновления файла:** после каждого завершённого US — обновить статус в разделе 7, обновить раздел 8, дату вверху файла.
