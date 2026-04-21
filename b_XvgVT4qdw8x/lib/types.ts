// 商品相关类型
export interface Product {
  id: string
  name: string
  brand: Brand
  category: ProductCategory
  image: string
  description: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  points: number
}

export type Brand = 'nike' | 'apple' | 'dior' | 'mcdonalds' | 'cocacola'

export type ProductCategory = 'clothing' | 'electronics' | 'luxury' | 'food' | 'beverage'

// 小人情绪状态
export type CharacterEmotion = 'expectant' | 'happy' | 'surprised' | 'disgusted' | 'bored'

// 背包相关类型
export interface BackpackItem {
  product: Product
  acquiredAt: number
  quantity: number
}

export interface Backpack {
  items: BackpackItem[]
  maxCapacity: number
}

// 广告时间点
export interface AdTriggerPoint {
  time: number // 秒
  products: Product[]
  duration: number // 展示持续时间
}

// 用户行为记录
export interface UserAction {
  type: 'drag_start' | 'drag_end' | 'drop_success' | 'drop_reject' | 'video_pause' | 'video_resume'
  productId?: string
  timestamp: number
  details?: Record<string, unknown>
}

// 应用状态
export interface AppState {
  backpack: Backpack
  userActions: UserAction[]
  currentEmotion: CharacterEmotion
  totalPoints: number
}
