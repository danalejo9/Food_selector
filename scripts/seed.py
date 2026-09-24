# Genera data/recetario.json inicial. Solo se usa una vez; después se edita desde la app.
import json

I = []
def ing(id, name, cat, icon, family=None, staple=False):
    d = {"id": id, "name": name, "category": cat, "icon": icon, "pantryStaple": staple}
    if family: d["family"] = family
    I.append(d)

# Lácteos y huevos
ing("huevo", "Huevos", "lacteos", "egg")
ing("leche", "Leche", "lacteos", "milk")
ing("leche-deslactosada", "Leche deslactosada", "lacteos", "milk", family="leche")
ing("queso", "Queso", "lacteos", "cheese")
ing("queso-campesino", "Queso campesino", "lacteos", "cheese", family="queso")
ing("queso-mozzarella", "Queso mozzarella", "lacteos", "cheese", family="queso")
ing("queso-parmesano", "Queso parmesano", "lacteos", "cheese", family="queso")
ing("mantequilla", "Mantequilla", "lacteos", "butter")
ing("crema-leche", "Crema de leche", "lacteos", "cream")
ing("yogur", "Yogur", "lacteos", "yogurt")
# Frutas
ing("arandanos", "Arándanos", "frutas", "berries")
ing("banano", "Banano", "frutas", "banana")
ing("fresa", "Fresas", "frutas", "strawberry")
ing("limon", "Limón", "frutas", "lemon")
ing("aguacate", "Aguacate", "frutas", "avocado")
ing("manzana", "Manzana", "frutas", "apple")
# Verduras
ing("tomate", "Tomate", "verduras", "tomato")
ing("cebolla", "Cebolla", "verduras", "onion")
ing("cebolla-cabezona", "Cebolla cabezona", "verduras", "onion", family="cebolla")
ing("cebolla-larga", "Cebolla larga", "verduras", "scallion", family="cebolla")
ing("ajo", "Ajo", "verduras", "garlic")
ing("papa", "Papa", "verduras", "potato")
ing("papa-criolla", "Papa criolla", "verduras", "potato", family="papa")
ing("zanahoria", "Zanahoria", "verduras", "carrot")
ing("pimenton", "Pimentón", "verduras", "pepper")
ing("cilantro", "Cilantro", "verduras", "herb")
ing("guascas", "Guascas", "verduras", "herb")
ing("mazorca", "Mazorca", "verduras", "corn")
ing("espinaca", "Espinaca", "verduras", "leaf")
# Proteínas
ing("pollo", "Pollo", "proteinas", "chicken")
ing("pechuga", "Pechuga de pollo", "proteinas", "chicken", family="pollo")
ing("carne-molida", "Carne molida", "proteinas", "meat")
ing("tocineta", "Tocineta", "proteinas", "bacon")
ing("atun", "Atún en lata", "proteinas", "can")
ing("frijoles", "Fríjoles cocidos", "proteinas", "beans")
# Harinas y granos
ing("harina", "Harina de trigo", "harinas", "flour")
ing("harina-maiz", "Harina de maíz precocida", "harinas", "flour")
ing("arroz", "Arroz", "harinas", "rice")
ing("pasta", "Pasta", "harinas", "pasta")
ing("avena", "Avena en hojuelas", "harinas", "oats")
ing("pan", "Pan", "harinas", "bread")
ing("pan-tajado", "Pan tajado", "harinas", "bread", family="pan")
ing("arepa", "Arepas", "harinas", "arepa")
ing("tortilla-trigo", "Tortillas de trigo", "harinas", "arepa")
# Despensa
ing("sal", "Sal", "despensa", "salt", staple=True)
ing("aceite", "Aceite", "despensa", "oil", staple=True)
ing("azucar", "Azúcar", "despensa", "sugar", staple=True)
ing("agua", "Agua", "despensa", "water", staple=True)
ing("pimienta", "Pimienta", "despensa", "spice", staple=True)
ing("polvo-hornear", "Polvo de hornear", "despensa", "jar")
ing("miel", "Miel", "despensa", "honey")
ing("canela", "Canela", "despensa", "cinnamon")
ing("comino", "Comino", "despensa", "spice")
ing("chocolate", "Chocolate de mesa", "despensa", "chocolate")
ing("vainilla", "Esencia de vainilla", "despensa", "oil")

