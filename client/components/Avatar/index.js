import { useMemo } from 'react'
import { useEnsAvatar } from 'wagmi'
import { imageAvatarForName } from './imageAvatarForName'

const Avatar = ({ name, address, size, isDrawer }) => {
  const { data: ensAvatar } = useEnsAvatar({
    addressOrName: address,
  })
  const { color: backgroundColor, image } = useMemo(
    () => imageAvatarForName(name),
    [name]
  )

  return ensAvatar ? (
    <div
      className={`bg-cover bg-center rounded-full ${
        isDrawer && 'ring ring-primary ring-offset-base-100 ring-offset-2'
      }`}
      style={{
        backgroundImage: `url(${ensAvatar})`,
        height: size,
        width: size,
      }}
    />
  ) : (
    <div
      className={`flex flex-shrink-0 items-center justify-center overflow-hidden ${
        isDrawer && 'ring ring-primary ring-offset-base-100 ring-offset-2'
      }`}
    >
      <img
        src={image}
        style={{
          height: size,
          width: size,
        }}
      />
    </div>
  )
}

export default Avatar
