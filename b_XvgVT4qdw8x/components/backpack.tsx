'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Backpack as BackpackIcon, X, Filter, Trash2, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import type { Backpack as BackpackType, Brand } from '@/lib/types'
import { ProductIcon, BrandLogo } from './product-icons'
import { brandNames, getRarityColor } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

interface BackpackProps {
  backpack: BackpackType
  totalPoints: number
  onRemoveItem: (productId: string) => void
  onClear: () => void
  className?: string
}

export function BackpackPanel({
  backpack,
  totalPoints,
  onRemoveItem,
  onClear,
  className,
}: BackpackProps) {
  const [selectedBrand, setSelectedBrand] = useState<Brand | 'all'>('all')
  const [isOpen, setIsOpen] = useState(false)

  // 按品牌筛选
  const filteredItems = useMemo(() => {
    if (selectedBrand === 'all') return backpack.items
    return backpack.items.filter(item => item.product.brand === selectedBrand)
  }, [backpack.items, selectedBrand])

  // 统计各品牌数量
  const brandCounts = useMemo(() => {
    const counts: Partial<Record<Brand, number>> = {}
    backpack.items.forEach(item => {
      counts[item.product.brand] = (counts[item.product.brand] || 0) + item.quantity
    })
    return counts
  }, [backpack.items])

  // 获取所有品牌
  const availableBrands = Object.keys(brandCounts) as Brand[]

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="lg"
          className={cn(
            'group relative gap-2 rounded-full border-2 border-primary/50 bg-card/80 backdrop-blur-sm',
            className
          )}
        >
          <BackpackIcon className="h-5 w-5 text-primary" />
          <span className="font-medium">背包</span>
          {backpack.items.length > 0 && (
            <Badge
              variant="default"
              className="absolute -right-2 -top-2 h-6 min-w-6 rounded-full bg-accent text-accent-foreground"
            >
              {backpack.items.reduce((sum, item) => sum + item.quantity, 0)}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader className="space-y-1">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <BackpackIcon className="h-6 w-6 text-primary" />
            我的背包
          </SheetTitle>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {backpack.items.length} / {backpack.maxCapacity} 物品
            </span>
            <div className="flex items-center gap-1 text-accent">
              <Star className="h-4 w-4 fill-accent" />
              <span className="font-medium">{totalPoints} 积分</span>
            </div>
          </div>
        </SheetHeader>

        {/* 品牌筛选 */}
        {availableBrands.length > 1 && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant={selectedBrand === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedBrand('all')}
              className="rounded-full"
            >
              <Filter className="mr-1 h-3 w-3" />
              全部
            </Button>
            {availableBrands.map(brand => (
              <Button
                key={brand}
                variant={selectedBrand === brand ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedBrand(brand)}
                className="gap-1.5 rounded-full"
              >
                <BrandLogo brand={brand} size={14} />
                {brandNames[brand]}
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {brandCounts[brand]}
                </Badge>
              </Button>
            ))}
          </div>
        )}

        {/* 物品列表 */}
        <ScrollArea className="mt-4 h-[calc(100vh-280px)]">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BackpackIcon className="mb-4 h-16 w-16 text-muted-foreground/30" />
              <p className="text-muted-foreground">
                {selectedBrand === 'all'
                  ? '背包是空的，去收集一些商品吧！'
                  : `还没有 ${brandNames[selectedBrand as Brand]} 的商品`}
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="space-y-3 pr-4">
                {filteredItems.map(item => (
                  <motion.div
                    key={item.product.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="group relative overflow-hidden rounded-xl border bg-card p-3"
                  >
                    {/* 稀有度条 */}
                    <div
                      className="absolute inset-y-0 left-0 w-1"
                      style={{ backgroundColor: getRarityColor(item.product.rarity) }}
                    />

                    <div className="flex items-center gap-3 pl-2">
                      <ProductIcon productId={item.product.id} size={48} />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <BrandLogo brand={item.product.brand} size={14} />
                          <span className="text-xs text-muted-foreground">
                            {brandNames[item.product.brand]}
                          </span>
                        </div>
                        <h4 className="truncate font-medium text-foreground">
                          {item.product.name}
                        </h4>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className="text-xs"
                            style={{
                              backgroundColor: getRarityColor(item.product.rarity) + '20',
                              color: getRarityColor(item.product.rarity),
                            }}
                          >
                            {getRarityLabel(item.product.rarity)}
                          </Badge>
                          <span className="text-xs text-accent">
                            +{item.product.points * item.quantity} 分
                          </span>
                          {item.quantity > 1 && (
                            <Badge variant="outline" className="text-xs">
                              x{item.quantity}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemoveItem(item.product.id)}
                        className="h-8 w-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </ScrollArea>

        {/* 底部操作 */}
        {backpack.items.length > 0 && (
          <div className="mt-4 flex items-center justify-between border-t pt-4">
            <div className="text-sm text-muted-foreground">
              共 {backpack.items.reduce((sum, item) => sum + item.quantity, 0)} 件商品
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={onClear}
              className="gap-1"
            >
              <Trash2 className="h-4 w-4" />
              清空背包
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

// 迷你背包预览（显示在主界面）
export function BackpackMini({
  backpack,
  totalPoints,
  onClick,
  className,
}: {
  backpack: BackpackType
  totalPoints: number
  onClick?: () => void
  className?: string
}) {
  const recentItems = backpack.items.slice(-3).reverse()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex items-center gap-3 rounded-2xl border bg-card/90 p-3 shadow-lg backdrop-blur-sm',
        className
      )}
    >
      {/* 最近获得的商品 */}
      <div className="flex -space-x-2">
        {recentItems.length > 0 ? (
          recentItems.map((item, index) => (
            <motion.div
              key={item.product.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="relative h-10 w-10 overflow-hidden rounded-lg border-2 border-background bg-card"
            >
              <ProductIcon productId={item.product.id} size={40} />
            </motion.div>
          ))
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30">
            <BackpackIcon className="h-5 w-5 text-muted-foreground/50" />
          </div>
        )}
      </div>

      {/* 统计信息 */}
      <div className="flex flex-col">
        <span className="text-sm font-medium text-foreground">
          {backpack.items.reduce((sum, item) => sum + item.quantity, 0)} 件物品
        </span>
        <span className="flex items-center gap-1 text-xs text-accent">
          <Star className="h-3 w-3 fill-accent" />
          {totalPoints} 积分
        </span>
      </div>

      {/* 打开背包按钮 */}
      {onClick && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClick}
          className="ml-auto"
        >
          查看
        </Button>
      )}
    </motion.div>
  )
}

function getRarityLabel(rarity: 'common' | 'rare' | 'epic' | 'legendary'): string {
  const labels = {
    common: '普通',
    rare: '稀有',
    epic: '史诗',
    legendary: '传说',
  }
  return labels[rarity]
}
