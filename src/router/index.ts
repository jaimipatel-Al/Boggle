import { createRouter, createWebHistory } from 'vue-router'
import BoggleView from '@/views/BoggleView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'boggle',
      component: BoggleView,
    },
  ],
})

export default router
