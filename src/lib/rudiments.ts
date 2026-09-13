// Official 40 PAS drum rudiments, in the official PAS order and categories.
// pattern uses "R" (right) and "L" (left) — UI maps to D (Direita) and E (Esquerda).
// Grace notes (flams / drags) are written as real strokes so the sticking stays readable.
export type Rudiment = {
  id: string;
  name: string;
  category: "rolls" | "diddle" | "flam" | "drag";
  difficulty: 1 | 2 | 3;
  description: string;
  pattern: string[]; // sticking, one full cycle (both hands leading when applicable)
  defaultBpm: number;
};

export const RUDIMENT_CATEGORIES = {
  rolls: "Rufos",
  diddle: "Diddles",
  flam: "Flams",
  drag: "Drags",
} as const;

export const RUDIMENTS: Rudiment[] = [
  /* ---------------- I. ROLL RUDIMENTS (1–15) ---------------- */
  { id: "single-stroke-roll", name: "Single Stroke Roll", category: "rolls", difficulty: 1,
    description: "Toques simples alternados (D E D E). Base de todo estudo rítmico.",
    pattern: ["R","L","R","L","R","L","R","L"], defaultBpm: 80 },
  { id: "single-stroke-four", name: "Single Stroke Four", category: "rolls", difficulty: 1,
    description: "Quatro toques simples em tercinas terminando com um toque acentuado: D E D E D.",
    pattern: ["R","L","R","L","R"], defaultBpm: 80 },
  { id: "single-stroke-seven", name: "Single Stroke Seven", category: "rolls", difficulty: 2,
    description: "Sete toques simples em tercinas com acento no último: D E D E D E D.",
    pattern: ["R","L","R","L","R","L","R"], defaultBpm: 90 },
  { id: "multiple-bounce-roll", name: "Multiple Bounce Roll", category: "rolls", difficulty: 2,
    description: "Rufo apertado (buzz): cada mão solta vários rebotes alternando D E D E.",
    pattern: ["R","L","R","L","R","L","R","L"], defaultBpm: 70 },
  { id: "triple-stroke-roll", name: "Triple Stroke Roll", category: "rolls", difficulty: 2,
    description: "Três toques controlados por mão: DDD EEE DDD EEE.",
    pattern: ["R","R","R","L","L","L","R","R","R","L","L","L"], defaultBpm: 80 },

  { id: "double-stroke-roll", name: "Double Stroke Open Roll", category: "rolls", difficulty: 1,
    description: "Dois toques por mão (DD EE). Fundamento de todos os rufos abertos.",
    pattern: ["R","R","L","L","R","R","L","L"], defaultBpm: 80 },
  { id: "five-stroke-roll", name: "Five Stroke Roll", category: "rolls", difficulty: 2,
    description: "Dois duplos + um toque simples acentuado: DD EE D / EE DD E.",
    pattern: ["R","R","L","L","R","L","L","R","R","L"], defaultBpm: 90 },
  { id: "six-stroke-roll", name: "Six Stroke Roll", category: "rolls", difficulty: 2,
    description: "Acento, dois duplos e acento: D EE DD E.",
    pattern: ["R","L","L","R","R","L"], defaultBpm: 90 },
  { id: "seven-stroke-roll", name: "Seven Stroke Roll", category: "rolls", difficulty: 2,
    description: "Três duplos + um toque acentuado: DD EE DD E.",
    pattern: ["R","R","L","L","R","R","L"], defaultBpm: 90 },
  { id: "nine-stroke-roll", name: "Nine Stroke Roll", category: "rolls", difficulty: 2,
    description: "Quatro duplos + um toque acentuado: DD EE DD EE D.",
    pattern: ["R","R","L","L","R","R","L","L","R"], defaultBpm: 100 },
  { id: "ten-stroke-roll", name: "Ten Stroke Roll", category: "rolls", difficulty: 3,
    description: "Quatro duplos + dois toques simples: DD EE DD EE D E.",
    pattern: ["R","R","L","L","R","R","L","L","R","L"], defaultBpm: 100 },
  { id: "eleven-stroke-roll", name: "Eleven Stroke Roll", category: "rolls", difficulty: 3,
    description: "Cinco duplos + um toque acentuado: DD EE DD EE DD E.",
    pattern: ["R","R","L","L","R","R","L","L","R","R","L"], defaultBpm: 100 },
  { id: "thirteen-stroke-roll", name: "Thirteen Stroke Roll", category: "rolls", difficulty: 3,
    description: "Seis duplos + um toque acentuado: DD EE DD EE DD EE D.",
    pattern: ["R","R","L","L","R","R","L","L","R","R","L","L","R"], defaultBpm: 110 },
  { id: "fifteen-stroke-roll", name: "Fifteen Stroke Roll", category: "rolls", difficulty: 3,
    description: "Sete duplos + um toque acentuado.",
    pattern: ["R","R","L","L","R","R","L","L","R","R","L","L","R","R","L"], defaultBpm: 110 },
  { id: "seventeen-stroke-roll", name: "Seventeen Stroke Roll", category: "rolls", difficulty: 3,
    description: "Oito duplos + um toque acentuado.",
    pattern: ["R","R","L","L","R","R","L","L","R","R","L","L","R","R","L","L","R"], defaultBpm: 120 },

  /* ---------------- II. DIDDLE RUDIMENTS (16–19) ---------------- */
  { id: "single-paradiddle", name: "Single Paradiddle", category: "diddle", difficulty: 1,
    description: "D E DD / E D EE — o paradiddle clássico, acento no primeiro toque.",
    pattern: ["R","L","R","R","L","R","L","L"], defaultBpm: 90 },
  { id: "double-paradiddle", name: "Double Paradiddle", category: "diddle", difficulty: 2,
    description: "D E D E DD / E D E D EE — paradiddle em tercinas.",
    pattern: ["R","L","R","L","R","R","L","R","L","R","L","L"], defaultBpm: 90 },
  { id: "triple-paradiddle", name: "Triple Paradiddle", category: "diddle", difficulty: 3,
    description: "Seis toques alternados + um diddle: D E D E D E DD / E D E D E D EE.",
    pattern: ["R","L","R","L","R","L","R","R","L","R","L","R","L","R","L","L"], defaultBpm: 100 },
  { id: "single-paradiddle-diddle", name: "Single Paradiddle-Diddle", category: "diddle", difficulty: 2,
    description: "D E DD EE / E D EE DD — paradiddle com um diddle extra.",
    pattern: ["R","L","R","R","L","L","L","R","L","L","R","R"], defaultBpm: 100 },

  /* ---------------- III. FLAM RUDIMENTS (20–30) ---------------- */
  { id: "flam", name: "Flam", category: "flam", difficulty: 1,
    description: "Nota de graça bem próxima do toque principal, alternando as mãos.",
    pattern: ["R","L"], defaultBpm: 70 },
  { id: "flam-accent", name: "Flam Accent", category: "flam", difficulty: 2,
    description: "Flam + dois toques simples em tercina: (flam)D E D / (flam)E D E.",
    pattern: ["R","L","R","L","R","L"], defaultBpm: 90 },
  { id: "flam-tap", name: "Flam Tap", category: "flam", difficulty: 2,
    description: "Flam seguido de um tap na mesma mão: (flam)D D (flam)E E.",
    pattern: ["R","R","L","L"], defaultBpm: 90 },
  { id: "flamacue", name: "Flamacue", category: "flam", difficulty: 3,
    description: "Flam, três toques com acento no segundo e flam final: (flam)D E D E (flam)D.",
    pattern: ["R","L","R","L","R"], defaultBpm: 100 },
  { id: "flam-paradiddle", name: "Flam Paradiddle", category: "flam", difficulty: 3,
    description: "Paradiddle iniciado com flam: (flam)D E DD / (flam)E D EE.",
    pattern: ["R","L","R","R","L","R","L","L"], defaultBpm: 100 },
  { id: "single-flammed-mill", name: "Single Flammed Mill", category: "flam", difficulty: 3,
    description: "Paradiddle invertido com flam: (flam)D D E D / (flam)E E D E.",
    pattern: ["R","R","L","R","L","L","R","L"], defaultBpm: 100 },
  { id: "flam-paradiddle-diddle", name: "Flam Paradiddle-Diddle", category: "flam", difficulty: 3,
    description: "Paradiddle-diddle com flam: (flam)D E DD EE / (flam)E D EE DD.",
    pattern: ["R","L","R","R","L","L","L","R","L","L","R","R"], defaultBpm: 100 },
  { id: "pataflafla", name: "Pataflafla", category: "flam", difficulty: 3,
    description: "Quatro toques com flams no primeiro e no último: (flam)D E D (flam)E.",
    pattern: ["R","L","R","L"], defaultBpm: 100 },
  { id: "swiss-army-triplet", name: "Swiss Army Triplet", category: "flam", difficulty: 3,
    description: "Tercina suíça: (flam)D D E / (flam)E E D.",
    pattern: ["R","R","L","L","L","R"], defaultBpm: 110 },
  { id: "inverted-flam-tap", name: "Inverted Flam Tap", category: "flam", difficulty: 3,
    description: "Flam tap invertido: DD EE com os flams caindo no segundo toque de cada par.",
    pattern: ["R","R","L","L"], defaultBpm: 100 },
  { id: "flam-drag", name: "Flam Drag", category: "flam", difficulty: 3,
    description: "Flam, drag e toque: (flam)D EE D / (flam)E DD E.",
    pattern: ["R","L","L","R","L","R","R","L"], defaultBpm: 100 },

  /* ---------------- IV. DRAG RUDIMENTS (31–40) ---------------- */
  { id: "drag", name: "Drag (Ruff)", category: "drag", difficulty: 2,
    description: "Dois toques curtos de graça antes da nota principal: EE D / DD E.",
    pattern: ["L","L","R","R","R","L"], defaultBpm: 90 },
  { id: "single-drag-tap", name: "Single Drag Tap", category: "drag", difficulty: 2,
    description: "Drag + tap acentuado: EE D E / DD E D.",
    pattern: ["L","L","R","L","R","R","L","R"], defaultBpm: 90 },
  { id: "double-drag-tap", name: "Double Drag Tap", category: "drag", difficulty: 3,
    description: "Dois drags seguidos de um tap: EE D EE D E / DD E DD E D.",
    pattern: ["L","L","R","L","L","R","L","R","R","L","R","R","L","R"], defaultBpm: 100 },
  { id: "lesson-25", name: "Lesson 25 (Two and Three Stroke Ruff)", category: "drag", difficulty: 3,
    description: "Drag com acento no toque seguinte: EE D E / DD E D — estudo clássico de controle.",
    pattern: ["L","L","R","L","R","R","L","R"], defaultBpm: 100 },
  { id: "single-dragadiddle", name: "Single Dragadiddle", category: "drag", difficulty: 3,
    description: "Toque acentuado com drag + diddle: D DD E DD / E EE D EE.",
    pattern: ["R","R","R","L","R","R","L","L","L","R","L","L"], defaultBpm: 100 },
  { id: "drag-paradiddle-1", name: "Drag Paradiddle #1", category: "drag", difficulty: 3,
    description: "Acento, drag e paradiddle: D EE D E DD / E DD E D EE.",
    pattern: ["R","L","L","R","L","R","R","L","R","R","L","R","L","L"], defaultBpm: 100 },
  { id: "drag-paradiddle-2", name: "Drag Paradiddle #2", category: "drag", difficulty: 3,
    description: "Dois acentos, drag e paradiddle: D D EE D E DD.",
    pattern: ["R","R","L","L","R","L","R","R","L","L","R","R","L","R","L","L"], defaultBpm: 100 },
  { id: "single-ratamacue", name: "Single Ratamacue", category: "drag", difficulty: 3,
    description: "Drag + tercina com acento final: EE D E D / DD E D E.",
    pattern: ["L","L","R","L","R","R","R","L","R","L"], defaultBpm: 100 },
  { id: "double-ratamacue", name: "Double Ratamacue", category: "drag", difficulty: 3,
    description: "Dois drags antes da tercina: EE D EE D E D.",
    pattern: ["L","L","R","L","L","R","L","R","R","R","L","R","R","L","R","L"], defaultBpm: 100 },
  { id: "triple-ratamacue", name: "Triple Ratamacue", category: "drag", difficulty: 3,
    description: "Três drags antes da tercina: EE D EE D EE D E D.",
    pattern: ["L","L","R","L","L","R","L","L","R","L","R"], defaultBpm: 110 },
];

export function getRudiment(id: string) {
  return RUDIMENTS.find((r) => r.id === id);
}
