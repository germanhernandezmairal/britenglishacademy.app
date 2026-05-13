"use server"

import Replicate from "replicate"

export async function generateChallengeBanner(postContent: string): Promise<string | null> {
  const token = process.env.REPLICATE_API_TOKEN
  if (!token) return null

  try {
    const replicate = new Replicate({ auth: token })

    // Derive a concise visual prompt from the post content (max 200 chars)
    const subject = postContent.replace(/[^\w\s,.!?'-]/g, "").trim().slice(0, 200)
    const prompt =
      `Premium English language learning challenge banner. ` +
      `Theme: "${subject}". ` +
      `Style: elegant, modern, educational. British academic aesthetic. ` +
      `Navy blue and gold color palette. Clean typography background. No text overlays. ` +
      `Photorealistic illustration, 16:9 wide format.`

    const output = await replicate.run("black-forest-labs/flux-schnell", {
      input: {
        prompt,
        num_outputs: 1,
        aspect_ratio: "16:9",
        output_format: "webp",
        output_quality: 80,
      },
    })

    // flux-schnell returns an array of ReadableStream or URL strings
    const first = Array.isArray(output) ? output[0] : output
    if (!first) return null

    // If it's a ReadableStream, convert to base64 data URL
    if (typeof first === "object" && first !== null && typeof (first as ReadableStream).getReader === "function") {
      const reader = (first as ReadableStream<Uint8Array>).getReader()
      const chunks: Uint8Array[] = []
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        if (value) chunks.push(value)
      }
      const total = chunks.reduce((n, c) => n + c.length, 0)
      const merged = new Uint8Array(total)
      let offset = 0
      for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.length }
      const base64 = Buffer.from(merged).toString("base64")
      return `data:image/webp;base64,${base64}`
    }

    // Otherwise it's already a URL string
    return String(first)
  } catch {
    return null
  }
}
