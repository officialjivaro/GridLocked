import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import GameView from '../views/GameView.vue'
import ResultsView from '../views/ResultsView.vue'

// Crossword Route | Lazy-loads the standalone crossword without changing existing routes
const CrosswordView = () => import('../features/crossword/views/CrosswordView.vue')

const routes = [
  { path: '/', component: HomeView },
  { path: '/game', component: GameView },
  { path: '/results', component: ResultsView },
  {
    path: '/crossword',
    name: 'crossword',
    component: CrosswordView,
    meta: { standalone: true }
  }
]

export default createRouter({
  history: createWebHashHistory(),
  routes
})
