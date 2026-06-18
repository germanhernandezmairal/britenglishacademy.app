# Image Generation Prompts (Ideogram)

Prompts for regenerating the site's photography in **Ideogram**. All four share one
photographic style so the course grid stays cohesive with the existing
`course-ninos` / `course-adultos` shots.

**Brand context to keep in mind:** navy `#012169` / `#0d1b3e` + gold `#d4a017`,
British / Cambridge academic feel, Tarragona Mediterranean light, warm but premium.
Each prompt ends with `no text, no logos, no watermarks` because the site lays its
own text and a navy gradient over these images.

**General Ideogram settings:** use **Style: Realistic**. If a result drifts from the
brief, toggle **Magic Prompt to "Off"** so it follows the wording literally
(especially for the hero re-creation). Generate a few variations and pick the
cleanest composition for the gradient overlays.

| Image | On-page role | Render size | Aspect ratio |
|---|---|---|---|
| `hero-classroom.jpg` | Hero (right side) | 580×435 | **4:3** |
| `course-cambridge.jpg` | Course card → "Preparación Cambridge" | `h-48` fill, landscape | **4:3** |
| `course-particulares.jpg` | Course card → "Clases Particulares" (1-a-1) | `h-48` fill, landscape | **4:3** |
| `cta-teacher.jpg` | Final CTA portrait | 340×510 | **2:3 (portrait)** |

> **Naming note:** this file was originally `course-verano.jpg` (summer) but was
> renamed to `course-cambridge.jpg` to match its real on-page role — the
> **"Preparación Cambridge"** card in `app/page.tsx`. Its prompt below targets that
> purpose (Cambridge exam prep).

---

## 1. `hero-classroom.jpg` — same scene, taller

**Aspect ratio: 4:3** (current file is ~16:9; 4:3 gives the extra height and matches
the 580×435 slot). For a literal re-creation, turn **Magic Prompt OFF**.

> Photorealistic photograph of a bright, modern primary-school classroom on a sunny
> morning. A group of about seven happy, diverse children aged 9–12 sit at
> green-framed wooden school desks with open books and notebooks, smiling warmly
> toward the camera. A friendly female teacher in a light blazer stands at the
> back-left near a whiteboard and a colorful cork notice board. Large windows on the
> right reveal green Mediterranean hills and bright sky. Warm natural sunlight streams
> in, soft shadows, gentle bokeh. Show generous vertical framing: visible ceiling
> above and the full desks and floor below, so the room feels tall and airy. Candid,
> joyful, premium educational photography, shallow depth of field, 50mm lens look. no
> text, no logos, no watermarks

---

## 2. `course-cambridge.jpg` → "Preparación Cambridge" card

**Aspect ratio: 4:3** (landscape, fills the `h-48` card; keep the lower third
uncluttered — a navy gradient sits there).

> Photorealistic editorial photograph of focused teenage and young-adult students
> preparing for a Cambridge English exam together at a bright study table. Open
> Cambridge-style exam practice books, notebooks, and pencils on the table; one
> student writing, another reading, calm and confident concentration with subtle
> smiles. Modern, elegant language-academy classroom with large windows, warm natural
> light, and subtle navy-blue and gold academic accents in the decor. Clean,
> aspirational, premium feel. Shallow depth of field, 35mm lens look, soft natural
> lighting. no text, no logos, no watermarks

---

## 3. `course-particulares.jpg` → "Clases Particulares" (1-to-1)

**Aspect ratio: 4:3** (landscape, `h-48` card; keep key detail out of the bottom
third for the gradient).

> Photorealistic photograph of a warm one-to-one English tutoring session. A friendly
> professional female teacher sits beside a single engaged student at a small wooden
> table, both looking at an open textbook as she points and explains. Genuine smiles,
> attentive body language, a real sense of personal attention. Cozy, modern private
> classroom with soft natural window light and subtle navy-blue and gold academic
> accents. Intimate, premium, encouraging mood. Shallow depth of field, 50mm lens
> look, soft directional daylight. no text, no logos, no watermarks

---

## 4. `cta-teacher.jpg` — full replacement portrait

**Aspect ratio: 2:3 (portrait)** — matches the 340×510 slot. **Framing:** keep the
subject **near and prominent** (waist/chest-up, head with only a small amount of
headroom). Avoid large empty space at the top — the first generated version had too
much dead ceiling/wall above the subject and had to be cropped tighter afterwards.

> Photorealistic editorial portrait of a confident, approachable professional female
> English teacher, around 30–45 years old, standing in a bright modern language
> academy. Tight three-quarter / waist-up framing so she fills most of the frame.
> Warm, genuine smile, relaxed posture, smart-casual professional attire, holding a
> notebook. Softly blurred classroom behind her with a whiteboard and bookshelves.
> Warm natural light, premium magazine-quality portrait, shallow depth of field, 85mm
> lens look. Small headroom above the head, no large empty space at the top. Subtle
> navy-blue and gold tones in the background. no text, no logos, no watermarks

> _Note: the current `cta-teacher.jpg` (652×978) is a tighter crop of the original
> 832×1248 Ideogram render. The full original is kept at
> `public/free-imgs/Oldest ones/cta-teacher-ideogram-original.jpg`._
