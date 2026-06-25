// Topic Catalog | Defines the selectable crossword topics and their presentation
export const TOPICS = [
  {
    id: 'all',
    label: 'All Topics',
    icon: '✨',
    description: 'A colorful mix from every category.'
  },
  {
    id: 'science',
    label: 'Science',
    icon: '🔬',
    description: 'Space, physics, biology, and Earth science.'
  },
  {
    id: 'nature',
    label: 'Nature',
    icon: '🌿',
    description: 'Animals, landscapes, weather, and living systems.'
  },
  {
    id: 'technology',
    label: 'Technology',
    icon: '💻',
    description: 'Computers, devices, networks, and engineering.'
  },
  {
    id: 'general',
    label: 'General Knowledge',
    icon: '🧠',
    description: 'Everyday facts, shapes, history, and ideas.'
  }
]

export const TOPIC_IDS = TOPICS.filter((topic) => topic.id !== 'all').map((topic) => topic.id)

export function getTopicById(topicId) {
  return TOPICS.find((topic) => topic.id === topicId) ?? TOPICS[0]
}
