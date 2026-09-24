import type { Ingredient } from '../schema'
import { useRecetario } from '../data/store'
import { FoodIcon } from './FoodIcon'

interface Props {
  ingredient: Ingredient
  selected: boolean
  onToggle: (id: string) => void
  /** los específicos de una familia se ven más pequeños, colgando del genérico. */
  child?: boolean
  /** texto de estado alternativo (básicos: "se acabó"). */
  variant?: 'staple'
}

export function IngredientChip({ ingredient, selected, onToggle, child, variant }: Props) {
  const { photoUrl } = useRecetario()
  const photo = photoUrl(ingredient.photo)
  return (
    <button
      type="button"
      className={`chip${selected ? ' is-on' : ''}${child ? ' chip--child' : ''}${variant === 'staple' ? ' chip--staple' : ''}`}
      aria-pressed={selected}
      onClick={() => onToggle(ingredient.id)}
    >
      <span className="chip__sticker">
        {photo ? <img src={photo} alt="" /> : <FoodIcon icon={ingredient.icon} size={child ? 26 : 30} />}
      </span>
      <span className="chip__name">{ingredient.name}</span>
      <span className="chip__mark" aria-hidden="true">
        {variant === 'staple' ? (selected ? '✓' : 'se acabó') : '✓'}
      </span>
    </button>
  )
}
