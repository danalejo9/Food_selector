import type { Ingredient } from '../schema'
import { useRecetario } from '../data/store'
import { Check } from 'lucide-react'
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
        {photo ? <img src={photo} alt="" /> : <FoodIcon icon={ingredient.icon} size={child ? 22 : 24} />}
      </span>
      <span className="chip__name">{ingredient.name}</span>
      {variant === 'staple' ? (
        !selected && <span className="chip__note">agotado</span>
      ) : (
        selected && <Check className="chip__mark" size={16} strokeWidth={2.25} aria-hidden="true" />
      )}
    </button>
  )
}
