import { useRef, useState } from 'react'
import { compressImage } from '../lib/imageCompress'

interface Props {
  url?: string
  onPick: (blob: Blob) => void
  onClear?: () => void
  label?: string
  small?: boolean
}

export function PhotoInput({ url, onPick, onClear, label = 'Foto', small }: Props) {
  const ref = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  return (
    <div className={`photo-input${small ? ' photo-input--small' : ''}`}>
      <button type="button" className="photo-input__drop" onClick={() => ref.current?.click()} aria-label={`${label}: elegir imagen`}>
        {url ? <img src={url} alt="" /> : <span>{busy ? 'Procesando…' : small ? '+ foto' : '+ Subir foto'}</span>}
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (!f) return
          setBusy(true)
          setErr(null)
          try {
            onPick(await compressImage(f))
          } catch {
            setErr('No se pudo leer esa imagen.')
          } finally {
            setBusy(false)
          }
        }}
      />
      {url && onClear && (
        <button type="button" className="link small" onClick={onClear}>
          quitar foto
        </button>
      )}
      {err && <p className="error small">{err}</p>}
    </div>
  )
}
