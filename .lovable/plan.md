

## Квадратное изображение для Telegram

Сейчас все изображения (и в карусели, и одиночные) имеют соотношение `aspect-[4/5]` (портрет Instagram). Для Telegram нужно квадратное `aspect-[1/1]`.

### Изменения

**1. `src/components/project/PipelineResultView.tsx`**
- Добавить prop `contentType?: string` в `Props`
- Передать `contentType` в `SocialView` и далее в `PostCard` / `CarouselSlider`
- Заменить жёстко заданный `aspect-[4/5]` на динамический: если `contentType === "instagram"` → `aspect-[4/5]`, иначе → `aspect-square`
- Затронутые места: строка 349 (static image), строка 491 (carousel slides)

**2. `src/pages/ContentDetail.tsx`**
- Передать `contentType={content_type}` в `<PipelineResultView>`

