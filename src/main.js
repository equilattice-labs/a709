import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import Home from './views/Home.vue'
import './style.css'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home, meta: { title: 'Good things. On schedule.' } },
    { path: '/create', component: () => import('./views/Create.vue'), meta: { title: 'Create a schedule' } },
    { path: '/locks', component: () => import('./views/Locks.vue'), meta: { title: 'Your workspace' } },
    { path: '/docs', component: () => import('./views/Docs.vue'), meta: { title: 'The field guide' } },
    { path: '/legal', component: () => import('./views/Legal.vue'), meta: { title: 'Testnet terms & privacy' } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior(to, from, saved) { return saved || (to.hash ? { el: to.hash, top: 90, behavior: 'smooth' } : { top: 0 }) },
})
import { brand } from './config/brand'
router.afterEach(to => { document.title = `${to.meta.title} — ${brand.name}` })
createApp(App).use(router).mount('#app')
