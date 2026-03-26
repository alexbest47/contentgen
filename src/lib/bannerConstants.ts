export const BANNER_TYPES = [
  { key: "header_banner", label: "Шапка письма", width: 600, height: 200 },
  { key: "case_card", label: "Карточка кейса", width: 600, height: 240 },
  { key: "program_banner", label: "Баннер программы", width: 600, height: 220 },
  { key: "custom", label: "Произвольный", width: 0, height: 0 },
] as const;

export type BannerTypeKey = typeof BANNER_TYPES[number]["key"];

export function getBannerTypeLabel(key: string): string {
  return BANNER_TYPES.find((t) => t.key === key)?.label ?? key;
}

export function getBannerDimensions(key: string): { width: number; height: number } | null {
  const bt = BANNER_TYPES.find((t) => t.key === key);
  return bt ? { width: bt.width, height: bt.height } : null;
}

export function getBannerAspectRatio(key: string): number {
  const dims = getBannerDimensions(key);
  return dims ? dims.width / dims.height : 3;
}

const PREAMBLE = `STRICTLY FORBIDDEN in the image:
— Any watermarks, logos, domain names (no 'talentsy.ru', no URLs)
— Any buttons, UI elements, CTAs
— Any text overlays, labels, captions on the scene
— Any interface components, navigation elements`;

export const BANNER_PROMPT_TEMPLATES: Record<string, string> = {
  header_banner: `[SCENE]
A person (psychologist or student, approx. 35–45 years old, female)
in a warm, cozy interior — reading, reflecting, or in a calm conversation.
Character fills the ENTIRE image naturally, not confined to one side.
LEFT 45% of the image: calm, less detailed background area
(this zone will have a text overlay added in HTML — keep it visually quiet).
RIGHT 55%: main scene with character.
Smooth visual transition across the full width, no hard split line.
Wide cinematic crop, 600×200px proportions.

[LAYOUT]
Horizontal banner. Character present across full width.
Left zone intentionally calm for text overlay. No text in the image.`,

  case_card: `[SCENE]
A person (psychologist or student, female, approx. 35–45 years old)
in a cozy, warm setting — home office, library, café, or therapy room.
NOT an office worker. NOT a corporate office. NOT a manager at a desk.
Character is positioned FLUSH AGAINST THE LEFT EDGE — starts from pixel 0.
No empty space to the left of the character.
Character occupies LEFT 40% of the image.
RIGHT 60%: very dark, nearly empty background — maximum darkness
(rgba darkness ~0.85+) to ensure white text overlay is readable.
Dark gradient flows from right edge toward center.

[LAYOUT]
600×240px. Character flush left from pixel 0.
Right 60% is intentionally dark and empty for text overlay.
No text rendered in the image itself.`,

  program_banner: `[SCENE]
A psychologist-consultant conducting a therapy session.
Warm, professional interior: therapy room, soft lighting, comfortable chairs.
NOT an office worker. NOT a business meeting. NOT a corporate setting.
Two people: therapist and client, in calm, focused interaction.
Character scene occupies LEFT 50% of the image.
RIGHT 50%: dark, clean background — will have program name text overlay in HTML.
Dark gradient flows from right edge toward center.

[LAYOUT]
600×220px. Scene on the left 50%. Right 50% dark and clean for text overlay.
No text rendered in the image itself.`,
};

export function buildFullPrompt(bannerType: string, scenePrompt: string, imageStyle: string): string {
  return `${PREAMBLE}\n\n${imageStyle}\n\n${scenePrompt}`;
}

export const PLACEHOLDER_TO_BANNER_TYPE: Record<string, BannerTypeKey> = {
  image_placeholder_1: "header_banner",
  image_placeholder_2: "case_card",
  image_placeholder_3: "program_banner",
  image_placeholder_4: "program_banner",
};
