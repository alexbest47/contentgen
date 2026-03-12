

## Plan: Fix OpenRouter image generation response parsing

### Problem
When using OpenRouter with `google/gemini-3-pro-image-preview`, the model returns text instead of image data because:
1. The code currently uses the Lovable AI Gateway (`/v1/images/generations`) — not OpenRouter
2. Even when previously pointed at OpenRouter's `/v1/chat/completions`, the response parsing was wrong

### Root cause
OpenRouter returns images in a different format than the code expects:

```text
OpenRouter response:
  choices[0].message.images[0].image_url.url = "data:image/png;base64,..."

Current code expects:
  data[0].b64_json = "..."
```

### Solution
Update `supabase/functions/generate-image/index.ts` (lines 109-135):

1. **Switch back to OpenRouter** endpoint: `https://openrouter.ai/api/v1/chat/completions`
2. **Use `OPENROUTER_API_KEY`** instead of `LOVABLE_API_KEY`
3. **Send correct request** with `modalities: ["image", "text"]`
4. **Parse response correctly**: extract base64 from `choices[0].message.images[0].image_url.url`, strip the `data:image/png;base64,` prefix before passing to `decode()`

### Key code change

```typescript
// Request
const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
  },
  body: JSON.stringify({
    model: "google/gemini-3-pro-image-preview",
    messages: [{ role: "user", content: imagePrompt }],
    modalities: ["image", "text"],
  }),
});

// Parse — extract base64 from the images array
const data = await response.json();
const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
if (!imageUrl) throw new Error("No image in response: " + JSON.stringify(data).substring(0, 500));

// Strip "data:image/png;base64," prefix
const b64Image = imageUrl.replace(/^data:image\/\w+;base64,/, "");
```

No other files need changes.

