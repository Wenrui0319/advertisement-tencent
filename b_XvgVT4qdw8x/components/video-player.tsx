'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize, SkipForward } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { ProgressBarCharacter } from '@/components/progress-bar-character'
import type { AdTriggerPoint, Product } from '@/lib/types'
import { cn } from '@/lib/utils'

interface VideoPlayerProps {
  src?: string
  adTriggerPoints: AdTriggerPoint[]
  onAdTriggered: (products: Product[]) => void
  onAdEnded: () => void
  isAdActive: boolean
  className?: string
  onPause?: () => void
  onPlay?: () => void
}

export function VideoPlayer({
  src,
  adTriggerPoints,
  onAdTriggered,
  onAdEnded,
  isAdActive,
  className,
  onPause,
  onPlay,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [triggeredAds, setTriggeredAds] = useState<Set<number>>(new Set())
  const [currentAdEndTime, setCurrentAdEndTime] = useState<number | null>(null)
  const [characterThrown, setCharacterThrown] = useState(false)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 小人被扔出去的处理
  const handleCharacterThrow = useCallback((velocity: { x: number; y: number }) => {
    setCharacterThrown(true)
    // 可以在这里添加音效或其他反馈
    setTimeout(() => setCharacterThrown(false), 3000)
  }, [])

  // 检查广告触发点
  useEffect(() => {
    if (!isPlaying || isAdActive) return

    const checkPoint = adTriggerPoints.find(
      point =>
        currentTime >= point.time &&
        currentTime < point.time + 1 &&
        !triggeredAds.has(point.time)
    )

    if (checkPoint) {
      setTriggeredAds(prev => new Set([...prev, checkPoint.time]))
      setCurrentAdEndTime(currentTime + checkPoint.duration)
      videoRef.current?.pause()
      setIsPlaying(false)
      onAdTriggered(checkPoint.products)
    }
  }, [currentTime, isPlaying, adTriggerPoints, triggeredAds, isAdActive, onAdTriggered])

  // 播放/暂停
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return

    if (isAdActive) {
      return // 广告期间不允许播放
    }

    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }, [isPlaying, isAdActive])

  // 跳过广告
  const skipAd = useCallback(() => {
    onAdEnded()
    setCurrentAdEndTime(null)
    if (videoRef.current) {
      videoRef.current.play()
      setIsPlaying(true)
    }
  }, [onAdEnded])

  // 时间更新
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }, [])

  // 加载元数据
  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }, [])

  // 进度条拖动
  const handleSeek = useCallback((value: number[]) => {
    if (videoRef.current && !isAdActive) {
      videoRef.current.currentTime = value[0]
      setCurrentTime(value[0])
    }
  }, [isAdActive])

  // 音量控制
  const handleVolumeChange = useCallback((value: number[]) => {
    if (videoRef.current) {
      const newVolume = value[0]
      videoRef.current.volume = newVolume
      setVolume(newVolume)
      setIsMuted(newVolume === 0)
    }
  }, [])

  // 静音切换
  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }, [isMuted])

  // 全屏
  const toggleFullscreen = useCallback(() => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        containerRef.current.requestFullscreen()
      }
    }
  }, [])

  // 控制栏显示/隐藏
  const handleMouseMove = useCallback(() => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !isAdActive) {
        setShowControls(false)
      }
    }, 3000)
  }, [isPlaying, isAdActive])

  // 格式化时间
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // 计算广告标记位置
  const adMarkers = adTriggerPoints.map(point => ({
    position: duration > 0 ? (point.time / duration) * 100 : 0,
    triggered: triggeredAds.has(point.time),
  }))

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden rounded-xl bg-black',
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* 视频或占位画面 */}
      {src ? (
        <video
          ref={videoRef}
          src={src}
          className="h-full w-full object-cover"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          onClick={togglePlay}
          onPause={() => {
           onPause?.();  // 调用传入的回调
         }}
         onPlay={() => {
           onPlay?.();   // 调用传入的回调
         }}
        />
      ) : (
        <DemoVideoPlaceholder
          currentTime={currentTime}
          duration={duration || 120}
          isPlaying={isPlaying}
          onTimeUpdate={setCurrentTime}
          onDurationSet={setDuration}
        />
      )}

      {/* 广告激活遮罩 */}
      {isAdActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="text-center">
            <div className="mb-4 text-lg font-medium text-foreground">
              拖拽你喜欢的商品到小人身上
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={skipAd}
              className="gap-2"
            >
              <SkipForward className="h-4 w-4" />
              跳过广告
            </Button>
          </div>
        </div>
      )}

      {/* 控制栏 */}
      <div
        className={cn(
          'absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300',
          showControls || isAdActive ? 'opacity-100' : 'opacity-0'
        )}
      >
        {/* 进度条区域 - 包含小人 */}
        <div className="relative mb-3 pt-12">
          {/* 趴在进度条上的小人 */}
          {!isAdActive && (
            <ProgressBarCharacter
              progress={duration > 0 ? (currentTime / duration) * 100 : 0}
              isPlaying={isPlaying}
              onThrow={handleCharacterThrow}
            />
          )}

          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            disabled={isAdActive}
            className="cursor-pointer"
          />
          {/* 广告标记点 */}
          {adMarkers.map((marker, index) => (
            <div
              key={index}
              className={cn(
                'absolute bottom-0 h-3 w-1 -translate-y-1/2 rounded-full',
                marker.triggered ? 'bg-muted-foreground' : 'bg-accent'
              )}
              style={{ left: `${marker.position}%` }}
            />
          ))}
        </div>

        {/* 控制按钮 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlay}
              disabled={isAdActive}
              className="h-8 w-8 text-white hover:bg-white/20"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="h-8 w-8 text-white hover:bg-white/20"
              >
                {isMuted ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume]}
                max={1}
                step={0.1}
                onValueChange={handleVolumeChange}
                className="w-20"
              />
            </div>

            <span className="text-sm text-white/80">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="h-8 w-8 text-white hover:bg-white/20"
          >F
            <Maximize className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// 演示用的模拟视频占位组件
function DemoVideoPlaceholder({
  currentTime,
  duration,
  isPlaying,
  onTimeUpdate,
  onDurationSet,
}: {
  currentTime: number
  duration: number
  isPlaying: boolean
  onTimeUpdate: (time: number) => void
  onDurationSet: (duration: number) => void
}) {
  useEffect(() => {
    onDurationSet(120) // 模拟2分钟视频
  }, [onDurationSet])

  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      onTimeUpdate(Math.min(currentTime + 0.1, duration))
    }, 100)

    return () => clearInterval(interval)
  }, [isPlaying, currentTime, duration, onTimeUpdate])

  // 根据时间段显示不同品牌的场景
  const getSceneInfo = () => {
    if (currentTime < 20) return { brand: 'Nike', color: '#FF6B00', scene: '运动场景' }
    if (currentTime < 40) return { brand: 'Apple', color: '#555555', scene: '科技生活' }
    if (currentTime < 60) return { brand: 'Dior', color: '#C9A050', scene: '奢华时刻' }
    if (currentTime < 80) return { brand: '麦当劳', color: '#FFC72C', scene: '美食时光' }
    return { brand: '可口可乐', color: '#F40009', scene: '畅爽一刻' }
  }

  const scene = getSceneInfo()

  return (
    <div
      className="flex h-full w-full items-center justify-center transition-colors duration-1000"
      style={{ backgroundColor: scene.color + '20' }}
    >
      <div className="text-center">
        <div
          className="mb-2 text-4xl font-bold"
          style={{ color: scene.color }}
        >
          {scene.brand}
        </div>
        <div className="text-lg text-muted-foreground">{scene.scene}</div>
        <div className="mt-4 text-sm text-muted-foreground">
          {isPlaying ? '正在播放...' : '点击播放'}
        </div>
      </div>
    </div>
  )
}
