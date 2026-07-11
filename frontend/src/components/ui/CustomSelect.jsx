import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

export default function CustomSelect({ value, onChange, options, placeholder, icon }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find(o => o.value === value)

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 appearance-none bg-slate-900/60 border border-slate-700/50 rounded-full px-4 py-2 text-xs font-bold text-slate-300 focus:outline-none hover:bg-slate-800 transition shadow-inner min-w-[180px] justify-between"
      >
        <span className="flex items-center gap-1.5">
          {icon && <span>{icon}</span>}
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full mt-2 w-full bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.6)] py-2 z-[9999] overflow-hidden">
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            <button
              className={`w-full text-left px-4 py-2.5 text-xs font-bold transition hover:bg-blue-600/20 hover:text-blue-400 ${!value ? 'text-blue-400 bg-blue-600/10' : 'text-slate-400'}`}
              onClick={() => { onChange(''); setOpen(false) }}
            >
              {placeholder}
            </button>
            {options.map((opt) => (
              <button
                key={opt.value}
                className={`w-full text-left px-4 py-2.5 text-xs font-bold transition hover:bg-blue-600/20 hover:text-blue-400 ${value === opt.value ? 'text-blue-400 bg-blue-600/10' : 'text-slate-300'}`}
                onClick={() => { onChange(opt.value); setOpen(false) }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
