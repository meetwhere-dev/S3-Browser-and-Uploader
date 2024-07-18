import { useLocalStorage } from '@vueuse/core'

export function useConfig() {
  return useLocalStorage('s3Config', {
    region: '', // 替换为你的S3桶所在的区域
    accessKeyId: '', // 替换为你的访问密钥ID
    secretAccessKey: '', // 替换为你的秘密访问密钥
    bucket: '', // 替换为你的S3桶名称
    distributions: '', // 替换为你的CloudFront分发ID
  })
}
