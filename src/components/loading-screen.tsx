import { clsx } from 'clsx'
import Image from 'next/image'

const markImageClassName = clsx(
  'absolute',
  'inset-0',
  'block',
  'size-full',
  'max-w-none',
)

const LoadingScreen = () => {
  return (
    <div
      className={clsx(
        'fixed',
        'inset-0',
        'z-50',
        'flex',
        'items-center',
        'justify-center',
        'bg-[#181818]',
      )}
      role="status"
      aria-live="polite"
    >
      <div className={clsx('relative', 'h-25', 'w-25')} aria-hidden="true">
        <div
          className={clsx(
            'absolute',
            'top-[42.2px]',
            'left-[42.82px]',
            'h-[15.161px]',
            'w-[13.907px]',
            'animate-loading-inner',
          )}
          data-node-id="500:6096"
        >
          <Image
            alt=""
            className={markImageClassName}
            fill
            priority
            sizes="14px"
            src="/loading/inner.svg"
            unoptimized
          />
        </div>
        <div
          className={clsx(
            'absolute',
            'top-[26.6px]',
            'left-[29.09px]',
            'h-[46.2px]',
            'w-[41.368px]',
            'animate-loading-middle',
          )}
          data-node-id="500:6097"
        >
          <Image
            alt=""
            className={markImageClassName}
            fill
            priority
            sizes="42px"
            src="/loading/middle.svg"
            unoptimized
          />
        </div>
        <div
          className={clsx(
            'absolute',
            'top-2.75',
            'left-4',
            'h-19.5',
            'w-[67.55px]',
            'animate-loading-outer',
          )}
          data-node-id="500:6103"
        >
          <Image
            alt=""
            className={markImageClassName}
            fill
            priority
            sizes="68px"
            src="/loading/outer.svg"
            unoptimized
          />
        </div>
      </div>
      <span className={clsx('sr-only')}>Loading</span>
    </div>
  )
}

export { LoadingScreen }
