'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { AnimatePresence, motion, type PanInfo } from 'framer-motion'
import { VideoPlayer } from '@/components/video-player'
import { ProductShowcase } from '@/components/draggable-product'
import { Character } from '@/components/character'
import { BackpackPanel, BackpackMini } from '@/components/backpack'
import { useBackpack } from '@/hooks/use-backpack'
import { adTriggerPoints, getRandomProducts } from '@/lib/mock-data'
import type { Product, CharacterEmotion } from '@/lib/types'
import { cn } from '@/lib/utils'
import Image from 'next/image'


export default function InteractiveAdPage() {
  // 新增状态：是否显示暂停覆盖层
  const [showPauseOverlay, setShowPauseOverlay] = useState(false)
  // 新增状态：是否显示可拖拽的卡片
  const [showDraggableCard, setShowDraggableCard] = useState(false)

  // 视频暂停时调用
  const handlePause = () => {
    setShowPauseOverlay(true)
  }

  // 视频播放时调用（比如点击播放按钮）
  const handlePlay = () => {
    setShowPauseOverlay(false)
    setShowDraggableCard(false)
  }
 
  const {
    backpack,
    addItem,
    removeItem,
    clearBackpack,
    totalPoints,
    logAction,
  } = useBackpack()

  const [isAdActive, setIsAdActive] = useState(false)
  const [currentProducts, setCurrentProducts] = useState<Product[]>([])
  const [characterEmotion, setCharacterEmotion] = useState<CharacterEmotion>('expectant')
  const [receivedProduct, setReceivedProduct] = useState<Product | null>(null)
  const [isDraggingProduct, setIsDraggingProduct] = useState(false)
  const [draggedProduct, setDraggedProduct] = useState<Product | null>(null)
  const [floatingProduct, setFloatingProduct] = useState<Product | null>(null)
  const [floatingPos, setFloatingPos] = useState({ x: 0, y: 0 })
  const characterRef = useRef<HTMLDivElement>(null)


  // 广告触发时的处理
  const handleAdTriggered = useCallback((products: Product[]) => {
    setIsAdActive(true)
    setCurrentProducts(products)
    setCharacterEmotion('expectant')
    logAction({ type: 'video_pause' })
  }, [logAction])

  // 广告结束时的处理
  const handleAdEnded = useCallback(() => {
    setIsAdActive(false)
    setCurrentProducts([])
    setCharacterEmotion('expectant')
    logAction({ type: 'video_resume' })
  }, [logAction])

  // 商品开始拖拽
  const handleProductDragStart = useCallback((product: Product) => {
    setIsDraggingProduct(true)
    setDraggedProduct(product)
    setCharacterEmotion('expectant')
    logAction({ type: 'drag_start', productId: product.id })
  }, [logAction])

  // 商品拖拽结束
  const handleProductDragEnd = useCallback(
    (product: Product, info: PanInfo, element: HTMLElement) => {
      setIsDraggingProduct(false)
      setDraggedProduct(null)

      // 检查是否落在小人身上
      const characterElement = characterRef.current
      if (!characterElement) {
        logAction({ type: 'drag_end', productId: product.id })
        return
      }

      const characterRect = characterElement.getBoundingClientRect()
      const dropPoint = { x: info.point.x, y: info.point.y }

      // 判断是否在小人区域内
      const isOnCharacter =
        dropPoint.x >= characterRect.left &&
        dropPoint.x <= characterRect.right &&
        dropPoint.y >= characterRect.top &&
        dropPoint.y <= characterRect.bottom

      if (isOnCharacter) {
        // 成功放到小人身上
        const success = addItem(product)
        if (success) {
          setCharacterEmotion('happy')
          setReceivedProduct(product)
          logAction({ type: 'drop_success', productId: product.id })

          // 重置状态
          setTimeout(() => {
            setReceivedProduct(null)
            if (isAdActive) {
              setCharacterEmotion('expectant')
            }
          }, 2000)
        } else {
          // 背包已满
          setCharacterEmotion('surprised')
          logAction({
            type: 'drop_reject',
            productId: product.id,
            details: { reason: 'backpack_full' },
          })
        }
      } else {
        logAction({ type: 'drag_end', productId: product.id })
      }
    },
    [addItem, isAdActive, logAction]
  )

  // 无聊检测 - 如果广告激活但用户长时间不操作
  useEffect(() => {
    if (!isAdActive) return

    const boredTimer = setTimeout(() => {
      if (!isDraggingProduct && characterEmotion === 'expectant') {
        setCharacterEmotion('bored')
      }
    }, 8000)

    return () => clearTimeout(boredTimer)
  }, [isAdActive, isDraggingProduct, characterEmotion])

  // 演示模式：页面加载后自动展示商品
  const [demoMode, setDemoMode] = useState(false)

  const startDemo = useCallback(() => {
    setDemoMode(true)
    const randomProducts = getRandomProducts(4)
    setCurrentProducts(randomProducts)
    setIsAdActive(true)
    setCharacterEmotion('expectant')
  }, [])

  // 开始浮动拖拽（点击热点时调用）
  const startFloatingDrag = useCallback((product: Product, startX: number, startY: number) => {
    setFloatingProduct(product)
    setFloatingPos({ x: startX, y: startY })

    const handleMouseMove = (e: MouseEvent) => {
      setFloatingPos({ x: e.clientX, y: e.clientY })
    }

    const handleMouseUp = (e: MouseEvent) => {
      // 判断是否在小人身上
      const characterEl = characterRef.current
      let droppedOnCharacter = false
      if (characterEl) {
        const rect = characterEl.getBoundingClientRect()
        droppedOnCharacter = e.clientX >= rect.left && e.clientX <= rect.right &&
                             e.clientY >= rect.top && e.clientY <= rect.bottom
      }
      if (droppedOnCharacter) {
        // 添加到背包
        const success = addItem(product)
        if (success) {
          setCharacterEmotion('happy')
          setReceivedProduct(product)
          logAction({ type: 'drop_success', productId: product.id })
          setTimeout(() => setReceivedProduct(null), 2000)
        } else {
          setCharacterEmotion('surprised')
          logAction({
            type: 'drop_reject',
            productId: product.id,
            details: { reason: 'backpack_full' },
          })
        }
      }
      // 清除浮动商品
      setFloatingProduct(null)
      // 移除全局事件
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }, [addItem, logAction, setCharacterEmotion, setReceivedProduct])

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      {/* 顶部导航栏 */}
      <header className="absolute inset-x-0 top-0 z-50 flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-foreground">互动广告体验</h1>
          {!demoMode && !isAdActive && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startDemo}
              className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg"
            >
              开始演示
            </motion.button>
          )}
        </div>
        <BackpackPanel
          backpack={backpack}
          totalPoints={totalPoints}
          onRemoveItem={removeItem}
          onClear={clearBackpack}
        />
      </header>

      {/* 主内容区域 */}
      <div className="flex min-h-screen flex-col lg:flex-row">
        {/* 视频区域 */}
        <div className="relative flex-1 lg:w-2/3">
          <VideoPlayer
            src = "/video.mp4"
            adTriggerPoints={adTriggerPoints}
            onAdTriggered={handleAdTriggered}
            onAdEnded={handleAdEnded}
            onPause={handlePause}
            onPlay={handlePlay}
            isAdActive={isAdActive}
            className="h-[50vh] w-full lg:h-screen"
          />
          {/* 视频暂停时的覆盖层 - 相对于视频容器定位 */}
          {showPauseOverlay && (
            <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm">
              <img
                src="/screen.jpg"
                alt="暂停画面"
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* 关闭按钮 */}
              <button
                onClick={() => setShowPauseOverlay(false)}
                className="absolute top-2 right-2 z-30 bg-black/50 text-white rounded-full w-8 h-8"
              >
                ✕
              </button>
              {/* 热点按钮 */}
              <button
                onClick={(e) => {
                  // 关闭覆盖层
                  setShowPauseOverlay(false)
                  // 获取点击坐标
                  const clientX = e.clientX
                  const clientY = e.clientY
                  // 开始浮动拖拽
                  startFloatingDrag({
                    id: 'perfume',
                    name: '香水',
                    image: '/products/perfume.png',
                    price: 299,
                  }, clientX, clientY)
                }}
                className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-yellow-400 rounded-full animate-pulse z-30 shadow-lg"
              >
                💎
              </button>
              {/* 可拖拽的香水卡片 */}
              {showDraggableCard && (
                <div
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', JSON.stringify({
                      id: 'perfume',
                      name: '香水',
                      image: '/products/perfume.png'
                    }))
                  }}
                  className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-32 bg-white rounded-xl p-2 cursor-grab z-40 shadow-lg"
                >
                  <img src="/products/perfume.png" alt="香水" className="w-full" />
                  <p className="text-center text-sm">香水</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 互动区域 */}
        <div className="relative flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-background to-secondary/30 p-6 lg:w-1/3">
          {/* 小人角色 */}
          <div className="relative mb-8">
            <Character
              ref={characterRef}
              emotion={characterEmotion}
              isReceiving={isDraggingProduct}
              receivedProduct={receivedProduct}
            />

            {/* 拖拽提示 */}
            <AnimatePresence>
              {isDraggingProduct && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute -inset-8 rounded-full border-4 border-dashed border-primary/50"
                />
              )}
            </AnimatePresence>
          </div>

          {/* 商品展示区 */}
          <AnimatePresence mode="wait">
            {isAdActive && currentProducts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                className="w-full max-w-md"
              >
                <div className="mb-4 text-center">
                  <h2 className="text-lg font-semibold text-foreground">
                    拖拽商品送给小人
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    收集喜欢的商品，积累积分
                  </p>
                </div>
                <ProductShowcase
                  products={currentProducts}
                  onProductDragStart={handleProductDragStart}
                  onProductDragEnd={handleProductDragEnd}
                  className="rounded-2xl bg-card/50 backdrop-blur-sm"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* 非广告时的提示 */}
          {!isAdActive && !demoMode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <p className="text-muted-foreground">
                播放视频，在广告时间点会出现互动商品
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                或者点击"开始演示"直接体验
              </p>
            </motion.div>
          )}

          {/* 背包迷你预览 */}
          {backpack.items.length > 0 && (
            <div className="absolute bottom-6 left-6 right-6">
              <BackpackMini backpack={backpack} totalPoints={totalPoints} />
            </div>
          )}
        </div>
      </div>

      {/* 拖拽中的商品跟随指示器 */}
      <AnimatePresence>
        {isDraggingProduct && draggedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center pb-4"
          >
            <div className="rounded-full bg-primary/90 px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg backdrop-blur-sm">
              将 {draggedProduct.name} 拖到小人身上
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 跟随鼠标的浮动商品卡片 */}
      {floatingProduct && (
        <div
          className="fixed z-[100] pointer-events-none"
          style={{ left: floatingPos.x - 40, top: floatingPos.y - 40, width: '80px' }}
        >
          <div className="bg-white rounded-xl p-2 shadow-2xl cursor-grabbing">
            <img src={floatingProduct.image} alt={floatingProduct.name} className="w-full" />
            <p className="text-center text-sm">{floatingProduct.name}</p>
          </div>
        </div>
      )}
      
    </main>
  )
}
