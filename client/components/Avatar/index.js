import { useMemo } from 'react'
import { useEnsAvatar } from 'wagmi'
import { imageAvatarForName } from './imageAvatarForName'

const Avatar = ({ name, address, size }) => {
  const { data: ensAvatar } = useEnsAvatar({
    addressOrName: address,
    chainId: 1,
  })
  const { color: backgroundColor, image } = useMemo(
    () => imageAvatarForName(name),
    [name]
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
    <div className='flex flex-shrink-0 items-center justify-center overflow-hidden'>
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
