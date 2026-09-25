import { pageLead, pageTitle } from '@/app/styles/class-names'

interface AlreadyStockedProps {
  name: string
}
const AlreadyStocked = ({ name }: AlreadyStockedProps) => {
  return (
    <>
      <h1 className={pageTitle}>
        Already stocked
      </h1>
      <p className={pageLead}>
        {name}
      </p>
    </>
  )
}

export { AlreadyStocked }
