

## Убрать поле «Ссылка на Google Doc» из формы создания диагностики

В `src/pages/CreateDiagnostic.tsx` удалить:
- Состояние `docUrl` 
- Блок с Label + Input для Google Doc URL
- Убрать `doc_url` из insert-объекта мутации

