import { useState } from 'react'
import { useRecetario } from '../data/store'
import { usePersonal } from '../data/personal'
import { X } from 'lucide-react'
import { FoodIcon } from '../components/FoodIcon'
import { useToast } from '../lib/useToast'
import { normalizeName } from '../lib/normalize'

export function ListaCompras() {
  const { recetario, ingredientsById } = useRecetario()
  const p = usePersonal()
  const [text, setText] = useState('')
  const toast = useToast()
  const pending = p.shopping.filter((s) => !s.done)
  const bought = p.shopping.filter((s) => s.done)

  const add = (e: React.FormEvent) => {
    e.preventDefault()
    const t = text.trim()
    if (!t) return
    const key = normalizeName(t)
    const ing = recetario.ingredients.find((i) => normalizeName(i.name) === key)
    p.addShopping([{ text: ing?.name ?? t, ingredientId: ing?.id }])
    setText('')
  }

  const toFridge = () => {
    const ids = bought.map((b) => b.ingredientId).filter((x): x is string => !!x)
    p.setFridge([...p.fridge, ...ids])
    p.clearBought()
    toast.show(ids.length ? `${ids.length} ${ids.length === 1 ? 'ingrediente pasó' : 'ingredientes pasaron'} a la nevera` : 'Comprados eliminados de la lista')
  }

  const Row = ({ item }: { item: (typeof p.shopping)[number] }) => {
    const ing = item.ingredientId ? ingredientsById.get(item.ingredientId) : undefined
    return (
      <li className={item.done ? 'is-done' : ''}>
        <label>
          <input type="checkbox" checked={item.done} onChange={() => p.toggleShopping(item.key)} />
          <span className="shop__icon">{ing ? <FoodIcon icon={ing.icon} size={22} /> : null}</span>
          <span className="shop__text">
            {item.text}
            {item.forRecipe && <span className="muted small shop__for">Para {item.forRecipe}</span>}
          </span>
        </label>
        <button className="icon-btn" aria-label={`Quitar ${item.text}`} onClick={() => p.removeShopping(item.key)}>
          <X size={18} aria-hidden="true" />
        </button>
      </li>
    )
  }

  return (
    <div className="shop">
      <header className="page-head">
        <h1>Lista de compras</h1>
        <p className="muted">Lo que falta en las recetas se agrega desde cada tarjeta. También puedes escribirlo aquí.</p>
      </header>
      <form className="shop__add" onSubmit={add}>
        <input className="input" placeholder="Ingrediente o producto" value={text} onChange={(e) => setText(e.target.value)} aria-label="Agregar a la lista" />
        <button className="btn btn--primary">Agregar</button>
      </form>

      {pending.length === 0 && bought.length === 0 && <p className="empty-note">No hay nada pendiente.</p>}

      {pending.length > 0 && (
        <ul className="shop__list">
          {pending.map((it) => (
            <Row key={it.key} item={it} />
          ))}
        </ul>
      )}

      {bought.length > 0 && (
        <section className="shop__bought">
          <div className="section-head">
            <h2>En el carrito</h2>
            <button className="btn btn--primary" onClick={toFridge}>
              Pasar a la nevera
            </button>
          </div>
          <ul className="shop__list">
            {bought.map((it) => (
              <Row key={it.key} item={it} />
            ))}
          </ul>
        </section>
      )}
      {toast.node}
    </div>
  )
}
