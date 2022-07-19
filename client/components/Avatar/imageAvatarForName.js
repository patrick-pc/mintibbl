const colors = [
  '#FC5C54',
  '#FFD95A',
  '#E95D72',
  '#6A87C8',
  '#5FD0F3',
  '#75C06B',
  '#FFDD86',
  '#5FC6D4',
  '#FF949A',
  '#FF8024',
  '#9BA1A4',
  '#EC66FF',
  '#FF8CBC',
  '#FF9A23',
  '#C5DADB',
  '#A8CE63',
  '#71ABFF',
  '#FFE279',
  '#B6B1B6',
  '#FF6780',
  '#A575FF',
  '#4D82FF',
  '#FFB35A',
]

const avatars = [
  { color: colors[0], image: '/img/bear.png' },
  { color: colors[0], image: '/img/bunny.png' },
  { color: colors[0], image: '/img/cat.png' },
  { color: colors[0], image: '/img/chicken.png' },
  { color: colors[0], image: '/img/cow.png' },
  { color: colors[0], image: '/img/frog.png' },
  { color: colors[0], image: '/img/ghost.png' },
  { color: colors[0], image: '/img/horse.png' },
  { color: colors[0], image: '/img/kitty.png' },
  { color: colors[0], image: '/img/koala.png' },
  { color: colors[0], image: '/img/monkey.png' },
  { color: colors[0], image: '/img/monster.png' },
  { color: colors[0], image: '/img/octopus.png' },
  { color: colors[0], image: '/img/poop.png' },
  { color: colors[0], image: '/img/rat.png' },
  { color: colors[0], image: '/img/skull.png' },
  { color: colors[0], image: '/img/snail.png' },
  { color: colors[0], image: '/img/snake.png' },
  { color: colors[0], image: '/img/whale.png' },
]

function hashCode(text) {
  let hash = 0
  if (text.length === 0) return hash
  for (let i = 0; i < text.length; i++) {
    const chr = text.charCodeAt(i)
    hash = (hash << 5) - hash + chr
    hash |= 0
  }
  return hash
}

export function imageAvatarForName(name) {
  const resolvedName = typeof name === 'string' ? name : ''
  const avatarIndex = Math.abs(
    hashCode(resolvedName.toLowerCase()) % avatars.length
  )
  return avatars[avatarIndex ?? 0]
}
