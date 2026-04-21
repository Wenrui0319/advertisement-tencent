'use client'

import { useEffect, useState, forwardRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { CharacterEmotion, Product } from '@/lib/types'
import { cn } from '@/lib/utils'

interface CharacterProps {
  emotion: CharacterEmotion
  isReceiving?: boolean
  receivedProduct?: Product | null
  onDropZoneReady?: (ready: boolean) => void
  className?: string
}

export const Character = forwardRef<HTMLDivElement, CharacterProps>(
  function Character(
    { emotion, isReceiving = false, receivedProduct, className },
    ref
  ) {
    const [showParticles, setShowParticles] = useState(false)
    const [localEmotion, setLocalEmotion] = useState<CharacterEmotion>(emotion)

    useEffect(() => {
      setLocalEmotion(emotion)
    }, [emotion])

    useEffect(() => {
      if (receivedProduct) {
        setShowParticles(true)
        setLocalEmotion('happy')
        const timer = setTimeout(() => {
          setShowParticles(false)
        }, 1500)
        return () => clearTimeout(timer)
      }
    }, [receivedProduct])

    return (
      <div
        ref={ref}
        data-drop-zone="character"
        className={cn(
          'relative flex flex-col items-center justify-center',
          className
        )}
      >
        {/* 接收提示光环 */}
        <AnimatePresence>
          {isReceiving && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1.2 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 rounded-full bg-primary/20 blur-xl"
            />
          )}
        </AnimatePresence>

        {/* 粒子特效 */}
        <AnimatePresence>
          {showParticles && (
            <ParticleEffect count={12} />
          )}
        </AnimatePresence>

        {/* 小人SVG */}
        <motion.div
          animate={{
            scale: isReceiving ? 1.1 : 1,
            y: localEmotion === 'happy' ? [0, -10, 0] : 0,
          }}
          transition={{
            y: {
              duration: 0.5,
              repeat: localEmotion === 'happy' ? 2 : 0,
            },
          }}
        >
          <CharacterSVG emotion={localEmotion} size={180} />
        </motion.div>

        {/* 情绪气泡 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={localEmotion}
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.8 }}
            className="mt-3 rounded-full bg-card px-4 py-2 shadow-lg"
          >
            <span className="text-sm font-medium text-foreground">
              {getEmotionMessage(localEmotion)}
            </span>
          </motion.div>
        </AnimatePresence>

        {/* 接收的商品展示 */}
        <AnimatePresence>
          {receivedProduct && (
            <motion.div
              initial={{ opacity: 0, scale: 0, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0, y: -50 }}
              className="absolute -top-8 rounded-lg bg-accent px-3 py-1.5 text-accent-foreground shadow-lg"
            >
              <span className="text-sm font-medium">
                +{receivedProduct.points} 积分！
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }
)

// 小人SVG组件
function CharacterSVG({
  emotion,
  size = 180,
}: {
  emotion: CharacterEmotion
  size?: number
}) {
  const faceProps = getEmotionFace(emotion)
  const bodyColor = getEmotionBodyColor(emotion)

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 180 180"
      fill="none"
      className="drop-shadow-lg"
    >
      {/* 身体 */}
      <motion.ellipse
        cx="90"
        cy="130"
        rx="45"
        ry="35"
        fill={bodyColor}
        animate={{
          ry: emotion === 'happy' ? [35, 32, 35] : 35,
        }}
        transition={{ duration: 0.3, repeat: emotion === 'happy' ? Infinity : 0, repeatDelay: 0.5 }}
      />

      {/* 头部 */}
      <motion.circle
        cx="90"
        cy="70"
        r="50"
        fill={bodyColor}
        animate={{
          cy: emotion === 'happy' ? [70, 65, 70] : 70,
        }}
        transition={{ duration: 0.3, repeat: emotion === 'happy' ? Infinity : 0, repeatDelay: 0.5 }}
      />

      {/* 眼睛 */}
      <motion.g
        animate={{
          y: emotion === 'happy' ? [0, -5, 0] : 0,
        }}
        transition={{ duration: 0.3, repeat: emotion === 'happy' ? Infinity : 0, repeatDelay: 0.5 }}
      >
        {/* 左眼 */}
        {faceProps.eyeType === 'normal' ? (
          <>
            <ellipse cx="70" cy="60" rx="8" ry="10" fill="#1A1A1A" />
            <circle cx="72" cy="58" r="3" fill="#FFFFFF" />
          </>
        ) : faceProps.eyeType === 'happy' ? (
          <path
            d="M62 60 Q70 55 78 60"
            stroke="#1A1A1A"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
        ) : faceProps.eyeType === 'surprised' ? (
          <>
            <circle cx="70" cy="60" r="12" fill="#FFFFFF" stroke="#1A1A1A" strokeWidth="2" />
            <circle cx="70" cy="60" r="6" fill="#1A1A1A" />
          </>
        ) : faceProps.eyeType === 'disgusted' ? (
          <>
            <path d="M62 55 L78 62" stroke="#1A1A1A" strokeWidth="3" strokeLinecap="round" />
            <ellipse cx="70" cy="63" rx="6" ry="5" fill="#1A1A1A" />
          </>
        ) : (
          // bored - 半闭眼
          <path
            d="M62 62 Q70 60 78 62"
            stroke="#1A1A1A"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
        )}

        {/* 右眼 */}
        {faceProps.eyeType === 'normal' ? (
          <>
            <ellipse cx="110" cy="60" rx="8" ry="10" fill="#1A1A1A" />
            <circle cx="112" cy="58" r="3" fill="#FFFFFF" />
          </>
        ) : faceProps.eyeType === 'happy' ? (
          <path
            d="M102 60 Q110 55 118 60"
            stroke="#1A1A1A"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
        ) : faceProps.eyeType === 'surprised' ? (
          <>
            <circle cx="110" cy="60" r="12" fill="#FFFFFF" stroke="#1A1A1A" strokeWidth="2" />
            <circle cx="110" cy="60" r="6" fill="#1A1A1A" />
          </>
        ) : faceProps.eyeType === 'disgusted' ? (
          <>
            <path d="M102 62 L118 55" stroke="#1A1A1A" strokeWidth="3" strokeLinecap="round" />
            <ellipse cx="110" cy="63" rx="6" ry="5" fill="#1A1A1A" />
          </>
        ) : (
          <path
            d="M102 62 Q110 60 118 62"
            stroke="#1A1A1A"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
        )}
      </motion.g>

      {/* 嘴巴 */}
      <motion.g
        animate={{
          y: emotion === 'happy' ? [0, -5, 0] : 0,
        }}
        transition={{ duration: 0.3, repeat: emotion === 'happy' ? Infinity : 0, repeatDelay: 0.5 }}
      >
        {faceProps.mouthType === 'smile' ? (
          <path
            d="M70 90 Q90 110 110 90"
            stroke="#1A1A1A"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
        ) : faceProps.mouthType === 'big-smile' ? (
          <>
            <path
              d="M65 88 Q90 115 115 88"
              stroke="#1A1A1A"
              strokeWidth="4"
              strokeLinecap="round"
              fill="#FFFFFF"
            />
            <path
              d="M65 88 Q90 115 115 88"
              fill="#FF6B8A"
              fillOpacity="0.3"
            />
          </>
        ) : faceProps.mouthType === 'o' ? (
          <ellipse cx="90" cy="95" rx="12" ry="15" fill="#1A1A1A" />
        ) : faceProps.mouthType === 'frown' ? (
          <path
            d="M70 100 Q90 85 110 100"
            stroke="#1A1A1A"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
        ) : (
          // neutral
          <path
            d="M75 95 L105 95"
            stroke="#1A1A1A"
            strokeWidth="4"
            strokeLinecap="round"
          />
        )}
      </motion.g>

      {/* 腮红 */}
      {(emotion === 'happy' || emotion === 'surprised') && (
        <>
          <ellipse cx="50" cy="78" rx="10" ry="6" fill="#FFB6C1" fillOpacity="0.5" />
          <ellipse cx="130" cy="78" rx="10" ry="6" fill="#FFB6C1" fillOpacity="0.5" />
        </>
      )}

      {/* 手臂 */}
      <motion.g
        animate={{
          rotate: emotion === 'happy' ? [0, -10, 10, 0] : 0,
        }}
        transition={{ duration: 0.5, repeat: emotion === 'happy' ? 2 : 0 }}
        style={{ transformOrigin: '50px 120px' }}
      >
        <ellipse cx="35" cy="130" rx="12" ry="20" fill={bodyColor} />
      </motion.g>
      <motion.g
        animate={{
          rotate: emotion === 'happy' ? [0, 10, -10, 0] : 0,
        }}
        transition={{ duration: 0.5, repeat: emotion === 'happy' ? 2 : 0 }}
        style={{ transformOrigin: '130px 120px' }}
      >
        <ellipse cx="145" cy="130" rx="12" ry="20" fill={bodyColor} />
      </motion.g>
    </svg>
  )
}

// 粒子特效组件
function ParticleEffect({ count = 12 }: { count?: number }) {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    angle: (360 / count) * i,
    delay: Math.random() * 0.2,
    size: 6 + Math.random() * 8,
    color: ['#FFD700', '#FF6B6B', '#4ECDC4', '#A78BFA', '#F472B6'][
      Math.floor(Math.random() * 5)
    ],
  }))

  return (
    <div className="pointer-events-none absolute inset-0">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{
            opacity: 1,
            scale: 0,
            x: 0,
            y: 0,
          }}
          animate={{
            opacity: 0,
            scale: 1,
            x: Math.cos((particle.angle * Math.PI) / 180) * 80,
            y: Math.sin((particle.angle * Math.PI) / 180) * 80,
          }}
          transition={{
            duration: 0.8,
            delay: particle.delay,
            ease: 'easeOut',
          }}
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            marginLeft: -particle.size / 2,
            marginTop: -particle.size / 2,
          }}
        />
      ))}
    </div>
  )
}

