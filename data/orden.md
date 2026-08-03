Sí. Ya cubrimos perfiles, mains, tryouts, errores, orden de picks y rotación de responsabilidades. Lo que falta para que esto deje de ser “una buena guía” y se convierta en un sistema realmente usable es esto:

## 1. Matriz de dúos y tríos concretos

No solo roles genéricos, sino combinaciones listas para usar.

Ejemplo:

* Thermite + Thatcher
* Zofia + Iana
* Montagne + Ying
* Castle + Frost
* Valkyrie + Pulse
* Tubarão + Bandit

Y para cada una:

* quién inicia;
* quién da información;
* quién tradea;
* quién lleva el defuser;
* qué condición activa la jugada;
* qué error rompe la sinergia.

Ahora tenemos piezas. Falta armar los combos.

## 2. Recomendaciones por mapa y sitio

El pick correcto cambia brutalmente según el mapa.

Ejemplos:

* Pulse puede ser excelente en un sitio vertical y bastante decorativo en otro.
* Hibana vale más donde hay escotillas críticas.
* Castle depende muchísimo del setup.
* Montagne necesita rutas y plantados concretos.
* Ram y Sledge dependen de pisos destructibles.

Habría que crear:

```json
{
  "map": "Clubhouse",
  "site": "CCTV / Cash",
  "recommendedRoles": [],
  "recommendedPicksByPlayer": {},
  "avoid": []
}
```

Sin esto, el motor sabe quiénes son ustedes, pero todavía no sabe dónde están parados.

## 3. Plan de pick según bans

Esto falta bastante.

Por ejemplo:

* Si banean Thatcher, ¿quién cubre anti-gadget?
* Si banean Kaid, ¿quién toma la pared?
* Si banean Valkyrie, ¿quién da intel?
* Si banean Montagne, ¿cómo reemplaza Azusa su función?
* Si banean Tubarão, ¿qué usa Chango?

Cada jugador necesita:

* reemplazo directo;
* reemplazo funcional;
* cambio completo de plan.

Porque reemplazar a Thatcher con Kali no siempre significa jugar igual. A veces hay que abandonar la pared y entrar por otro lado, concepto revolucionario para algunos equipos de Ranked.

## 4. Reglas de defuser

Esto debería quedar explícito.

Idealmente:

* **Azusa** lleva el defuser cuando juega Montagne, Osa, Sens, Gridlock o soporte de ejecución.
* **Chango** lo lleva cuando juega Thermite, Hibana o soporte estructural y permanece con el equipo.
* **El_Notorious** no debería llevarlo si va de entry, roam clear o vertical agresivo.

También hace falta definir:

* quién lo recoge si muere el portador;
* quién cubre el plantado;
* quién vigila rotación;
* cuándo cancelar el plantado.

Parece básico hasta que el defuser aparece tirado en Narnia con 18 segundos restantes.

## 5. Jerarquía de calls

Ya hablamos de información, pero no de **quién toma decisiones**.

Conviene definir:

* quién llama la entrada;
* quién decide rotar;
* quién cancela una ejecución;
* quién marca el momento de plantar;
* quién manda en clutch;
* quién controla las calls cuando hay escudo.

Por perfiles:

* **El_Notorious:** decisiones dinámicas, roam clear y adaptación.
* **Chango:** estructura inicial, pared y utilidad.
* **Azusa:** ritmo de ejecución cuando juega escudo o plantado.

Sin jerarquía, tres buenas ideas simultáneas se convierten en una mala ronda colectiva.

## 6. Protocolo de ronda

Una estructura simple por fases:

### Ataque

* Preparación: identificar sitio y utilidad.
* Primer minuto: limpiar roam y abrir rutas.
* Segundo minuto: controlar flancos y preparar brecha.
* Último minuto: ejecutar.
* Postplantado: abandonar kills innecesarias y jugar tiempo.

### Defensa

* Preparación: setup y rutas.
* Primer minuto: negar información.
* Medio de ronda: consumir tiempo.
* Último minuto: regresar o cerrar posiciones.
* Plantado: ejecutar protocolo de negación.

Esto ayuda especialmente a Chango y Azusa, porque sus perfiles mejoran cuando la ronda tiene etapas claras.

## 7. Condiciones para cambiar de rol

No alcanza con “cada tres rondas respiramos”. Hace falta saber **cuándo** cambiar.

Ejemplos:

* Si El_Notorious está consiguiendo información pero no kills, pasar de roam a flex.
* Si Chango abre pero el equipo no entra, cambiar de hard breach a control.
* Si Azusa ocupa espacio pero nadie lo sigue, abandonar escudo.
* Si pierden dos ataques por flank, introducir Nomad o Gridlock.
* Si pierden dos defensas por plantado, sumar Smoke, Echo o Goyo.
* Si mueren temprano por roamers, sumar Lion, Dokkaebi o Jackal.

Eso convierte la rotación en respuesta táctica, no en cambio de personaje porque pintó.

## 8. Segunda utilidad y armas

El operador solo no define el rol.

Falta registrar:

* granadas;
* EMP secundarios;
* claymores;
* cargas duras secundarias;
* escudos desplegables;
* cámaras antibalas;
* C4;
* alambre;
* alarmas.

Un equipo puede cubrir una función sin elegir un operador dedicado.

Ejemplo: si ya hay EMP secundarios, quizá Thatcher sobra. Noticia devastadora para los que creen que cada pared necesita ceremonia religiosa.

## 9. Planes de aprendizaje para tryouts

Cada pick de prueba debería tener criterios de éxito.

Ejemplo para Zofia:

* destruir al menos una utilidad relevante;
* jugar detrás del entry;
* no morir primera;
* participar en la ejecución;
* obtener al menos un trade o crear espacio.

Para Castle:

* no bloquear rotaciones;
* obligar al rival a gastar utilidad;
* crear una extensión defendible;
* sobrevivir hasta media ronda.

Sin métricas, “probar un operador” termina siendo jugarlo dos veces, morir mal y declararlo basura.

## 10. Registro de rendimiento del trío

No solo KD.

Conviene medir:

* primeras bajas;
* primeras muertes;
* trades;
* plantas;
* defuses;
* utilidad destruida;
* tiempo consumido;
* rondas ganadas por composición;
* rondas ganadas por sitio;
* éxito de cada dúo;
* supervivencia con utilidad sin gastar.

Eso permite descubrir cosas como:

> “Montagne pierde solo, pero Montagne + Zofia gana mucho.”

Ahí aparece el valor real del equipo, que el KD individual suele esconder debajo de una alfombra bastante mugrienta.

## Prioridad recomendada

Lo siguiente que más valor aportaría sería:

1. **Matriz de dúos y tríos**
2. **Picks por mapa y sitio**
3. **Plan contra bans**
4. **Reglas de defuser y calls**
5. **Métricas de seguimiento**

Con esas cinco capas, ya tendrían un verdadero motor de composición y no solamente una ficha psicológica de tres tipos armados.
