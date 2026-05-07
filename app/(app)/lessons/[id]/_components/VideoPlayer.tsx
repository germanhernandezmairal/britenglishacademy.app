"use client"

function getYouTubeId(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname.includes("youtube.com")) return u.searchParams.get("v")
    if (u.hostname === "youtu.be") return u.pathname.slice(1)
  } catch {
    // invalid URL
  }
  return null
}

export function VideoPlayer({
  videoUrl,
  videoSource,
  title,
}: {
  videoUrl: string
  videoSource: string
  title: string
}) {
  if (videoSource === "youtube") {
    const youtubeId = getYouTubeId(videoUrl)
    if (!youtubeId) return null

    return (
      <div className="rounded-2xl overflow-hidden shadow-md" style={{ aspectRatio: "16/9" }}>
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    )
  }

  // Uploaded video (Supabase Storage public URL)
  return (
    <div className="rounded-2xl overflow-hidden shadow-md">
      <video
        src={videoUrl}
        controls
        className="w-full"
        style={{ maxHeight: "480px", background: "#000" }}
      >
        Tu navegador no soporta la reproducción de vídeo.
      </video>
    </div>
  )
}