R = []
def r(id, name, desc, meals, prep, cook, serv, diff, ings, steps, tags=()):
    out = []
    for x in ings:
        iid, qty, unit, *rest = x + (None,) * (4 - len(x)) if len(x) < 4 else x
        d = {"ingredientId": iid, "optional": False}
        if qty is not None: d["qty"] = qty
        if unit: d["unit"] = unit
        for opt in rest:
            if opt == "opt": d["optional"] = True
            elif opt: d["note"] = opt
        out.append(d)
    R.append({
        "id": id, "name": name, "description": desc, "meals": meals,
        "prepMinutes": prep, "cookMinutes": cook, "servings": serv, "difficulty": diff,
        "ingredients": out,
        "steps": [{"text": s} if isinstance(s, str) else {"text": s[0], "minutes": s[1]} for s in steps],
        "tags": list(tags),
    })

r("pancakes-arandanos", "Pancakes de arándanos",
  "Esponjosos, con arándanos que revientan en la sartén.",
  ["desayuno", "once"], 10, 15, 4, 1,
  [("harina", 1.5, "taza"), ("leche", 1.25, "taza"), ("huevo", 1, None),
   ("azucar", 2, "cda"), ("polvo-hornear", 2, "cdta"), ("mantequilla", 2, "cda", "derretida"),
   ("arandanos", 1, "taza"), ("sal", None, None, "una pizca"), ("miel", None, None, "opt")],
  ["Mezcla en un tazón la harina, el azúcar, el polvo de hornear y la sal.",
   "En otro tazón bate la leche, el huevo y la mantequilla derretida.",
   "Une los líquidos con los secos sin batir de más: está bien si quedan grumos.",
   ("Calienta una sartén a fuego medio con un poco de mantequilla. Vierte ¼ de taza de mezcla y reparte arándanos encima.", 2),
   ("Voltea cuando salgan burbujas en la superficie y dora el otro lado.", 1),
   "Sirve con miel o más arándanos."],
  ["dulce"])

r("huevos-pericos", "Huevos pericos con arepa",
  "El desayuno de siempre: huevo revuelto con tomate y cebolla.",
  ["desayuno", "cena"], 5, 10, 2, 1,
  [("huevo", 4, None), ("tomate", 1, None, "picado"), ("cebolla", 0.5, None, "picada"),
   ("arepa", 2, None), ("mantequilla", 1, "cda"), ("sal", None, None)],
  [("Sofríe la cebolla en la mantequilla hasta que esté transparente.", 3),
   ("Agrega el tomate y cocina hasta que suelte el jugo.", 3),
   "Bate los huevos con sal, viértelos y revuelve suave hasta que cuajen.",
   "Asa las arepas y sirve al lado."],
  ["rápida"])

r("changua", "Changua",
  "Caldo de leche con huevo, cebolla larga y cilantro. Receta bogotana.",
  ["desayuno"], 5, 15, 2, 1,
  [("leche", 2, "taza"), ("agua", 1, "taza"), ("huevo", 2, None),
   ("cebolla-larga", 1, "tallo", "picado"), ("cilantro", None, None, "picado"),
   ("pan", 2, "tajada", "o calado"), ("sal", None, None)],
  [("Hierve el agua con la leche, la cebolla larga y sal.", 5),
   ("Baja el fuego y rompe los huevos directamente en el caldo, sin revolver.", 4),
   "Pon el pan en el fondo del plato, sirve encima y termina con cilantro."],
  ["tradicional"])

r("calentado", "Calentado paisa",
  "Arroz y fríjoles del día anterior, salteados, con huevo frito.",
  ["desayuno"], 5, 12, 2, 1,
  [("arroz", 1, "taza", "cocido"), ("frijoles", 1, "taza"), ("huevo", 2, None),
   ("cebolla", 0.5, None), ("tomate", 1, None), ("aceite", 1, "cda"),
   ("arepa", 2, None, "opt"), ("sal", None, None)],
  [("Sofríe la cebolla y el tomate en el aceite.", 4),
   ("Agrega el arroz y los fríjoles; revuelve hasta que se calienten bien.", 5),
   ("En otra sartén fríe los huevos.", 3),
   "Sirve el calentado con el huevo encima y una arepa al lado."],
  ["aprovechamiento"])

