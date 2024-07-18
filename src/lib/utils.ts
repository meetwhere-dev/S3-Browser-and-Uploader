import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 获取路径的上层目录
 * @param path - 需要解析的路径
 * @returns 上层目录路径，如果已经是顶层则返回空字符串
 */
export function getParentDirectory(path: string): string {
  // 移除末尾的斜杠
  path = path.replace(/\/$/, '')

  // 找到最后一个斜杠的位置
  const lastSlashIndex = path.lastIndexOf('/')

  // 如果没有斜杠，表示已经是顶层目录
  if (lastSlashIndex === -1) {
    return ''
  }

  // 返回上层目录
  return path.substring(0, lastSlashIndex + 1)
}

export function sizeFormat(size: number) {
  if (size < 1024) {
    return `${size}B`
  }
  else if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(2)}KB`
  }
  else if (size < 1024 * 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(2)}MB`
  }
}
