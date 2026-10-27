import { test } from "node:test";
import assert from "node:assert/strict";
import { edgeGec } from "../api/edge-gec.js";

// Fixtures independently generated with the upstream Python implementation.
test("Edge TTS v2 matches upstream and rotates at five-minute boundaries", () => {
  assert.equal(edgeGec(0), "52BC7A17B50DFEC9-28C4394775C8751CD2F6859C030C06DB1489ACAB3B3A7651831FC26895177ED6");
  assert.equal(edgeGec(1793059200), "CD9FA0058D454A42-69275EFA264A5FF82D2B90738881E6791E32878E530EA4D1CEAA32396AF341EF");
  assert.equal(edgeGec(1793059499), edgeGec(1793059200));
  assert.equal(edgeGec(1793059500), "6442E42BF83AC3D6-8A998E308FA7CC42EF92350CD6B93AF7203DB58E76D007EAE63DCE779857945B");
});
