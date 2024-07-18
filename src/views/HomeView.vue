<script setup lang="ts">
import { useLocalStorage } from '@vueuse/core'

import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ListObjectsV2Command, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

import { Dashboard } from '@uppy/vue'
import Uppy from '@uppy/core'
import { updateS3Cache } from './tool'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import IconFile from '@/components/icons/IconFile.vue'
import IconLoading from '@/components/icons/IconLoading.vue'

// Don't forget the CSS: core and UI components + plugins you are using
import '@uppy/core/dist/style.css'
import '@uppy/dashboard/dist/style.css'
import { useConfig } from '@/composition/useConfig'
import { getParentDirectory, sizeFormat } from '@/lib/utils'

const uppy = new Uppy({
  autoProceed: false,
  restrictions: {
    // maxFileSize: 10485760, // 10 MB
    // maxNumberOfFiles: 3,
    minNumberOfFiles: 1,
  },
})

const s3Config = useConfig()

const s3 = new S3Client({
  region: s3Config.value.region, // 替换为你的S3桶所在的区域
  credentials: {
    accessKeyId: s3Config.value.accessKeyId, // 替换为你的访问密钥ID
    secretAccessKey: s3Config.value.secretAccessKey, // 替换为你的秘密访问密钥
  },
})

interface Contents {
  key: string
  size: number
  lastModified: Date
}

const allContents = ref<Contents[]>([])
const commonPrefixes = ref<string[]>([])

const route = useRoute()

const prefix = ref<string>((route.query.path as string) || '')

const prifixHistory = useLocalStorage<string[]>('history', [])
function clearPrifixHistory() {
  prifixHistory.value = []
}

const continuationToken = ref<string>()

const browserLoadding = ref(false)

watch(() => route.query, () => {
  prefix.value = (route.query?.path as string) || ''
  if (prefix.value) {
    prifixHistory.value = [...(new Set([...prifixHistory.value, prefix.value]))]
  }
  getS3Objects()
}, { immediate: true })

async function getS3Objects() {
  try {
    browserLoadding.value = true
    const params = {
      Bucket: s3Config.value.bucket, // 替换为你的S3桶的名称
      Prefix: prefix.value, // 如果你想要列出特定前缀下的对象，可以设置此字段
      Delimiter: '/', // 只获取当前目录下的一层文件
      ContinuationToken: continuationToken.value,
    }

    const command = new ListObjectsV2Command(params)
    const data = await s3.send(command)
    const contents = data.Contents?.map(obj => ({
      key: obj.Key!,
      size: obj.Size!,
      lastModified: obj.LastModified!,
    })) || []
    commonPrefixes.value = data.CommonPrefixes?.map(obj => obj.Prefix!) || []
    allContents.value = contents
  }
  catch (err) {
    console.error('Error', err)
  }
  browserLoadding.value = false
}

async function uploadToS3(file: any) {
  const params: any = {
    Bucket: s3Config.value.bucket,
    Key: `${prefix.value}${file.data.relativePath || file.data.name}`,
    Body: file.data,
    ContentType: file.type,
    ACL: 'public-read',
  }

  try {
    const command = new PutObjectCommand(params)
    await s3.send(command)
  }
  catch (err) {
    console.error('Upload error:', err)
  }
}

const isUploading = ref(false)
async function upload() {
  isUploading.value = true
  const allFiles = uppy.getFiles()
  if (uppy && allFiles.length) {
    await Promise.all(allFiles.map(file => uploadToS3(file)))
    const invalidationArr = allFiles.map(file => `/${prefix.value}${file.meta.relativePath || file.meta.name}`)
    await updateS3Cache(invalidationArr)
    uppy.clear()
  }
  getS3Objects()
  isUploading.value = false
}
</script>

<template>
  <main class="p-6">
    <header class="flex flex-col gap-[1em] mb-[1em]">
      <h1 class="text-center text-[2em] py-[1em]">
        S3 Browser and Uploader
      </h1>
      <div v-if="prifixHistory?.length" class="flex flex-wrap gap-[1em] w-full">
        <p>Prefix History: </p>
        <RouterLink
          v-for="item in prifixHistory"
          :key="item"
          :to="{
            path: '/',
            query: {
              path: item,
            },
          }"
          class="bg-gray-200 px-[0.5em] py-[0.2em] rounded-md cursor-pointer"
        >
          {{ item }}
        </RouterLink>

        <Button @click="clearPrifixHistory">
          Clear
        </Button>
      </div>
      <div flex="~" class="relative w-full">
        <Input v-model="prefix" class="w-full" />
        <RouterLink
          :to="{ path: '/', query: { path: prefix } }"
          class="block cursor-pointer even:bg-slate-200 hover:bg-blue-200"
        >
          <Button class="absolute top-0 right-[0.5em]">
            Prefix
          </Button>
        </RouterLink>
      </div>
    </header>

    <div class="flex justify-center ">
      <div class="relative">
        <Dashboard :uppy="uppy" />
        <Button class="absolute bottom-3 left-3" @click="upload">
          Upload
        </Button>
        <div v-if="isUploading" class="absolute z-9999 top-0 left-0 w-full h-full flex justify-center items-center bg-gray-300 bg-opacity-80">
          <IconLoading />
        </div>
      </div>
    </div>

    <h2 class="mt-[2em]">
      Files
    </h2>

    <div class="border relative">
      <RouterLink
        :to="{ path: '/', query: { path: '' } }"
        class="block cursor-pointer even:bg-slate-200 hover:bg-blue-200"
      >
        <IconFile />
        root
      </RouterLink>
      <RouterLink
        :to="{ path: '/', query: { path: getParentDirectory(prefix) } }"
        class="block cursor-pointer even:bg-slate-200 hover:bg-blue-200"
      >
        <IconFile />
        ...
      </RouterLink>
      <div class="">
        <div
          v-for="prefix in commonPrefixes" :key="prefix"
        >
          <RouterLink
            :to="{ path: '/', query: { path: prefix } }"
            class="block cursor-pointer even:bg-slate-200 hover:bg-blue-200"
          >
            <IconFile />
            {{ prefix }}
          </RouterLink>
        </div>
      </div>
      <div class="">
        <a
          v-for="{ key, size, lastModified } in allContents" :key="key"
          target="_blank" :href="`https://s.femometer.com/${key}`"
          class="grid grid-cols-3 cursor-pointer odd:bg-white even:bg-slate-200 hover:bg-blue-200"
        >
          <div>
            {{ key }}
          </div>
          <div class="text-right pr-[2em]">
            {{ sizeFormat(size) }}
          </div>
          <div>{{ lastModified }}</div>
        </a>
      </div>
      <div v-if="browserLoadding" class="absolute z-9999 top-0 left-0 w-full h-full flex justify-center items-center bg-gray-300 bg-opacity-80">
        <IconLoading />
      </div>
    </div>
  </main>
</template>

<style scoped>
:deep(.uppy-Dashboard-progressindicators) {
  display: none;
}
</style>
