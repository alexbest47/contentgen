

## Plan: Update `image_post` prompt for direct image generation

### Problem
The current `image_post` prompt asks the model to "describe" an image, so it returns text instead of generating an actual image. The `generate-image` edge function expects the model to return image data.

### Solution
Update the prompt record (id: `c9d971d8-4b05-42db-a3b2-577d6590ae44`) in the `prompts` table via a database migration. The new prompt will be a direct instruction to **draw** a social media post image.

### New prompt content

**system_prompt:**
> Ты — профессиональный дизайнер социальных сетей. Создавай яркие, привлекательные изображения для постов. Изображение должно быть в формате 1080x1080 пикселей, с чистым современным дизайном, без мелкого текста.

**user_prompt_template:**
> Нарисуй изображение для поста в социальных сетях.
>
> Программа: {{program_title}}
> Тип оффера: {{offer_type}}
> Оффер: {{offer_title}}
> Целевая аудитория: {{audience_description}}
>
> Лид-магнит: {{lead_magnet_title}}
> Описание лид-магнита: {{lead_magnet_description}}
>
> Требования к изображению:
> - Квадратный формат (1:1)
> - Яркие цвета, привлекающие внимание в ленте
> - Минимум текста на изображении (максимум 3-5 слов крупным шрифтом)
> - Современный, профессиональный стиль
> - Визуально передавай суть лид-магнита и его ценность для аудитории
> - Не используй стоковые клише

### Technical details
- One SQL UPDATE on the `prompts` table for the existing record
- No schema changes needed
- The same approach should later be applied to `image_carousel` and `image_email` prompts (out of scope for now)

