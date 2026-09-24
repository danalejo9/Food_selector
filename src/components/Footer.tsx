import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { NavLink } from 'react-router-dom'
import { CodeXml, Smartphone, X } from 'lucide-react'
import { useInstallPrompt } from '../lib/useInstallPrompt'

const AUTHOR = 'Daniel'
const REPO_URL = 'https://github.com/danalejo9/Food_selector'

/** true cuando el service worker ya controla la página (la app funciona sin internet). */
function useOffline(): boolean {
  const [ready, setReady] = useState(() => !!navigator.serviceWorker?.controller)
  useEffect(() => {
    const sw = navigator.serviceWorker
    if (!sw) return
    const on = () => setReady(!!sw.controller)
    sw.addEventListener('controllerchange', on)
    return () => sw.removeEventListener('controllerchange', on)
  }, [])
  return ready
}

export function Footer() {
  const install = useInstallPrompt()
  const offline = useOffline()
  const [help, setHelp] = useState(false)

  return (
    <footer className="footer">
      <div className="footer__grid">
        <section className="footer__about">
          <p className="footer__brand">La Nevera</p>
          <p>Elige lo que tienes y te dice qué puedes cocinar con eso.</p>
          <p className="footer__note">Lo que seleccionas, tus favoritas y tu lista de compras se guardan solo en este dispositivo.</p>
        </section>

        <nav className="footer__col" aria-label="Secciones">
          <h2 className="footer__label">Secciones</h2>
          <NavLink to="/" end>
            Cocina
          </NavLink>
          <NavLink to="/compras">Compras</NavLink>
          <NavLink to="/recetario">Recetario</NavLink>
        </nav>

        <section className="footer__col">
          <h2 className="footer__label">Celular</h2>
          {install.installed ? (
            <p className="footer__muted">App instalada en este dispositivo.</p>
          ) : (
            <button className="footer__link" onClick={() => setHelp(true)}>
              <Smartphone size={16} aria-hidden="true" /> Instalar en el celular
            </button>
          )}
        </section>
      </div>

      <div className="footer__bottom">
        <p>
          Hecho por {AUTHOR} ·{' '}
          <a className="footer__link" href={REPO_URL} target="_blank" rel="noreferrer">
            <CodeXml size={16} aria-hidden="true" /> Código en GitHub
          </a>
        </p>
        {offline && <p className="footer__muted">Funciona sin conexión</p>}
      </div>

      {help && <InstallDialog onClose={() => setHelp(false)} canPrompt={install.canPrompt} onPrompt={install.prompt} />}
    </footer>
  )
}

function InstallDialog({ onClose, canPrompt, onPrompt }: { onClose: () => void; canPrompt: boolean; onPrompt: () => Promise<void> }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    ref.current?.showModal()
  }, [])
  return createPortal(
    <dialog ref={ref} className="dialog install" onClose={onClose} onCancel={onClose}>
      <div className="install__body">
        <header className="dialog__head">
          <h2>Instalar en el celular</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </header>
        <p className="muted">Queda como una app con su propio ícono, abre en pantalla completa y funciona sin internet.</p>
        {canPrompt && (
          <button
            className="btn btn--primary install__now"
            onClick={async () => {
              await onPrompt()
              onClose()
            }}
          >
            Instalar ahora
          </button>
        )}
        <div className="install__steps">
          <section>
            <h3>Android · Chrome</h3>
            <ol>
              <li>Abre esta página en Chrome.</li>
              <li>
                Toca el menú <b>⋮</b> arriba a la derecha.
              </li>
              <li>
                Elige <b>Instalar app</b> o <b>Agregar a pantalla principal</b>.
              </li>
            </ol>
          </section>
          <section>
            <h3>iPhone · Safari</h3>
            <ol>
              <li>Abre esta página en Safari.</li>
              <li>
                Toca <b>Compartir</b> (el cuadro con la flecha hacia arriba).
              </li>
              <li>
                Elige <b>Agregar a inicio</b> y luego <b>Agregar</b>.
              </li>
            </ol>
          </section>
        </div>
      </div>
    </dialog>,
    document.body,
  )
}
