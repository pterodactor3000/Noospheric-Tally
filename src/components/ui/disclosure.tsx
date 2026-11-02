'use client'

import { useState, type ReactNode } from 'react'
import { clsx } from 'clsx'

interface DisclosureChevronProps {
  readonly isOpen: boolean
}

interface DisclosureProps {
  readonly title: string
  readonly contentId: string
  readonly children: ReactNode
}

const disclosureMotion = clsx(
  'duration-500',
  'ease-in-out',
  'motion-reduce:transition-none',
)

const disclosureTrigger = clsx(
  'flex',
  'w-full',
  'items-center',
  'justify-between',
  'gap-3',
  'text-left',
  'text-base',
  'leading-7',
)

const DisclosureChevron = ({ isOpen }: DisclosureChevronProps) => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className={clsx(
      'size-5',
      'shrink-0',
      'transition-transform',
      disclosureMotion,
      isOpen && 'rotate-180',
    )}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
)

function Disclosure({ title, contentId, children }: DisclosureProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className={clsx('mt-12', 'flex', 'flex-col')}>
      <h2 className="m-0">
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls={contentId}
          onClick={() => setIsOpen((isCurrentlyOpen) => !isCurrentlyOpen)}
          className={disclosureTrigger}
        >
          {title}
          <DisclosureChevron isOpen={isOpen} />
        </button>
      </h2>
      <div
        className={clsx(
          'grid',
          '-mx-1',
          'transition-[grid-template-rows]',
          disclosureMotion,
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className={clsx('min-h-0', 'overflow-hidden')}>
          <div
            id={contentId}
            inert={!isOpen}
            aria-hidden={!isOpen}
            className={clsx(
              'px-1',
              'pt-4',
              'pb-1',
              'transition-transform',
              disclosureMotion,
              isOpen ? 'translate-y-0' : 'translate-y-3',
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export { Disclosure }