// 情绪相关的辅助函数
function getEmotionFace(emotion: CharacterEmotion): {
  eyeType: 'normal' | 'happy' | 'surprised' | 'disgusted' | 'bored'
  mouthType: 'smile' | 'big-smile' | 'o' | 'frown' | 'neutral'
} {
  switch (emotion) {
    case 'expectant':
      return { eyeType: 'normal', mouthType: 'smile' }
    case 'happy':
      return { eyeType: 'happy', mouthType: 'big-smile' }
    case 'surprised':
      return { eyeType: 'surprised', mouthType: 'o' }
    case 'disgusted':
      return { eyeType: 'disgusted', mouthType: 'frown' }
    case 'bored':
      return { eyeType: 'bored', mouthType: 'neutral' }
    default:
      return { eyeType: 'normal', mouthType: 'smile' }
  }
}

function getEmotionBodyColor(emotion: CharacterEmotion): string {
  switch (emotion) {
    case 'expectant':
      return '#A78BFA' // 紫色
    case 'happy':
      return '#4ADE80' // 绿色
    case 'surprised':
      return '#FBBF24' // 黄色
    case 'disgusted':
      return '#94A3B8' // 灰色
    case 'bored':
      return '#CBD5E1' // 浅灰色
    default:
      return '#A78BFA'
  }
}

function getEmotionMessage(emotion: CharacterEmotion): string {
  switch (emotion) {
    case 'expectant':
      return '期待收到礼物~'
    case 'happy':
      return '太棒了！我好喜欢！'
    case 'surprised':
      return '哇！这是什么？'
    case 'disgusted':
      return '呃...这个不太适合我...'
    case 'bored':
      return '有点无聊呢...'
    default:
      return '你好呀~'
  }
}
