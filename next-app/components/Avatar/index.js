import { useMemo } from 'react'
import { useEnsAvatar } from 'wagmi'
import { emojiAvatarForAddress } from './emojiAvatarForAddress'

const Avatar = ({ address, size }) => {
  const { data: ensAvatar } = useEnsAvatar({
    addressOrName: address,
  })
  const { color: backgroundColor, emoji } = useMemo(
    () => emojiAvatarForAddress(address),
    [address]
  )

  return ensAvatar ? (
    <div
      className='bg-cover bg-center rounded-full'
      style={{
        backgroundImage: `url(${ensAvatar})`,
        height: size,
        width: size,
      }}
    />
  ) : (
    <div
      className='flex items-center justify-center overflow-hidden rounded-full'
      style={{
        ...(!ensAvatar && { backgroundColor }),
        height: size,
        width: size,
        fontSize: size / 2,
      }}
    >
      {emoji}
    </div>
  )
}

export default Avatar
