import { Navigate, NavLink, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { useEffect } from 'react'
import { baseErrors, baseRecetario, RecetarioProvider } from './data/store'
import { PersonalProvider, usePersonal } from './data/personal'
import { Cocina } from './pages/Cocina'
import { RecetaDetalle } from './pages/RecetaDetalle'
import { ModoCocinar } from './pages/ModoCocinar'
import { ListaCompras } from './pages/ListaCompras'
import { Recetario } from './pages/Recetario'
import { RecetaEditor } from './pages/RecetaEditor'
import { DraftBar } from './components/DraftBar'
import { Footer } from './components/Footer'
import { ErrorBoundary } from './components/ErrorBoundary'
import { EditorProvider, useEditor } from './data/editor'
import { AccesoEditor } from './pages/AccesoEditor'

export function App() {
  if (!baseRecetario) return <BrokenFile errors={baseErrors} />
  return (
    <EditorProvider>
      <WithRecetario />
    </EditorProvider>
  )
}

function WithRecetario() {
  const { canEdit } = useEditor()
  return (
    <RecetarioProvider base={baseRecetario!} canEdit={canEdit}>
      <PersonalProvider>
        <Shell />
      </PersonalProvider>
    </RecetarioProvider>
  )
}

/** Las pantallas de edición solo existen en modo editor; los demás van a la ficha. */
function SoloEditor({ children }: { children: React.ReactNode }) {
  const { canEdit } = useEditor()
  const { id } = useParams()
  if (canEdit) return <>{children}</>
  return <Navigate to={id ? `/receta/${id}` : '/recetario'} replace />
}

function Shell() {
  const { pathname } = useLocation()
  const { canEdit } = useEditor()
  const cooking = pathname.endsWith('/cocinar')
  useEffect(() => window.scrollTo(0, 0), [pathname])

  if (cooking)
    return (
      <ErrorBoundary key={pathname}>
        <Routes>
          <Route path="/receta/:id/cocinar" element={<ModoCocinar />} />
        </Routes>
      </ErrorBoundary>
    )

  return (
    <div className="shell">
      <Masthead />
      {canEdit && pathname.startsWith('/recetario') && <DraftBar />}
      <main className="main">
        <ErrorBoundary key={pathname}>
          <Routes>
            <Route path="/" element={<Cocina />} />
            <Route path="/receta/:id" element={<RecetaDetalle />} />
            <Route path="/compras" element={<ListaCompras />} />
            <Route path="/recetario" element={<Recetario />} />
            <Route path="/recetario/:tab" element={<Recetario />} />
            <Route
              path="/recetario/receta/nueva"
              element={
                <SoloEditor>
                  <RecetaEditor />
                </SoloEditor>
              }
            />
            <Route
              path="/recetario/receta/:id"
              element={
                <SoloEditor>
                  <RecetaEditor />
                </SoloEditor>
              }
            />
            <Route path="/editor" element={<AccesoEditor />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  )
}

function Masthead() {
  const { shopping } = usePersonal()
  const pending = shopping.filter((s) => !s.done).length
  return (
    <header className="masthead">
      <NavLink to="/" className="masthead__brand" aria-label="La Nevera, inicio">
        <span className="masthead__title">La Nevera</span>
      </NavLink>
      <nav className="masthead__nav" aria-label="Secciones">
        <NavLink to="/" end>
          Cocina
        </NavLink>
        <NavLink to="/compras">
          Compras{pending > 0 && <span className="count num">{pending}</span>}
        </NavLink>
        <NavLink to="/recetario">Recetario</NavLink>
      </nav>
    </header>
  )
}

function NotFound() {
  return (
    <div className="empty">
      <h2>Esta página no está en el recetario.</h2>
      <NavLink to="/" className="btn">
        Volver a la cocina
      </NavLink>
    </div>
  )
}

function BrokenFile({ errors }: { errors: string[] }) {
  return (
    <div className="broken">
      <h1>El archivo del recetario tiene errores</h1>
      <p>
        Revisa <code>data/recetario.json</code>. Puedes correr <code>npm run validate</code> para ver lo mismo en la terminal.
      </p>
      <ul>
        {errors.slice(0, 30).map((e) => (
          <li key={e}>
            <code>{e}</code>
          </li>
        ))}
      </ul>
    </div>
  )
}
