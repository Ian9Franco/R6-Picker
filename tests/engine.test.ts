import test from "node:test";
import assert from "node:assert";
import { scoreAndExplainPick, normalizeMapId } from "../data/Pibes/scoring";
import { normalizeOperator } from "../data/Pibes/loader";
import changoRaw from "../data/FACTOS/chango_nocturno.json";
import { type PibeProfile } from "../data/Pibes/types";
import { type TacticalRole } from "../data/roles";
import { getAttackSiteProfile } from "../data/siteTactics";
import { getSitePlaybook } from "../data/sitePlaybooks";
import { getAgnosticRecommendations, getPibesRecommendations, getStandardRecommendations, DEFAULT_PIBES } from "../data/Pibes/engine";
import { attackers, competitiveMaps, defenders, mapBombSites } from "../data/catalog";

// Build a mock PibeProfile based on Chango's JSON schema for testing
const mockChango: PibeProfile = {
  id: "chango_nocturno",
  displayName: "Chango",
  tag: "Chango",
  identity: { summary: "", primaryRoles: [], secondaryRoles: [], postUtilityRole: [], preferredTempo: "", preferredPosition: [], playstyleTags: [] },
  roleAffinity: changoRaw.roleAffinity as any,
  identityOperators: [],
  comfortOperators: [],
  tryoutAttack: [],
  tryoutDefense: [],
  avoidOperators: ["ash"],
  attackMains: [],
  defenseMains: [],
  attackRoles: [],
  defenseRoles: [],
  mapPerformance: changoRaw.mapPerformance as any,
  pickOrder: changoRaw.pickOrder as any,
  activeSupport: changoRaw.activeSupport as any,
  tacticalGuidelines: { attack: { do: [], avoid: [] }, defense: { do: [], avoid: [] }, general: { do: [], avoid: [] } }
};