r("ajiaco", "Ajiaco santafereño",
  "Sopa espesa de tres papas, pollo, mazorca y guascas.",
  ["almuerzo"], 20, 60, 6, 2,
  [("pechuga", 2, None), ("papa-criolla", 500, "g"), ("papa", 500, "g"),
   ("mazorca", 3, None, "en trozos"), ("guascas", 1, "manojo"), ("cebolla-larga", 2, "tallo"),
   ("ajo", 2, "diente"), ("agua", 3, "l"), ("sal", None, None),
   ("crema-leche", None, None, "opt"), ("aguacate", 1, None, "opt")],
  [("Cocina las pechugas en el agua con la cebolla larga, el ajo y sal. Sácalas y desmecha.", 30),
   ("Agrega al caldo la papa en rodajas y la mazorca.", 15),
   ("Suma la papa criolla y cocina hasta que se deshaga y espese.", 15),
   "Añade las guascas los últimos 5 minutos y devuelve el pollo.",
   "Sirve con crema de leche y aguacate."],
  ["tradicional", "sopa"])

r("arroz-con-pollo", "Arroz con pollo",
  "Un clásico de olla: arroz amarillo con pollo y verduras.",
  ["almuerzo", "cena"], 15, 35, 4, 2,
  [("arroz", 2, "taza"), ("pollo", 500, "g", "desmechado"), ("zanahoria", 1, None, "en cubos"),
   ("pimenton", 1, None), ("cebolla", 1, None), ("ajo", 2, "diente"),
   ("agua", 4, "taza"), ("aceite", 2, "cda"), ("sal", None, None), ("comino", None, None, "opt")],
  [("Sofríe la cebolla, el ajo y el pimentón en el aceite.", 5),
   "Agrega la zanahoria y el pollo, y sazona con sal y comino.",
   ("Suma el arroz, revuelve un minuto y agrega el agua.", 2),
   ("Cocina a fuego alto hasta que se seque, luego tapa y deja a fuego bajo.", 20)],
  ["olla"])

r("pasta-pomodoro", "Pasta al pomodoro",
  "Tomate, ajo y aceite. Nada más hace falta.",
  ["almuerzo", "cena"], 5, 20, 2, 1,
  [("pasta", 200, "g"), ("tomate", 4, None, "maduros"), ("ajo", 2, "diente"),
   ("aceite", 3, "cda"), ("sal", None, None), ("queso-parmesano", None, None, "opt")],
  [("Cocina la pasta en agua con sal hasta que esté al dente.", 10),
   ("Mientras tanto, dora el ajo en el aceite y agrega el tomate picado.", 10),
   "Mezcla la pasta con la salsa y un chorrito del agua de cocción.",
   "Termina con parmesano rallado."],
  ["rápida", "vegetariana"])

r("pasta-bolonesa", "Pasta a la boloñesa",
  "Salsa de carne molida con zanahoria, lenta y generosa.",
  ["almuerzo", "cena"], 10, 35, 4, 2,
  [("pasta", 400, "g"), ("carne-molida", 400, "g"), ("tomate", 4, None),
   ("cebolla", 1, None), ("zanahoria", 1, None, "rallada"), ("ajo", 2, "diente"),
   ("aceite", 2, "cda"), ("sal", None, None), ("queso", None, None, "opt")],
  [("Sofríe la cebolla, el ajo y la zanahoria.", 5),
   ("Agrega la carne y dórala bien, deshaciéndola con la cuchara.", 8),
   ("Suma el tomate picado, sal, y cocina tapado a fuego bajo.", 20),
   ("Cocina la pasta y sírvela con la salsa y queso.", 10)])

r("quesadillas", "Quesadillas de pollo",
  "Tortillas doradas, queso que se estira.",
  ["cena", "entrecomidas"], 5, 10, 2, 1,
  [("tortilla-trigo", 4, None), ("queso-mozzarella", 150, "g"),
   ("pollo", 1, "taza", "desmechado"), ("pimenton", 0.5, None, "opt"), ("aceite", 1, "cdta")],
  ["Reparte queso, pollo y pimentón sobre media tortilla y dobla.",
   ("Dora en sartén caliente por ambos lados hasta que el queso se derrita.", 4),
   "Corta en triángulos."],
  ["rápida"])

