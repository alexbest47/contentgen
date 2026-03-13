

## Fix: Email preview disappears after tab switch

### Problem
Radix `TabsContent` unmounts inactive tab content. When switching from "Превью письма" to "HTML-код" and back, the iframe is destroyed and recreated, but the `useEffect` that writes HTML into it doesn't re-fire because `fullPreviewHtml` hasn't changed.

### Solution
Replace `useRef` + `useEffect` with a **callback ref** on the iframe. A callback ref fires every time the DOM element is mounted, so it will re-write the HTML content each time the preview tab becomes active.

### Changes

**`src/components/project/PipelineResultView.tsx`** (EmailView function, ~lines 225-284):
- Remove `const iframeRef = useRef<HTMLIFrameElement>(null)`
- Remove the `useEffect` that writes to iframe (lines 267-284)
- Add a callback ref function that writes `fullPreviewHtml` into the iframe and auto-resizes it
- Update `<iframe ref={iframeRef}` to use the new callback ref

```tsx
const iframeCallbackRef = useCallback((iframe: HTMLIFrameElement | null) => {
  if (!iframe) return;
  const doc = iframe.contentDocument;
  if (!doc) return;
  doc.open();
  doc.write(fullPreviewHtml);
  doc.close();
  const tryResize = () => {
    try {
      const h = doc.documentElement?.scrollHeight || doc.body?.scrollHeight || 600;
      iframe.style.height = h + "px";
    } catch {}
  };
  setTimeout(tryResize, 100);
  setTimeout(tryResize, 500);
}, [fullPreviewHtml]);
```

One file, ~15 lines changed.

