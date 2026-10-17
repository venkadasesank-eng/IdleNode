import React, { useRef, useEffect, useState } from 'react'

export const BackgroundVideo: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoFailed, setVideoFailed] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Ensure synchronous property assignment for aggressive autoplay approval
    video.muted = true
    video.defaultMuted = true

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      video.pause()
      return
    }

    const startPlayback = () => {
      if (!video) return
      try {
        video.playbackRate = 1.35
      } catch {
        // Fallback to 1.0 if browser blocks custom playback rate
      }

      const promise = video.play()
      if (promise !== undefined) {
        promise.catch(() => {
          // If autoplay restricted by browser policy, resume on first user interaction
          const handleFirstInteract = () => {
            if (video) {
              video.muted = true
              video.playbackRate = 1.35
              video.play().catch(() => {})
            }
            window.removeEventListener('pointerdown', handleFirstInteract)
            window.removeEventListener('keydown', handleFirstInteract)
            window.removeEventListener('scroll', handleFirstInteract)
            window.removeEventListener('touchstart', handleFirstInteract)
          }

          window.addEventListener('pointerdown', handleFirstInteract, { once: true, passive: true })
          window.addEventListener('keydown', handleFirstInteract, { once: true, passive: true })
          window.addEventListener('scroll', handleFirstInteract, { once: true, passive: true })
          window.addEventListener('touchstart', handleFirstInteract, { once: true, passive: true })
        })
      }
    }

    // Attempt playback immediately and when data loads
    startPlayback()

    const handleLoadedData = () => {
      startPlayback()
    }

    // Keep playing smoothly on loop without pausing
    const handleEnded = () => {
      if (!video) return
      video.currentTime = 0
      startPlayback()
    }

    // Resume playback if tab was hidden and becomes visible again
    const handleVisibilityChange = () => {
      if (!document.hidden && video && !prefersReducedMotion) {
        startPlayback()
      }
    }

    // Periodic watchdog to ensure playback is continuously moving
    const watchdogInterval = window.setInterval(() => {
      if (video && video.paused && !document.hidden && !prefersReducedMotion) {
        startPlayback()
      }
    }, 3000)

    video.addEventListener('loadeddata', handleLoadedData)
    video.addEventListener('canplay', handleLoadedData)
    video.addEventListener('ended', handleEnded)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.clearInterval(watchdogInterval)
      video.removeEventListener('loadeddata', handleLoadedData)
      video.removeEventListener('canplay', handleLoadedData)
      video.removeEventListener('ended', handleEnded)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return (
    <div className="bg-video-container" aria-hidden="true">
      {/* Background video with fast, smooth, continuous 1.35x natural playback */}
      {!videoFailed ? (
        <video
          ref={videoRef}
          className="bg-video"
          src="/videos/idlenode-background.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onCanPlay={(e) => {
            const v = e.currentTarget
            v.muted = true
            try {
              v.playbackRate = 1.35
            } catch {}
            v.play().catch(() => {})
          }}
          onError={() => setVideoFailed(true)}
        />
      ) : (
        /* Fallback space grid only if video asset completely fails to load */
        <div className="bg-space-grid" />
      )}

      {/* Dark contrast overlay ensuring text is crisp, legible, and framed while motion stays vivid */}
      <div className="bg-contrast-overlay" />
    </div>
  )
}
