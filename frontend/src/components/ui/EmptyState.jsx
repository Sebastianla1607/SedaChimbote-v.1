export default function EmptyState({ icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4 card bg-slate-900/20 border-slate-800/40 backdrop-blur-sm max-w-md mx-auto">
      <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mb-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
        {icon}
      </div>
      <h3 className="text-slate-200 font-extrabold text-sm tracking-wide uppercase">{title}</h3>
      {description && <p className="text-slate-400 text-xs mt-2 leading-relaxed">{description}</p>}
    </div>
  )
}