import { clsx } from 'clsx'

interface ItemListMarkerProps {
  readonly className?: string
}

const ItemListMarker = ({ className }: ItemListMarkerProps) => (
  <span aria-hidden="true" className={clsx('shrink-0', className)}>
    {'>'}
  </span>
)

export { ItemListMarker }
