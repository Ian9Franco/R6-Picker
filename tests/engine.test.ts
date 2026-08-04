import test from "node:test";
import assert from "node:assert";
import { scoreAndExplainPick, normalizeMapId } from "../data/Pibes/scoring";
import { normalizeOperator } from "../data/Pibes/loader";
import changoRaw from "../data/FACTOS/chango_nocturno.json";
import { type PibeProfile } from "../data/Pibes/types";
import { type TacticalRole } from "../data/roles";

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
