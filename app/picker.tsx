"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Crosshair, Dice5, MapPinned, Search, Shield, Shuffle, Sparkles, Swords } from "lucide-react";
import { useMemo, useState } from "react";
import { attackers, catalogMeta, defenders, maps, type Side } from "../data/catalog";

const randomItem = <T,>(items: readonly T[]) => items[Math.floor(Math.random() * items.length)];

export function Picker() {
  const [side, setSide] = useState<Side>("attack");
  const [query, setQuery] = useState("");
  const [operator, setOperator] = useState("Sledge");
  const [map, setMap] = useState("Clubhouse");
  const [roll, setRoll] = useState(0);
  const activeOperators = side === "attack" ? attackers : defenders;
  const visibleOperators = useMemo(() => activeOperators.filter((item) => item.name.toLocaleLowerCase().includes(query.toLocaleLowerCase())), [activeOperators, query]);

  const pick = () => {
    setOperator(randomItem(activeOperators).name);
    setMap(randomItem(maps));
    setRoll((value) => value + 1);
  };

  const changeSide = (nextSide: Side) => {
    setSide(nextSide);
    setQuery("");
    setOperator(randomItem(nextSide === "attack" ? attackers : defenders).name);
    setRoll((value) => value + 1);
  };

  return (
    <main>
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <nav className="nav shell" aria-label="Navegación principal">
        <a className="brand" href="#top" aria-label="R6 Picker — inicio"><span className="brand-mark"><Crosshair size={19} /></span><span>R6<span className="brand-dim">/PICKER</span></span></a>
        <div className="nav-links"><a href="#picker">Picker</a><a href="#catalogo">Catálogo</a></div>
        <a className="source-link" href={catalogMeta.sourceUrl} target="_blank" rel="noreferrer">Fuente oficial <ArrowUpRight size={15} /></a>
      </nav>

      <section className="hero shell" id="top">
        <div className="hero-copy">
          <motion.div className="eyebrow" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><Sparkles size={14} /> Decidí. Entrá. Ejecutá.</motion.div>
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .08 }}>Tu próxima<br />ronda, <em>al azar.</em></motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .18 }}>Un picker rápido para salir de la zona de confort. Elegí el bando y dejá que el azar defina tu operador y el campo de batalla.</motion.p>
          <motion.div className="hero-stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .25 }}>
            <span><strong>{attackers.length}</strong> atacantes</span><span><strong>{defenders.length}</strong> defensores</span><span><strong>{maps.length}</strong> mapas</span>
          </motion.div>
        </div>

        <motion.div className="picker-panel glass" id="picker" initial={{ opacity: 0, scale: .97, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: .12, duration: .55 }}>
          <div className="panel-topline"><span>Generador de ronda</span><Dice5 size={18} /></div>
          <div className="side-switch" role="group" aria-label="Elegir bando">
            <button className={side === "attack" ? "active" : ""} onClick={() => changeSide("attack")}><Swords size={17} /> Ataque</button>
            <button className={side === "defense" ? "active" : ""} onClick={() => changeSide("defense")}><Shield size={17} /> Defensa</button>
          </div>
          <div className="results">
            <AnimatePresence mode="wait"><motion.div className="result-card result-primary" key={`${operator}-${roll}`} initial={{ opacity: 0, x: 16, filter: "blur(5px)" }} animate={{ opacity: 1, x: 0, filter: "blur(0px)" }} exit={{ opacity: 0, x: -12 }} transition={{ duration: .24 }}>
              <span className="result-icon">{side === "attack" ? <Swords size={20} /> : <Shield size={20} />}</span><div><small>Operador</small><strong>{operator}</strong></div><span className="side-code">{side === "attack" ? "ATK" : "DEF"}</span>
            </motion.div></AnimatePresence>
            <AnimatePresence mode="wait"><motion.div className="result-card" key={`${map}-${roll}`} initial={{ opacity: 0, x: 16, filter: "blur(5px)" }} animate={{ opacity: 1, x: 0, filter: "blur(0px)" }} exit={{ opacity: 0, x: -12 }} transition={{ duration: .24, delay: .04 }}>
              <span className="result-icon"><MapPinned size={20} /></span><div><small>Mapa</small><strong>{map}</strong></div><span className="side-code">MAP</span>
            </motion.div></AnimatePresence>
          </div>
          <motion.button className="pick-button" onClick={pick} whileHover={{ scale: 1.015 }} whileTap={{ scale: .97 }}><Shuffle size={19} /> Sortear ronda</motion.button>
          <p className="keyboard-hint">Catálogo actualizado · {catalogMeta.updatedAt}</p>
        </motion.div>
      </section>

      <section className="catalog shell" id="catalogo">
        <div className="section-heading"><div><span className="section-kicker">Base de datos</span><h2>Todos los operadores.</h2></div><label className="search-box"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar operador" aria-label="Buscar operador" /></label></div>
        <div className="catalog-tabs" role="tablist" aria-label="Filtrar operadores por bando">
          <button className={side === "attack" ? "active" : ""} onClick={() => changeSide("attack")} role="tab" aria-selected={side === "attack"}>Atacantes <span>{attackers.length}</span></button>
          <button className={side === "defense" ? "active" : ""} onClick={() => changeSide("defense")} role="tab" aria-selected={side === "defense"}>Defensores <span>{defenders.length}</span></button>
        </div>
        <motion.div className="operator-grid" layout><AnimatePresence mode="popLayout">
          {visibleOperators.map((item, index) => <motion.button className="operator-card glass" key={item.name} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: .96 }} transition={{ delay: Math.min(index * .012, .2) }} onClick={() => { setOperator(item.name); setRoll((value) => value + 1); document.querySelector("#picker")?.scrollIntoView({ behavior: "smooth" }); }}>
            <span className="operator-monogram">{item.name.slice(0, 2).toUpperCase()}</span><span>{item.name}</span><ArrowUpRight size={14} />
          </motion.button>)}
        </AnimatePresence></motion.div>
      </section>
      <footer className="shell"><span>R6/PICKER</span><p>Catálogo local basado en información oficial de Ubisoft. Proyecto no afiliado a Ubisoft.</p></footer>
    </main>
  );
}