r("tostadas-aguacate", "Tostadas de aguacate",
  "Pan tostado, aguacate con limón y un huevo si hay.",
  ["desayuno", "entrecomidas"], 5, 5, 2, 1,
  [("pan", 2, "tajada"), ("aguacate", 1, None), ("limon", 0.5, None),
   ("sal", None, None), ("pimienta", None, None), ("huevo", 2, None, "opt")],
  ["Tuesta el pan.",
   "Machaca el aguacate con limón, sal y pimienta.",
   "Unta sobre el pan y, si quieres, pon un huevo frito encima."],
  ["rápida", "vegetariana"])

r("avena-banano", "Avena caliente con banano",
  "Cremosa, con canela. Buena para días fríos.",
  ["desayuno"], 2, 10, 2, 1,
  [("avena", 1, "taza"), ("leche", 2, "taza"), ("banano", 1, None, "en rodajas"),
   ("canela", 1, "astilla"), ("miel", None, None, "opt"), ("arandanos", None, None, "opt")],
  [("Calienta la leche con la canela.", 3),
   ("Agrega la avena y revuelve a fuego bajo hasta que espese.", 6),
   "Sirve con banano, miel y arándanos por encima."],
  ["dulce", "vegetariana"])

r("batido-fresa", "Batido de fresa",
  "Fresas, leche y un toque de yogur.",
  ["entrecomidas", "once", "desayuno"], 5, 0, 2, 1,
  [("fresa", 1.5, "taza"), ("leche", 1.5, "taza"), ("azucar", 1, "cda"), ("yogur", 0.5, "taza", "opt")],
  ["Lava las fresas y quítales el cabo.",
   "Licúa todo hasta que quede liso. Sirve frío."],
  ["bebida", "rápida"])

r("chocolate-queso", "Chocolate con queso",
  "La once santafereña: chocolate espumoso con queso que se derrite adentro.",
  ["once"], 2, 10, 2, 1,
  [("chocolate", 2, "pastilla"), ("leche", 2, "taza"), ("agua", 0.5, "taza"),
   ("queso-campesino", 100, "g", "en cubos"), ("pan", 2, None)],
  [("Hierve la leche con el agua y el chocolate hasta que se disuelva.", 6),
   "Bate con molinillo hasta que haga espuma.",
   "Sirve con el queso adentro de la taza y pan al lado."],
  ["tradicional", "bebida"])

r("ensalada-atun", "Ensalada de atún",
  "Fresca, rápida y sin estufa.",
  ["almuerzo", "cena", "entrecomidas"], 10, 0, 2, 1,
  [("atun", 1, "lata"), ("tomate", 2, None), ("cebolla", 0.5, None), ("limon", 1, None),
   ("aceite", 1, "cda"), ("sal", None, None), ("aguacate", 1, None, "opt")],
  ["Pica el tomate, la cebolla y el aguacate.",
   "Escurre el atún y mezcla todo.",
   "Aliña con limón, aceite y sal."],
  ["rápida", "sin estufa"])

r("galletas-avena", "Galletas de avena y banano",
  "Dos ingredientes base, sin harina. Ideales para la lonchera.",
  ["once", "entrecomidas"], 10, 15, 12, 1,
  [("avena", 1.5, "taza"), ("banano", 2, None, "muy maduros"), ("canela", None, None, "molida"),
   ("arandanos", 0.5, "taza", "opt"), ("miel", 1, "cda", "opt")],
  ["Precalienta el horno a 180 °C.",
   "Machaca el banano y mezcla con la avena, la canela y los arándanos.",
   ("Forma bolitas, aplánalas en una bandeja y hornea hasta dorar.", 15)],
  ["dulce", "horno"])

r("tortilla-espanola", "Tortilla de papa",
  "Papa y cebolla confitadas, cuajadas en huevo.",
  ["almuerzo", "cena"], 10, 30, 4, 2,
  [("papa", 4, None), ("huevo", 5, None), ("cebolla", 1, None), ("aceite", 0.5, "taza"), ("sal", None, None)],
  [("Corta la papa y la cebolla en láminas finas y cocínalas en el aceite a fuego bajo hasta que estén tiernas.", 20),
   "Escúrrelas y mézclalas con los huevos batidos y sal.",
   ("Cuaja en sartén a fuego medio, voltea con ayuda de un plato y termina el otro lado.", 6)])

data = {"version": 1, "ingredients": I, "recipes": R}
with open("data/recetario.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
    f.write("\n")
print(len(I), "ingredientes,", len(R), "recetas")
