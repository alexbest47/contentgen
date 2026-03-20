

## Убрать program и title из `{{webinar_data}}`

### Изменения

**`src/pages/PromptVariables.tsx`**

1. **Строка 138**: описание → «JSON-данные выбранного вебинара (дата, автовебинар, ссылка на лендинг)»
2. **Строки 605-611**: убрать `program` и `title` из примера, оставить только:
   ```json
   {
     "webinar_date": "2025-10-15T18:00:00",
     "is_autowebinar": "нет",
     "landing_url": "https://example.com/webinar"
   }
   ```

### Итого
- 1 файл, ~5 строк изменено

