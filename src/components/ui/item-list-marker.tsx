import { cva, type VariantProps } from 'class-variance-authority'

const itemListMarkerVariants = cva('shrink-0', {
  variants: {
    highlight: {
      none: '',
      'peer-checked': 'peer-checked:text-stock-warning-text',
    },
  },
  defaultVariants: {
    highlight: 'none',
  },
})

type ItemListMarkerProps = VariantProps<typeof itemListMarkerVariants>

const ItemListMarker = ({ highlight }: ItemListMarkerProps) => (
  <span aria-hidden="true" className={itemListMarkerVariants({ highlight })}>
    {'>'}
  </span>
)

export { ItemListMarker }
