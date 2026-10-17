import React, { useRef, useEffect, useState } from 'react'

export const BackgroundVideo: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoError, setVideoError] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Ensure playsInline and autoplay work across browsers
    const playPromise = video.play()
    if (playPromise !== undefined) {
      playPromise.catch((_err) => {
        // Autoplay may be restricted before user interaction; mute is set
        video.muted = true
        video.play().catch(() => setVideoError(true))
      })
    }
  }, [])

  return (
    <div className="bg-video-container" aria-hidden="true">
      {/* 1. Subtle space-like fine dots grid */}
      <div className="bg-space-grid" />

      {/* 2. Mandatory exact supplied background animation video */}
      {!videoError && (
        <video
          ref={videoRef}
          className="bg-video"
          src="/videos/idlenode-background.mp4"
          autoPlay
          muted
          loop
          playsInline
          onError={() => setVideoError(true)}
        />
      )}

      {/* 3. Subtle dark contrast overlay to ensure crisp readability */}
      <div className="bg-contrast-overlay" />
    </div>
  )
}
