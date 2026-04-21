'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Backpack, BackpackItem, Product, UserAction } from '@/lib/types'

const BACKPACK_STORAGE_KEY = 'interactive-ad-backpack'
const ACTIONS_STORAGE_KEY = 'interactive-ad-actions'
const MAX_CAPACITY = 50

interface UseBackpackReturn {
  backpack: Backpack
  addItem: (product: Product) => boolean
  removeItem: (productId: string) => void
  hasItem: (productId: string) => boolean
  getItemCount: (productId: string) => number
  clearBackpack: () => void
  totalPoints: number
  isFull: boolean
  userActions: UserAction[]
  logAction: (action: Omit<UserAction, 'timestamp'>) => void
}

export function useBackpack(): UseBackpackReturn {
  const [backpack, setBackpack] = useState<Backpack>({
    items: [],
    maxCapacity: MAX_CAPACITY,
  })
  const [userActions, setUserActions] = useState<UserAction[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  // 从 localStorage 加载数据
  useEffect(() => {
    if (typeof window === 'undefined') return

    const savedBackpack = localStorage.getItem(BACKPACK_STORAGE_KEY)
    const savedActions = localStorage.getItem(ACTIONS_STORAGE_KEY)

    if (savedBackpack) {
      try {
        setBackpack(JSON.parse(savedBackpack))
      } catch {
        // 忽略解析错误
      }
    }

    if (savedActions) {
      try {
        setUserActions(JSON.parse(savedActions))
      } catch {
        // 忽略解析错误
      }
    }

    setIsInitialized(true)
  }, [])

  // 保存到 localStorage
  useEffect(() => {
    if (!isInitialized || typeof window === 'undefined') return
    localStorage.setItem(BACKPACK_STORAGE_KEY, JSON.stringify(backpack))
  }, [backpack, isInitialized])

  useEffect(() => {
    if (!isInitialized || typeof window === 'undefined') return
    localStorage.setItem(ACTIONS_STORAGE_KEY, JSON.stringify(userActions))
  }, [userActions, isInitialized])

  // 添加商品到背包
  const addItem = useCallback((product: Product): boolean => {
    let success = false

    setBackpack(prev => {
      const existingItem = prev.items.find(item => item.product.id === product.id)

      if (existingItem) {
        // 已存在，增加数量
        success = true
        return {
          ...prev,
          items: prev.items.map(item =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        }
      }

      // 检查容量
      if (prev.items.length >= prev.maxCapacity) {
        success = false
        return prev
      }

      // 添加新商品
      success = true
      return {
        ...prev,
        items: [
          ...prev.items,
          {
            product,
            acquiredAt: Date.now(),
            quantity: 1,
          },
        ],
      }
    })

    return success
  }, [])

  // 移除商品
  const removeItem = useCallback((productId: string) => {
    setBackpack(prev => ({
      ...prev,
      items: prev.items.filter(item => item.product.id !== productId),
    }))
  }, [])

  // 检查是否拥有某商品
  const hasItem = useCallback((productId: string): boolean => {
    return backpack.items.some(item => item.product.id === productId)
  }, [backpack.items])

  // 获取某商品数量
  const getItemCount = useCallback((productId: string): number => {
    const item = backpack.items.find(item => item.product.id === productId)
    return item?.quantity ?? 0
  }, [backpack.items])

  // 清空背包
  const clearBackpack = useCallback(() => {
    setBackpack({ items: [], maxCapacity: MAX_CAPACITY })
  }, [])

  // 计算总积分
  const totalPoints = backpack.items.reduce(
    (sum, item) => sum + item.product.points * item.quantity,
    0
  )

  // 记录用户行为
  const logAction = useCallback((action: Omit<UserAction, 'timestamp'>) => {
    setUserActions(prev => [
      ...prev,
      { ...action, timestamp: Date.now() },
    ])
  }, [])

  return {
    backpack,
    addItem,
    removeItem,
    hasItem,
    getItemCount,
    clearBackpack,
    totalPoints,
    isFull: backpack.items.length >= backpack.maxCapacity,
    userActions,
    logAction,
  }
}
