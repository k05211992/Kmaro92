interface CardProps {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={['rounded-xl border border-gray-200 bg-white shadow-sm', className].join(' ')}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }: CardProps) {
  return (
    <div className={['px-5 py-4 border-b border-gray-100', className].join(' ')}>{children}</div>
  )
}

export function CardBody({ children, className = '' }: CardProps) {
  return <div className={['px-5 py-4', className].join(' ')}>{children}</div>
}
