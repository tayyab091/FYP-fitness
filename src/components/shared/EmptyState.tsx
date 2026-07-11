export function EmptyState({ icon, title, description, action }: {
  icon: string
  title: string
  description: string
  action?: { label: string; href: string }
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-[#a0a0a0] text-sm max-w-sm mb-6">{description}</p>
      {action && (
        <a href={action.href} className="btn-accent px-6 py-3 text-sm font-bold">
          {action.label}
        </a>
      )}
    </div>
  )
}