test("Engine and Scoring Logic", async (t) => {
  await t.test("normalizes map names correctly", () => {
    assert.strictEqual(normalizeMapId("Theme Park"), "theme-park");
    assert.strictEqual(normalizeMapId("Theme-Park"), "theme-park");
    assert.strictEqual(normalizeMapId("  Café Dostoyevsky  "), "cafe-dostoyevsky");
  });

  await t.test("does not reduce tracker-derived FACTOS evidence when Tracker data is unavailable", () => {
    // Kanal is a tracker-derived strong map for Chango on attack
    const op = normalizeOperator("hibana"); // assume some attack roles
    const { scoreBreakdown } = scoreAndExplainPick(
      op, mockChango, [], [], new Set(), "Kanal"
    );
    // Since tracker stats aren't loaded in tests (LocalStorage is undefined), it should treat tracker data as unavailable.
    // Strong is +7, confidence is high (1). The score should be +7.
    assert.strictEqual(scoreBreakdown.factosMapContext, 7, "Should award full +7 because tracker data is not available to double-count");
  });

  await t.test("treats frag-heavy as contextual rather than automatically positive", () => {
    const mockNotorious: PibeProfile = {
      ...mockChango,
      id: "el_notorious",
      mapPerformance: {
        attack: {
          "chalet": { classification: "frag-heavy", confidence: "high", source: "tracker-derived" }
        },
        defense: {}
      }
    };
    const op = normalizeOperator("ash"); // attack
    const { scoreBreakdown, explanation } = scoreAndExplainPick(
      op, mockNotorious, [], [], new Set(), "chalet"
    );
    assert.strictEqual(scoreBreakdown.factosMapContext, 0, "frag-heavy should grant 0 points");
    assert.ok(explanation.warnings.some(w => w.includes("Buen potencial de bajas")), "Should include frag-heavy warning");
  });

  await t.test("does not reward Chango pick order when hard breach is already covered", () => {
    const op = normalizeOperator("hibana");
    // Hard breach is covered by squadRolesSoFar
    const { scoreBreakdown } = scoreAndExplainPick(
      op, mockChango, [], [], new Set(["hard-breach", "anti-gadget"]), undefined, undefined, undefined, 1
    );
    assert.strictEqual(scoreBreakdown.pickOrderContext, 0, "Should not grant +2 because responsibilities are covered");
  });
  
  await t.test("rewards Chango pick order when hard breach is NOT covered", () => {
    const op = normalizeOperator("hibana");
    // Hard breach is NOT covered
    const { scoreBreakdown } = scoreAndExplainPick(
      op, mockChango, [], [], new Set(["entry"]), undefined, undefined, undefined, 1
    );
    assert.strictEqual(scoreBreakdown.pickOrderContext, 2, "Should grant +2 because hard-breach is still open");
  });

  await t.test("uses attack and defense active-support transitions independently", () => {
    const opDef = normalizeOperator("mute"); // Mute has 'anti-breach'
    opDef.roles = ["anti-breach", "stall"] as unknown as TacticalRole[];
    const { scoreBreakdown: defBD } = scoreAndExplainPick(
      opDef, mockChango, [], [], new Set(), undefined, undefined, undefined
    );
    // Defense requiredFunctions: ["anti-breach", ...], preferredTransitions: ["stall", ...]
    // Mute covers requirement (anti-breach) AND transition (stall). So +10 for covering, +6 for transition = 16.
    assert.strictEqual(defBD.compositionNeed, 10);
    assert.strictEqual(defBD.activeSupportTransition, 6);

    const opAtk = normalizeOperator("hibana");
    opAtk.roles = ["hard-breach", "stall"] as unknown as TacticalRole[];
    const { scoreBreakdown: atkBD } = scoreAndExplainPick(
      opAtk, mockChango, [], [], new Set(), undefined, undefined, undefined
    );
    // Attack requiredFunctions: ["hard-breach", ...], preferredTransitions: ["flank-control", "plant-support", "intel"]
    // "stall" is NOT a preferred transition in attack for Chango.
    assert.strictEqual(atkBD.activeSupportTransition, 0, "Should be 0 because stall is not preferred in attack");
  });

  await t.test("handles operators without role tags safely", () => {
    const opBlank = normalizeOperator("unknown_op");
    opBlank.roles = []; // no roles
    const { scoreBreakdown } = scoreAndExplainPick(
      opBlank, mockChango, [], [], new Set(), undefined, undefined, undefined
    );
    // Role affinity fallback when no roles: 0.5 * low conf (0.4) * 20 = 4.
    assert.strictEqual(scoreBreakdown.roleAffinity, 4, "Should apply fallback affinity for ops with no roles");
  });

  await t.test("never recommends an operator from the opposite side", () => {
    const attackerNames = new Set(attackers.map((op) => op.name));
    const defenderNames = new Set(defenders.map((op) => op.name));

    for (let seed = 0; seed < 12; seed += 1) {
      const attackOutput = getPibesRecommendations("attack", DEFAULT_PIBES, undefined, 1, "Clubhouse", [], "auto", [], seed);
      const defenseOutput = getPibesRecommendations("defense", DEFAULT_PIBES, undefined, 4, "Clubhouse", [], "auto", [], seed);
      const attackVariants = [attackOutput.primary, attackOutput.safeVariant, attackOutput.breathingVariant].filter(Boolean);
      const defenseVariants = [defenseOutput.primary, defenseOutput.safeVariant, defenseOutput.breathingVariant].filter(Boolean);

      attackVariants.forEach((variant) => variant!.picks.forEach((pick) => {
        assert.ok(attackerNames.has(pick.opName), `${pick.opName} no pertenece a Ataque`);
        assert.ok(!pick.backupOpName || attackerNames.has(pick.backupOpName), `${pick.backupOpName} no es un respaldo de Ataque`);
        assert.strictEqual(pick.operatorProfile.side, "attack");
      }));
      defenseVariants.forEach((variant) => variant!.picks.forEach((pick) => {
        assert.ok(defenderNames.has(pick.opName), `${pick.opName} no pertenece a Defensa`);
        assert.ok(!pick.backupOpName || defenderNames.has(pick.backupOpName), `${pick.backupOpName} no es un respaldo de Defensa`);
        assert.strictEqual(pick.operatorProfile.side, "defense");
      }));
    }

    const contaminatedProfile: PibeProfile = {
      ...mockChango,
      attackMains: ["Kaid"],
      comfortOperators: ["Mute", "Bandit"],
      tryoutAttack: [{ operatorId: "Vigil", developmentGoal: "dato contaminado" }],
    };
    const guardedOutput = getPibesRecommendations("attack", [contaminatedProfile], undefined, 1, "Clubhouse");
    guardedOutput.primary.picks.forEach((pick) => assert.ok(attackerNames.has(pick.opName)));
    guardedOutput.safeVariant.picks.forEach((pick) => assert.ok(attackerNames.has(pick.opName)));
    guardedOutput.breathingVariant?.picks.forEach((pick) => assert.ok(attackerNames.has(pick.opName)));
  });

  await t.test("never recommends banned operators in any mode or variant", () => {
    const allowedAttackers = new Set(["Thermite", "Ash", "Thatcher"]);
    const attackBans = attackers.filter((op) => !allowedAttackers.has(op.name)).map((op) => op.name);
    const output = getPibesRecommendations("attack", DEFAULT_PIBES, undefined, 1, "Clubhouse", attackBans);
    const variants = [output.primary, output.safeVariant, output.breathingVariant].filter(Boolean);

    variants.forEach((variant) => variant!.picks.forEach((pick) => {
      assert.ok(!attackBans.includes(pick.opName), `${pick.opName} estaba baneado`);
      assert.ok(allowedAttackers.has(pick.opName));
      assert.ok(!pick.backupOpName || !attackBans.includes(pick.backupOpName));
    }));

    const standard = getStandardRecommendations("defense", 3, ["Kaid", "Jäger", "Tubarão"]);
    standard.forEach((pick) => {
      assert.notStrictEqual(pick.opName, "Kaid");
      assert.notStrictEqual(pick.opName, "Jäger");
      assert.notStrictEqual(pick.opName, "Tubarão");
    });
  });

  await t.test("plans the same tactical trio regardless of who the players are", () => {
    const site = mapBombSites.Clubhouse[0];
    const invertedProfiles = DEFAULT_PIBES.map((pibe, index) => ({
      ...pibe,
      id: `inverted_${index}`,
      displayName: `Jugador ${index + 1}`,
      identityOperators: index === 0 ? ["Caveira"] : index === 1 ? ["Montagne"] : ["Ash"],
      comfortOperators: index === 0 ? ["Blitz"] : index === 1 ? ["Kaid"] : ["Thermite"],
      attackMains: index === 0 ? ["Blitz"] : index === 1 ? ["Montagne"] : ["Ash"],
      defenseMains: index === 0 ? ["Caveira"] : index === 1 ? ["Kaid"] : ["Vigil"],
      roleAffinity: {},
      mapPerformance: { attack: {}, defense: {} },
    }));

    const regular = getPibesRecommendations("attack", DEFAULT_PIBES, site, 1, "Clubhouse", [], "auto", [], 7);
    const inverted = getPibesRecommendations("attack", invertedProfiles, site, 1, "Clubhouse", [], "auto", [], 7);

    assert.deepStrictEqual(
      regular.primary.tacticalComposition.operatorNames,
      inverted.primary.tacticalComposition.operatorNames,
      "La composición base no debe cambiar por mains, confort o estadísticas de los jugadores"
    );
    assert.deepStrictEqual(
      new Set(regular.primary.picks.map((pick) => pick.opName)),
      new Set(regular.primary.tacticalComposition.operatorNames),
      "La capa de jugadores sólo puede reasignar los agentes del plan"
    );
  });

  await t.test("keeps baseline trio structure on both sides", () => {
    const attack = getPibesRecommendations("attack", DEFAULT_PIBES, mapBombSites.Clubhouse[0], 1, "Clubhouse");
    const defense = getPibesRecommendations("defense", DEFAULT_PIBES, mapBombSites.Clubhouse[0], 4, "Clubhouse");
    const attackRoles = new Set(attack.primary.picks.flatMap((pick) => pick.operatorProfile.roles));
    const defenseRoles = new Set(defense.primary.picks.flatMap((pick) => pick.operatorProfile.roles));

    assert.ok(attackRoles.has("hard-breach"), "El trío de ataque necesita una vía de brecha dura");
    assert.ok(
      ["anti-gadget", "intel", "soft-breach"].some((role) => attackRoles.has(role as TacticalRole)),
      "El trío de ataque necesita habilitación o limpieza"
    );
    assert.ok(defenseRoles.has("objective-anchor"), "El trío de defensa necesita presencia de ancla");
    assert.ok(
      ["anti-gadget-def", "access-denial", "zone-deny"].some((role) => defenseRoles.has(role as TacticalRole)),
      "El trío de defensa necesita negación o control"
    );
  });

  await t.test("uses the agnostic tactical planner for both duo and trio", () => {
    const site = mapBombSites.Clubhouse[0];
    const duo = getAgnosticRecommendations("attack", 2, site, 1, "Clubhouse");
    const trio = getAgnosticRecommendations("attack", 3, site, 1, "Clubhouse");

    assert.strictEqual(duo.primary.picks.length, 2);
    assert.strictEqual(trio.primary.picks.length, 3);
    assert.deepStrictEqual(
      new Set(duo.primary.picks.map((pick) => pick.opName)),
      new Set(duo.primary.tacticalComposition.operatorNames)
    );
    assert.deepStrictEqual(
      new Set(trio.primary.picks.map((pick) => pick.opName)),
      new Set(trio.primary.tacticalComposition.operatorNames)
    );
    assert.ok(duo.primary.picks.every((pick) => pick.playerId.startsWith("slot_")));
    assert.ok(trio.primary.picks.every((pick) => pick.playerId.startsWith("slot_")));
  });

  await t.test("replans when the selected bomb site changes", () => {
    const attackPlans = mapBombSites.Clubhouse.map((site) =>
      getAgnosticRecommendations("attack", 3, site, 1, "Clubhouse").primary.tacticalComposition.operatorNames.join("|")
    );
    const defensePlans = mapBombSites.Clubhouse.map((site) =>
      getAgnosticRecommendations("defense", 3, site, 4, "Clubhouse").primary.tacticalComposition.operatorNames.join("|")
    );

    assert.ok(new Set(attackPlans).size > 1, "Ataque debe variar su composición según la zona");
    assert.ok(new Set(defensePlans).size > 1, "Defensa debe variar su composición según la zona");
  });

  await t.test("includes Villa with all of its bomb sites and situational plans", () => {
    assert.ok(competitiveMaps.includes("Villa"), "Villa debe aparecer en el selector de mapas competitivos");
    assert.strictEqual(mapBombSites.Villa.length, 4, "Villa debe ofrecer sus cuatro zonas de bomba");

    const attackPlans = mapBombSites.Villa.map((site) =>
      getAgnosticRecommendations("attack", 3, site, 1, "Villa").primary.tacticalComposition.operatorNames.join("|")
    );
    const defensePlans = mapBombSites.Villa.map((site) =>
      getAgnosticRecommendations("defense", 3, site, 4, "Villa").primary.tacticalComposition.operatorNames.join("|")
    );

    assert.ok(new Set(attackPlans).size > 1, "Villa debe variar el ataque según la zona");
    assert.ok(new Set(defensePlans).size > 1, "Villa debe variar la defensa según la zona");
  });

  await t.test("uses Villa playbook lineups before assigning them to players", () => {
    for (const site of mapBombSites.Villa) {
      const playbook = getSitePlaybook("Villa", site.name);
      assert.ok(playbook, `Falta el playbook de ${site.name}`);

      for (const side of ["attack", "defense"] as const) {
        const duoOutput = getAgnosticRecommendations(side, 2, site, 1, "Villa");
        const trioOutput = getAgnosticRecommendations(side, 3, site, 3, "Villa");
        const duo = duoOutput.primary;
        const trio = trioOutput.primary;
        assert.deepStrictEqual(
          new Set(duo.tacticalComposition.operatorNames),
          new Set(playbook[side].lineups.duo.primary),
          `${site.name} debe usar el dúo táctico definido para ${side}`
        );
        assert.deepStrictEqual(
          new Set(trio.tacticalComposition.operatorNames),
          new Set(playbook[side].lineups.trio.primary),
          `${site.name} debe usar el trío táctico definido para ${side}`
        );
        assert.deepStrictEqual(
          new Set(duoOutput.safeVariant.tacticalComposition.operatorNames),
          new Set(playbook[side].lineups.duo.safe),
          `${site.name} debe usar el dúo seguro definido para ${side}`
        );
        assert.deepStrictEqual(
          new Set(trioOutput.safeVariant.tacticalComposition.operatorNames),
          new Set(playbook[side].lineups.trio.safe),
          `${site.name} debe usar el trío seguro definido para ${side}`
        );
        assert.deepStrictEqual(
          new Set(trioOutput.breathingVariant?.tacticalComposition.operatorNames),
          new Set(playbook[side].lineups.trio.breathing),
          `${site.name} debe usar la rotación táctica definida para ${side}`
        );
        assert.ok(trio.picks.every((pick) => Boolean(pick.tacticalTask)), `${site.name} debe asignar una tarea a cada slot`);

        const pibes = getPibesRecommendations(side, DEFAULT_PIBES, site, 1, "Villa").primary;
        assert.deepStrictEqual(
          new Set(pibes.picks.map((pick) => pick.opName)),
          new Set(playbook[side].lineups.trio.primary),
          `Los perfiles sólo deben reasignar el trío táctico de ${site.name}`
        );
        assert.ok(pibes.picks.every((pick) => Boolean(pick.tacticalTask)), `${site.name} debe alimentar la instrucción de cada pibe`);
      }
    }
  });

  await t.test("includes Theme Park as competitive and uses all four site playbooks", () => {
    assert.ok(competitiveMaps.includes("Theme Park"), "Theme Park debe aparecer en el selector competitivo");
    assert.strictEqual(mapBombSites["Theme Park"].length, 4, "Theme Park debe ofrecer sus cuatro zonas de bomba");

    for (const site of mapBombSites["Theme Park"]) {
      const playbook = getSitePlaybook("Theme Park", site.name);
      assert.ok(playbook, `Falta el playbook de ${site.name}`);

      for (const side of ["attack", "defense"] as const) {
        const recommendations = getAgnosticRecommendations(side, 3, site, 1, "Theme Park");
        const output = recommendations.primary;
        assert.deepStrictEqual(
          new Set(output.tacticalComposition.operatorNames),
          new Set(playbook[side].lineups.trio.primary),
          `${site.name} debe usar la composición táctica definida para ${side}`
        );
        assert.deepStrictEqual(
          new Set(recommendations.safeVariant.tacticalComposition.operatorNames),
          new Set(playbook[side].lineups.trio.safe),
          `${site.name} debe exponer la variante segura definida para ${side}`
        );
        assert.deepStrictEqual(
          new Set(recommendations.breathingVariant?.tacticalComposition.operatorNames),
          new Set(playbook[side].lineups.trio.breathing),
          `${site.name} debe exponer la alternativa definida desde la primera ronda`
        );
        assert.strictEqual(
          new Set([
            output.tacticalComposition.operatorNames.join("|"),
            recommendations.safeVariant.tacticalComposition.operatorNames.join("|"),
            recommendations.breathingVariant?.tacticalComposition.operatorNames.join("|"),
          ]).size,
          3,
          `${site.name} debe ofrecer tres composiciones realmente diferentes`
        );
        assert.ok(output.picks.every((pick) => Boolean(pick.tacticalTask)), `${site.name} debe asignar tareas tácticas`);
      }
    }
  });

  await t.test("applies Theme Park ban alternatives as complete compositions", () => {
    const throne = mapBombSites["Theme Park"].find((site) => site.name.includes("Throne"));
    assert.ok(throne);

    const attack = getPibesRecommendations("attack", DEFAULT_PIBES, throne, 1, "Theme Park", ["Thermite"]).primary;
    assert.deepStrictEqual(new Set(attack.picks.map((pick) => pick.opName)), new Set(["Ace", "Zofia", "Osa"]));

    const defense = getPibesRecommendations("defense", DEFAULT_PIBES, throne, 4, "Theme Park", ["Kaid"]).primary;
    assert.deepStrictEqual(new Set(defense.picks.map((pick) => pick.opName)), new Set(["Bandit", "Wamai", "Smoke"]));
    assert.ok([...attack.picks, ...defense.picks].every((pick) => Boolean(pick.tacticalTask)));
  });

  await t.test("matches translated site names without falling back to the first site", () => {
    assert.strictEqual(getAttackSiteProfile("Clubhouse", "Sala de CCTV / Sala de dinero")?.siteId, "cctv-cash");
    assert.strictEqual(getAttackSiteProfile("Clubhouse", "Gimnasio / Dormitorio principal")?.siteId, "gym-bedroom");
    assert.strictEqual(getAttackSiteProfile("Clubhouse", "Iglesia / Sala de arsenal")?.siteId, "church-arsenal");
    assert.strictEqual(getAttackSiteProfile("Clubhouse", "Bar / Escenario"), null);
  });

  await t.test("does not grant active-support bonus for duplicated required functions", () => {
    const op = normalizeOperator("thermite");
    op.roles = ["hard-breach", "flank-control"] as TacticalRole[];
    // Squad already has hard-breach
    const { scoreBreakdown, explanation } = scoreAndExplainPick(
      op, mockChango, [], [], new Set(["hard-breach"]), undefined, undefined, undefined
    );
    // Does not cover missing requirement because it's already covered.
    // DOES enable transition because flank-control.
    // So transition should be +3 (free support transition), NOT +6 (covering req + transition).
    assert.strictEqual(scoreBreakdown.activeSupportTransition, 3);
    // Penalizes duplication
    assert.strictEqual(scoreBreakdown.penalties, -4);
    assert.ok(explanation.negative.some(n => n.includes("-4 asumiendo función obligatoria que el equipo ya cubrió")));
  });

  await t.test("penalizes an avoid pattern without marking the operator itself as avoided", () => {
    const op = normalizeOperator("nøkk");
    // Let's pretend Nokk gives "deep-roaming-without-return" and is an attack operator
    op.roles = ["deep-roaming-without-return"] as unknown as TacticalRole[];
    const { scoreBreakdown, explanation } = scoreAndExplainPick(
      op, mockChango, [], [], new Set(), undefined, undefined, undefined
    );
    
    // operator is not in avoidOperators (which is only 'ash')
    assert.strictEqual(scoreBreakdown.penalties, 0, "Operator itself should not have the generic -12 avoid penalty");
    
    // but should have the avoidPatternPenalty
    assert.strictEqual(scoreBreakdown.avoidPatternPenalty, -8);
    assert.ok(explanation.negative.some(n => n.includes("patrón desaconsejado")));
  });

});
