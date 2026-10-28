import { pageLead, pageTitle } from '@/app/styles/class-names'

interface StockedCountProps {
  name: string
  quantity: number
}

const StockedCount = ({ name, quantity }: StockedCountProps) => {
  return (
    <>
      <h1 className={pageTitle}>
        {name}
      </h1>
      <p className={pageLead}>
        {quantity}
      </p>
    </>
  )
}

export { StockedCount }
