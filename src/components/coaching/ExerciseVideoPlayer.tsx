'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, RotateCcw } from 'lucide-react'

interface VideoData {
  videoUrl:      string
  durationSec:   number
  width:         number
  height:        number
  codec:         string
  licenseAuthor: string
}

interface ExerciseVideoPlayerProps {
  videos:        VideoData[]
  posterUrl?:    string
  exerciseName:  string
}

export function ExerciseVideoPlayer({
  videos,
  posterUrl,
  exerciseName
}: ExerciseVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  const [isPlaying,    setIsPlaying]    = useState(false)
  const [isMuted,      setIsMuted]      = useState(true)   // muted by default for autoplay
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [progress,     setProgress]     = useState(0)
  const [duration,     setDuration]     = useState(0)
  const [currentTime,  setCurrentTime]  = useState(0)
  const [isLoading,    setIsLoading]    = useState(true)
  const [hasError,     setHasError]     = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [activeIdx,    setActiveIdx]    = useState(0)
  const hideControlsTimer = useRef<NodeJS.Timeout | undefined>(undefined)

  // Build proxy URL — videos stream through our backend to prevent download
  const getProxyUrl = (originalUrl: string) =>
    `/api/exercises/video-proxy?url=${encodeURIComponent(originalUrl)}`

  // Select best video: prefer MP4, then MOV
  const sortedVideos = [...videos].sort((a, b) => {
    const aIsMp4 = a.videoUrl.toLowerCase().endsWith('.mp4')
    const bIsMp4 = b.videoUrl.toLowerCase().endsWith('.mp4')
    if (aIsMp4 && !bIsMp4) return -1
    if (!aIsMp4 && bIsMp4) return 1
    // Prefer higher resolution
    return (b.width * b.height) - (a.width * a.height)
  })

  const currentVideo = sortedVideos[activeIdx]

  const resetHideTimer = useCallback(() => {
    setShowControls(true)
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current)
    hideControlsTimer.current = setTimeout(() => {
      if (isPlaying) setShowControls(false)
    }, 3000)
  }, [isPlaying])

  const togglePlay = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) { v.play(); setIsPlaying(true) }
    else { v.pause(); setIsPlaying(false) }
    resetHideTimer()
  }, [resetHideTimer])

  const toggleMute = () => {
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    setIsMuted(v.muted)
  }

  const toggleFullscreen = () => {
    const el = containerRef.current
    if (!el) return
    if (!document.fullscreenElement) {
      el.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar   = progressRef.current
    const v     = videoRef.current
    if (!bar || !v || !v.duration || !isFinite(v.duration)) return
    const rect  = bar.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const newTime = ratio * v.duration
    if (isFinite(newTime)) {
      v.currentTime = newTime
    }
  }

  const handleRestart = () => {
    const v = videoRef.current
    if (!v) return
    v.currentTime = 0
    v.play()
    setIsPlaying(true)
  }

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    const v = videoRef.current
    if (!v) return

    const onTimeUpdate = () => {
      setCurrentTime(v.currentTime)
      setProgress(v.duration ? (v.currentTime / v.duration) * 100 : 0)
    }
    const onDurationChange = () => setDuration(v.duration)
    const onWaiting  = () => setIsLoading(true)
    const onCanPlay  = () => setIsLoading(false)
    const onError    = () => { setHasError(true); setIsLoading(false) }
    const onEnded    = () => { setIsPlaying(false); setShowControls(true) }
    const onPlay     = () => setIsPlaying(true)
    const onPause    = () => setIsPlaying(false)

    v.addEventListener('timeupdate',     onTimeUpdate)
    v.addEventListener('durationchange', onDurationChange)
    v.addEventListener('waiting',        onWaiting)
    v.addEventListener('canplay',        onCanPlay)
    v.addEventListener('error',          onError)
    v.addEventListener('ended',          onEnded)
    v.addEventListener('play',           onPlay)
    v.addEventListener('pause',          onPause)

    return () => {
      v.removeEventListener('timeupdate',     onTimeUpdate)
      v.removeEventListener('durationchange', onDurationChange)
      v.removeEventListener('waiting',        onWaiting)
      v.removeEventListener('canplay',        onCanPlay)
      v.removeEventListener('error',          onError)
      v.removeEventListener('ended',          onEnded)
      v.removeEventListener('play',           onPlay)
      v.removeEventListener('pause',          onPause)
    }
  }, [activeIdx])

  if (!videos || videos.length === 0) {
    return posterUrl ? (
      <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
        <img src={posterUrl} alt={exerciseName} className="w-full h-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <span className="text-white/70 text-sm">No video available</span>
        </div>
      </div>
    ) : null
  }

  if (hasError) {
    return (
      <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-900 flex items-center justify-center">
        {posterUrl && <img src={posterUrl} alt={exerciseName} className="absolute inset-0 w-full h-full object-cover opacity-30" />}
        <div className="relative text-center">
          <p className="text-white text-sm mb-2">Video unavailable</p>
          <button onClick={() => { setHasError(false); setActiveIdx(prev => (prev + 1) % sortedVideos.length) }}
            className="text-xs text-blue-400 underline">
            Try another clip
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative aspect-video rounded-xl overflow-hidden bg-black group cursor-pointer select-none"
      onMouseMove={resetHideTimer}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => { if (isPlaying) setShowControls(false) }}
      onClick={togglePlay}
    >
      {/* VIDEO ELEMENT — uses proxy URL, no direct CDN link */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        poster={posterUrl}
        muted={isMuted}
        playsInline
        preload="metadata"
        onContextMenu={e => e.preventDefault()}  // disable right-click → Save Video As
      >
        <source
          src={getProxyUrl(currentVideo.videoUrl)}
          type={currentVideo.videoUrl.toLowerCase().endsWith('.mp4') ? 'video/mp4' : 'video/quicktime'}
        />
      </video>

      {/* LOADING SPINNER */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* BIG PLAY BUTTON (center) — shown when paused */}
      {!isPlaying && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center
            hover:bg-white/30 transition-all hover:scale-110">
            <Play className="w-8 h-8 text-white fill-white ml-1" />
          </div>
        </div>
      )}

      {/* CONTROLS BAR — auto-hides when playing */}
      <div className={`absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent
        px-3 pb-3 pt-8 transition-opacity duration-300
        ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* PROGRESS BAR */}
        <div
          ref={progressRef}
          className="w-full h-1.5 bg-white/30 rounded-full cursor-pointer mb-2 group/bar"
          onClick={handleProgressClick}
        >
          <div
            className="h-full bg-white rounded-full transition-all relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full
              opacity-0 group-hover/bar:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* CONTROLS ROW */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <button onClick={togglePlay}
              className="text-white hover:text-white/80 transition-colors p-1">
              {isPlaying
                ? <Pause  className="w-4 h-4 fill-white" />
                : <Play   className="w-4 h-4 fill-white" />}
            </button>

            {/* Restart */}
            <button onClick={handleRestart}
              className="text-white/70 hover:text-white transition-colors p-1">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Mute */}
            <button onClick={toggleMute}
              className="text-white/70 hover:text-white transition-colors p-1">
              {isMuted
                ? <VolumeX className="w-4 h-4" />
                : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Time */}
            <span className="text-white/70 text-xs tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration || currentVideo.durationSec)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Resolution badge */}
            {currentVideo.height > 0 && (
              <span className="text-white/50 text-xs">
                {currentVideo.height >= 1080 ? '1080p' : currentVideo.height >= 720 ? '720p' : `${currentVideo.height}p`}
              </span>
            )}

            {/* Multi-clip selector */}
            {sortedVideos.length > 1 && (
              <div className="flex gap-1">
                {sortedVideos.map((_, i) => (
                  <button key={i}
                    onClick={() => { setActiveIdx(i); setHasError(false) }}
                    className={`w-5 h-5 rounded text-xs font-bold transition-colors
                      ${i === activeIdx ? 'bg-white text-black' : 'bg-white/20 text-white hover:bg-white/40'}`}>
                    {i + 1}
                  </button>
                ))}
              </div>
            )}

            {/* Fullscreen */}
            <button onClick={toggleFullscreen}
              className="text-white/70 hover:text-white transition-colors p-1">
              {isFullscreen
                ? <Minimize2 className="w-4 h-4" />
                : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* CREDIT (bottom-left corner, tiny) */}
      {currentVideo.licenseAuthor && (
        <div className={`absolute top-2 left-2 text-white/40 text-xs transition-opacity
          ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          © {currentVideo.licenseAuthor}
        </div>
      )}
    </div>
  )
}
