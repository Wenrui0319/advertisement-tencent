'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, useAnimation, type PanInfo } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ProgressBarCharacterProps {
  progress: number // 0-100
  isPlaying: boolean
  onThrow?: (velocity: { x: number; y: number }) => void
  className?: string
}

export function ProgressBarCharacter({
  progress,
  isPlaying,
  onThrow,
  className,
}: ProgressBarCharacterProps) {
  const [isBeingDragged, setIsBeingDragged] = useState(false)
  const [isThrown, setIsThrown] = useState(false)
  const [throwPosition, setThrowPosition] = useState({ x: 0, y: 0 })
  const controls = useAnimation()
  const containerRef = useRef<HTMLDivElement>(null)

  // 小人回到进度条上
  const returnToBar = () => {
    setIsThrown(false)
    setThrowPosition({ x: 0, y: 0 })
    controls.start({
      x: 0,
      y: 0,
      rotate: 0,
      scale: 1,
      transition: { type: 'spring', stiffness: 300, damping: 20 },
    })
  }

  // 拖拽开始
  const handleDragStart = () => {
    setIsBeingDragged(true)
  }

  // 拖拽结束 - 判断是否扔出去
  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    setIsBeingDragged(false)

    const velocity = Math.sqrt(info.velocity.x ** 2 + info.velocity.y ** 2)
    const throwThreshold = 500 // 速度阈值

    if (velocity > throwThreshold) {
      // 扔出去！
      setIsThrown(true)
      onThrow?.({ x: info.velocity.x, y: info.velocity.y })

      // 计算飞行目标位置
      const flyX = info.velocity.x * 0.5
      const flyY = info.velocity.y * 0.5 - 100 // 向上抛物线

      controls.start({
        x: flyX,
        y: flyY,
        rotate: info.velocity.x > 0 ? 720 : -720,
        scale: 0.5,
        transition: {
          type: 'tween',
          duration: 0.8,
          ease: 'easeOut',
        },
      })

      // 3秒后回来
      setTimeout(returnToBar, 3000)
    } else {
      // 速度不够，弹回去
      controls.start({
        x: 0,
        y: 0,
        rotate: 0,
        transition: { type: 'spring', stiffness: 400, damping: 25 },
      })
    }
  }

  // 播放时的摆动动画
  useEffect(() => {
    if (isPlaying && !isBeingDragged && !isThrown) {
      controls.start({
        rotate: [0, -3, 3, -3, 0],
        transition: {
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      })
    } else if (!isPlaying && !isBeingDragged && !isThrown) {
      controls.stop()
      controls.set({ rotate: 0 })
    }
  }, [isPlaying, isBeingDragged, isThrown, controls])

  return (
    <div
      ref={containerRef}
      className={cn('absolute bottom-0 h-16 pointer-events-none', className)}
      style={{
        left: `${progress}%`,
        transform: 'translateX(-50%)',
        zIndex: 50,
      }}
    >
      <motion.div
        drag
        dragMomentum={false}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        animate={controls}
        whileDrag={{ scale: 1.1, cursor: 'grabbing' }}
        className="pointer-events-auto cursor-grab"
        style={{ touchAction: 'none' }}
      >
        <LyingCharacterSVG
          isBeingDragged={isBeingDragged}
          isThrown={isThrown}
          isPlaying={isPlaying}
        />
      </motion.div>

      {/* 扔出去后的提示 */}
      {isThrown && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-full bg-card px-3 py-1 text-xs text-muted-foreground shadow-lg"
        >
          马上回来~
        </motion.div>
      )}
    </div>
  )
}

