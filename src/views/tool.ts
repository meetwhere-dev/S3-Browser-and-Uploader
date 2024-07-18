// import AWS from 'aws-sdk'
import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront'
import { useConfig } from '@/composition/useConfig'

const s3Config = useConfig()

const distributions = [
  'EZR1UZRJKWXEN',
  'ED0CJB0TNUQQ2',
]

export async function updateS3Cache(paths: string[]) {
  const cloudfront = new CloudFrontClient({
    region: s3Config.value?.region, // 替换为你的S3桶所在的区域
    credentials: {
      accessKeyId: s3Config.value?.accessKeyId, // 替换为你的访问密钥ID
      secretAccessKey: s3Config.value?.secretAccessKey, // 替换为你的秘密访问密钥
    },
  })
  distributions.forEach(id => invalidationFunc(id))
  function invalidationFunc(distributionId: string) {
    const params = {
      DistributionId: distributionId,
      InvalidationBatch: {
        CallerReference: `${Date.now() + 10000}`,
        Paths: {
          Quantity: paths.length,
          Items: paths,
        },
      },
    }
    const command = new CreateInvalidationCommand(params)
    cloudfront.send(command)
  }
}
