

## Создание 5 пустых промптов для «Разбор мифа»

Вставка 5 записей в таблицу `prompts` через insert tool:

| name | slug | content_type | channel | category | step_order |
|---|---|---|---|---|---|
| Генерация тем разбора мифа | myth-busting-topics | myth_busting | NULL | myth_busting | 1 |
| Разбор мифа: Instagram | myth-busting-instagram | myth_busting | instagram | myth_busting | 1 |
| Разбор мифа: Telegram | myth-busting-telegram | myth_busting | telegram | myth_busting | 1 |
| Разбор мифа: VK | myth-busting-vk | myth_busting | vk | myth_busting | 1 |
| Разбор мифа: Email | myth-busting-email | myth_busting | email | myth_busting | 1 |

Все поля `system_prompt` и `user_prompt_template` — пустые строки. После создания можно импортировать тексты через TXT.

