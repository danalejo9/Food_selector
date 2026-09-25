import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** dónde está (para el registro): "pantalla" o "app". */
  where?: string
}

interface State {
  error: Error | null
  /** cada reintento vuelve a montar la pantalla desde cero. */
  attempt: number
}

/**
 * Si una pantalla falla al dibujarse (por ejemplo, porque una extensión o el
 * traductor del navegador alteró la página), se vuelve a montar una vez sola.
 * Si vuelve a fallar, muestra un aviso con el error en vez de dejar la página vacía.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, attempt: 0 }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[La Nevera] Falló la ${this.props.where ?? 'pantalla'} en ${location.hash || '#/'}:`, error, info.componentStack)
    if (this.state.attempt === 0) this.setState({ error: null, attempt: 1 })
  }

  render() {
    const { error, attempt } = this.state
    if (!error) return <Retry key={attempt}>{this.props.children}</Retry>
    return (
      <div className="crash" role="alert">
        <h1>No se pudo mostrar esta pantalla</h1>
        <p className="muted">Recarga la página. Si se repite, envíale a Daniel el texto de abajo.</p>
        <div className="crash__actions">
          <button className="btn btn--primary" onClick={() => location.reload()}>
            Recargar
          </button>
          <button
            className="btn"
            onClick={() => {
              location.hash = '#/'
              location.reload()
            }}
          >
            Ir a la cocina
          </button>
        </div>
        <pre className="crash__detail">
          {location.hash || '#/'} · {error.name}: {error.message}
        </pre>
      </div>
    )
  }
}

function Retry({ children }: { children: ReactNode }) {
  return <>{children}</>
}
