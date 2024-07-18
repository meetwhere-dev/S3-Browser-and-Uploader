<script setup lang="ts">
import { reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useConfig } from '@/composition/useConfig'

const s3Config = useConfig()

const _s3Config = reactive({
  region: s3Config.value.region, // 替换为你的S3桶所在的区域
  accessKeyId: s3Config.value.accessKeyId, // 替换为你的访问密钥ID
  secretAccessKey: s3Config.value.secretAccessKey, // 替换为你的秘密访问密钥
  bucket: s3Config.value.bucket, // 替换为你的S3桶名称
  distributions: s3Config.value.distributions, // 替换为你的CDN分发配置
})

const router = useRouter()
const route = useRoute()
function save() {
  s3Config.value = _s3Config
  router.push({ name: 'home', query: { path: route.query.path } })
}
</script>

<template>
  <main class="flex flex-col gap-3 p-6">
    <h1>
      填写S3配置 请联系开发人员
    </h1>
    <Input v-model="_s3Config.region" placeholder="region" class="w-full" />
    <Input v-model="_s3Config.accessKeyId" placeholder="accessKeyId" class="w-full" />
    <Input v-model="_s3Config.secretAccessKey" placeholder="secretAccessKey" class="w-full" />
    <Input v-model="_s3Config.bucket" placeholder="bucket" class="w-full" />
    <Input v-model="_s3Config.distributions" placeholder="distributions split by ," class="w-full" />

    <Button @click="save">
      Save
    </Button>
  </main>
</template>

<style scoped>
</style>
