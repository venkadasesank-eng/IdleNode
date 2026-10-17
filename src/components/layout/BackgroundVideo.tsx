import React, { useRef, useEffect, useState } from 'react'

export const BackgroundVideo: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoError, setVideoError] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.playbackRate = 1.0 // Smooth natural playback, no slow-motion
    const playPromise = video.play()
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        video.muted = true
        video.play().catch(() => setVideoError(true))
      })
    }
  }, [])

  return (
    <div className="bg-video-container" aria-hidden="true">
      {/* 1. Background video with smooth natural looping */}
      {!videoError ? (
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
      ) : (
        /* Fallback space grid only if video cannot play */
        <div className="bg-space-grid" />
      )}

      {/* 2. Dark contrast overlay ensuring text is crisp, legible and framed */}
      <div className="bg-contrast-overlay" />
    </div>
  )
}