// 趴着的小人 SVG
function LyingCharacterSVG({
  isBeingDragged,
  isThrown,
  isPlaying,
}: {
  isBeingDragged: boolean
  isThrown: boolean
  isPlaying: boolean
}) {
  const bodyColor = isBeingDragged
    ? '#FBBF24' // 被拖拽时变黄色
    : isThrown
      ? '#F472B6' // 被扔出时变粉色
      : '#A78BFA' // 正常紫色

  return (
    <svg
      width="80"
      height="50"
      viewBox="0 0 80 50"
      fill="none"
      className="drop-shadow-lg"
    >
      {/* 身体 - 横向椭圆形（趴着） */}
      <motion.ellipse
        cx="40"
        cy="35"
        rx="30"
        ry="12"
        fill={bodyColor}
        animate={{
          ry: isPlaying && !isBeingDragged ? [12, 11, 12] : 12,
        }}
        transition={{
          duration: 0.5,
          repeat: isPlaying && !isBeingDragged ? Infinity : 0,
        }}
      />

      {/* 头部 */}
      <motion.circle
        cx="65"
        cy="20"
        r="18"
        fill={bodyColor}
        animate={{
          cy: isPlaying && !isBeingDragged ? [20, 18, 20] : 20,
        }}
        transition={{
          duration: 0.5,
          repeat: isPlaying && !isBeingDragged ? Infinity : 0,
        }}
      />

      {/* 眼睛 */}
      {isThrown ? (
        // 被扔时 - 晕眩的眼睛
        <>
          <motion.g
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: '58px 18px' }}
          >
            <path d="M54 14 L62 22 M54 22 L62 14" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" />
          </motion.g>
          <motion.g
            animate={{ rotate: [0, -360] }}
            transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: '72px 18px' }}
          >
            <path d="M68 14 L76 22 M68 22 L76 14" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" />
          </motion.g>
        </>
      ) : isBeingDragged ? (
        // 被抓时 - 惊讶的眼睛
        <>
          <circle cx="58" cy="18" r="5" fill="#FFFFFF" stroke="#1A1A1A" strokeWidth="1.5" />
          <circle cx="58" cy="18" r="2.5" fill="#1A1A1A" />
          <circle cx="72" cy="18" r="5" fill="#FFFFFF" stroke="#1A1A1A" strokeWidth="1.5" />
          <circle cx="72" cy="18" r="2.5" fill="#1A1A1A" />
        </>
      ) : (
        // 正常 - 开心的眼睛
        <>
          <motion.path
            d="M54 18 Q58 14 62 18"
            stroke="#1A1A1A"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            animate={{
              d: isPlaying
                ? ['M54 18 Q58 14 62 18', 'M54 17 Q58 13 62 17', 'M54 18 Q58 14 62 18']
                : 'M54 18 Q58 14 62 18',
            }}
            transition={{ duration: 0.5, repeat: isPlaying ? Infinity : 0 }}
          />
          <motion.path
            d="M68 18 Q72 14 76 18"
            stroke="#1A1A1A"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            animate={{
              d: isPlaying
                ? ['M68 18 Q72 14 76 18', 'M68 17 Q72 13 76 17', 'M68 18 Q72 14 76 18']
                : 'M68 18 Q72 14 76 18',
            }}
            transition={{ duration: 0.5, repeat: isPlaying ? Infinity : 0 }}
          />
        </>
      )}

      {/* 嘴巴 */}
      {isThrown ? (
        // 被扔时 - 张嘴惊叫
        <ellipse cx="65" cy="28" rx="4" ry="5" fill="#1A1A1A" />
      ) : isBeingDragged ? (
        // 被抓时 - 惊讶张嘴
        <ellipse cx="65" cy="27" rx="3" ry="4" fill="#1A1A1A" />
      ) : (
        // 正常 - 微笑
        <path
          d="M60 26 Q65 30 70 26"
          stroke="#1A1A1A"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      )}

      {/* 腮红 */}
      {!isThrown && (
        <>
          <ellipse cx="52" cy="22" rx="4" ry="2.5" fill="#FFB6C1" fillOpacity="0.6" />
          <ellipse cx="78" cy="22" rx="4" ry="2.5" fill="#FFB6C1" fillOpacity="0.6" />
        </>
      )}

      {/* 前面的小手（撑着身体） */}
      <motion.ellipse
        cx="15"
        cy="42"
        rx="6"
        ry="8"
        fill={bodyColor}
        animate={{
          ry: isPlaying && !isBeingDragged ? [8, 7, 8] : 8,
        }}
        transition={{
          duration: 0.5,
          repeat: isPlaying && !isBeingDragged ? Infinity : 0,
        }}
      />

      {/* 小脚（后面翘起） */}
      <motion.g
        animate={{
          rotate: isPlaying && !isBeingDragged ? [0, 15, 0, -15, 0] : 0,
        }}
        transition={{
          duration: 1,
          repeat: isPlaying && !isBeingDragged ? Infinity : 0,
          ease: 'easeInOut',
        }}
        style={{ transformOrigin: '12px 35px' }}
      >
        <ellipse cx="12" cy="28" rx="5" ry="7" fill={bodyColor} />
      </motion.g>
    </svg>
  )
}
