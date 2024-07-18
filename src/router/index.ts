import { createRouter, createWebHistory } from 'vue-router'
import { useLocalStorage } from '@vueuse/core'
import HomeView from '../views/HomeView.vue'
import SetConfigView from '../views/SetConfigView.vue'
import { useConfig } from '@/composition/useConfig'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',

      component: HomeView,
    },
    {
      path: '/setting',
      name: 'setting',
      component: SetConfigView,
    },
  ],
})

router.beforeEach(async (to) => {
  const s3Config = useConfig()
  const isAuthenticated = s3Config.value.region
    && s3Config.value.accessKeyId
    && s3Config.value.secretAccessKey
    && s3Config.value.bucket
    && s3Config.value.distributions
  if (
    // 检查用户是否已登录
    !isAuthenticated && to.name !== 'setting'
  ) {
    // 将用户重定向到登录页面
    return { name: 'setting', query: to.query }
  }
})
export default router
