// Official 40 PAS drum rudiments.
// pattern uses "R" (right) and "L" (left) — UI maps to D (Direita) and E (Esquerda).
export type Rudiment = {
  id: string;
  name: string;
  category: "rolls" | "diddle" | "flam" | "drag";
  difficulty: 1 | 2 | 3;
  description: string;
  pattern: string[]; // alternating hands
  defaultBpm: number;
};

export const RUDIMENT_CATEGORIES = {
  rolls: "Rufos",
  diddle: "Diddles",
  flam: "Flams",
  drag: "Drags",
} as const;

export const RUDIMENTS: Rudiment[] = [
  // ROLLS
  { id: "single-stroke-roll", name: "Single Stroke Roll", category: "rolls", difficulty: 1,
    description: "Toques alternados, base de todo estudo rítmico.",
    pattern: ["R","L","R","L","R","L","R","L"], defaultBpm: 80 },
  { id: "single-stroke-four", name: "Single Stroke Four", category: "rolls", difficulty: 1,
    description: "Quatro toques simples com mudança de mão no final.",
    pattern: ["R","L","R","L","L","R","L","R"], defaultBpm: 80 },
  { id: "single-stroke-seven", name: "Single Stroke Seven", category: "rolls", difficulty: 2,
    description: "Sequência de sete toques simples.",
    pattern: ["R","L","R","L","R","L","R"], defaultBpm: 90 },
  { id: "multiple-bounce-roll", name: "Multiple Bounce Roll", category: "rolls", difficulty: 2,
    description: "Rufo de toques múltiplos por mão — som contínuo.",
    pattern: ["R","R","R","L","L","L","R","R","R","L","L","L"], defaultBpm: 70 },
  { id: "triple-stroke-roll", name: "Triple Stroke Roll", category: "rolls", difficulty: 2,
    description: "Três toques por mão alternando.",
    pattern: ["R","R","R","L","L","L"], defaultBpm: 80 },

  // DIDDLE / DOUBLE ROLLS
  { id: "double-stroke-roll", name: "Double Stroke Roll", category: "diddle", difficulty: 1,
    description: "Dois toques por mão — fundamento dos diddles.",
    pattern: ["R","R","L","L","R","R","L","L"], defaultBpm: 80 },
  { id: "five-stroke-roll", name: "Five Stroke Roll", category: "diddle", difficulty: 2,
    description: "Combinação clássica de duplos + simples.",
    pattern: ["R","R","L","L","R","L","R","R","L","L","R"], defaultBpm: 90 },
  { id: "six-stroke-roll", name: "Six Stroke Roll", category: "diddle", difficulty: 2,
    description: "Rufo de seis toques muito musical.",
    pattern: ["R","L","L","R","R","L","L","R","R","L"], defaultBpm: 90 },
  { id: "seven-stroke-roll", name: "Seven Stroke Roll", category: "diddle", difficulty: 2,
    description: "Sete toques alternando duplos.", pattern: ["R","R","L","L","R","R","L"], defaultBpm: 90 },
  { id: "nine-stroke-roll", name: "Nine Stroke Roll", category: "diddle", difficulty: 2,
    description: "Quatro duplos + um simples.", pattern: ["R","R","L","L","R","R","L","L","R"], defaultBpm: 100 },
  { id: "ten-stroke-roll", name: "Ten Stroke Roll", category: "diddle", difficulty: 3,
    description: "Dez toques de rufo alternado.", pattern: ["R","R","L","L","R","R","L","L","R","L"], defaultBpm: 100 },
  { id: "eleven-stroke-roll", name: "Eleven Stroke Roll", category: "diddle", difficulty: 3,
    description: "Onze toques de duplos com acento final.", pattern: ["R","R","L","L","R","R","L","L","R","R","L"], defaultBpm: 100 },
  { id: "thirteen-stroke-roll", name: "Thirteen Stroke Roll", category: "diddle", difficulty: 3,
    description: "Treze toques.", pattern: ["R","R","L","L","R","R","L","L","R","R","L","L","R"], defaultBpm: 110 },
  { id: "fifteen-stroke-roll", name: "Fifteen Stroke Roll", category: "diddle", difficulty: 3,
    description: "Quinze toques.", pattern: ["R","R","L","L","R","R","L","L","R","R","L","L","R","R","L"], defaultBpm: 110 },
  { id: "seventeen-stroke-roll", name: "Seventeen Stroke Roll", category: "diddle", difficulty: 3,
    description: "Dezessete toques.", pattern: ["R","R","L","L","R","R","L","L","R","R","L","L","R","R","L","L","R"], defaultBpm: 120 },
  { id: "single-paradiddle", name: "Single Paradiddle", category: "diddle", difficulty: 1,
    description: "RLRR LRLL — o paradiddle clássico.", pattern: ["R","L","R","R","L","R","L","L"], defaultBpm: 90 },
  { id: "double-paradiddle", name: "Double Paradiddle", category: "diddle", difficulty: 2,
    description: "RLRLRR LRLRLL.", pattern: ["R","L","R","L","R","R","L","R","L","R","L","L"], defaultBpm: 90 },
  { id: "triple-paradiddle", name: "Triple Paradiddle", category: "diddle", difficulty: 3,
    description: "Três alternados + diddle.", pattern: ["R","L","R","L","R","L","R","R","L","R","L","R","L","R","L","L"], defaultBpm: 100 },
  { id: "single-paradiddle-diddle", name: "Single Paradiddle-Diddle", category: "diddle", difficulty: 2,
    description: "RLRRLL — paradiddle com diddle extra.", pattern: ["R","L","R","R","L","L","R","L","R","R","L","L"], defaultBpm: 100 },

  // FLAMS
  { id: "flam", name: "Flam", category: "flam", difficulty: 1,
    description: "Toque com graça acentuando o golpe principal.", pattern: ["R","L","R","L"], defaultBpm: 70 },
  { id: "flam-accent", name: "Flam Accent", category: "flam", difficulty: 2,
    description: "Flam + dois toques simples.", pattern: ["R","L","R","L","R","L"], defaultBpm: 90 },
  { id: "flam-tap", name: "Flam Tap", category: "flam", difficulty: 2,
    description: "Flam seguido de um tap na mesma mão.", pattern: ["R","R","L","L"], defaultBpm: 90 },
  { id: "flamacue", name: "Flamacue", category: "flam", difficulty: 3,
    description: "Flam + quatro toques com acento.", pattern: ["R","L","R","L","R","L"], defaultBpm: 100 },
  { id: "flam-paradiddle", name: "Flam Paradiddle", category: "flam", difficulty: 3,
    description: "Paradiddle iniciado com flam.", pattern: ["R","L","R","R","L","R","L","L"], defaultBpm: 100 },
  { id: "single-flammed-mill", name: "Single Flammed Mill", category: "flam", difficulty: 3,
    description: "Variação invertida do paradiddle com flam.", pattern: ["R","R","L","R","L","L","R","L"], defaultBpm: 100 },
  { id: "flam-paradiddle-diddle", name: "Flam Paradiddle-Diddle", category: "flam", difficulty: 3,
    description: "Paradiddle-diddle com flam.", pattern: ["R","L","R","R","L","L","R","L","R","R","L","L"], defaultBpm: 100 },
  { id: "pataflafla", name: "Pataflafla", category: "flam", difficulty: 3,
    description: "Quatro toques com flams nas pontas.", pattern: ["R","L","R","L"], defaultBpm: 100 },
  { id: "swiss-army-triplet", name: "Swiss Army Triplet", category: "flam", difficulty: 3,
    description: "Tercina com flam estilo suíço.", pattern: ["R","R","L"], defaultBpm: 110 },
  { id: "inverted-flam-tap", name: "Inverted Flam Tap", category: "flam", difficulty: 3,
    description: "Flam tap invertido.", pattern: ["R","L","L","R"], defaultBpm: 100 },
  { id: "flam-drag", name: "Flam Drag", category: "flam", difficulty: 3,
    description: "Flam combinado com drag.", pattern: ["R","L","L","R","R","L"], defaultBpm: 100 },

  // DRAGS
  { id: "drag", name: "Drag", category: "drag", difficulty: 2,
    description: "Dois toques curtos antes da nota principal.", pattern: ["R","R","L","L","R","L"], defaultBpm: 90 },
  { id: "single-drag-tap", name: "Single Drag Tap", category: "drag", difficulty: 2,
    description: "Drag seguido de tap.", pattern: ["L","L","R","L"], defaultBpm: 90 },
  { id: "double-drag-tap", name: "Double Drag Tap", category: "drag", difficulty: 3,
    description: "Dois drags + tap.", pattern: ["L","L","R","L","L","R","L"], defaultBpm: 100 },
  { id: "lesson-25", name: "Lesson 25", category: "drag", difficulty: 3,
    description: "Estudo clássico de drags acentuados.", pattern: ["L","L","R","R","L"], defaultBpm: 100 },
  { id: "single-dragadiddle", name: "Single Dragadiddle", category: "drag", difficulty: 3,
    description: "Drag + paradiddle.", pattern: ["R","R","R","L","R","L"], defaultBpm: 100 },
  { id: "drag-paradiddle-1", name: "Drag Paradiddle #1", category: "drag", difficulty: 3,
    description: "Paradiddle com drag inicial.", pattern: ["R","L","L","R","L","R","R"], defaultBpm: 100 },
  { id: "drag-paradiddle-2", name: "Drag Paradiddle #2", category: "drag", difficulty: 3,
    description: "Variação com dois drags.", pattern: ["R","R","L","L","R","L","R","R"], defaultBpm: 100 },
  { id: "single-ratamacue", name: "Single Ratamacue", category: "drag", difficulty: 3,
    description: "Drag + tercina acentuada.", pattern: ["L","L","R","L","R"], defaultBpm: 100 },
  { id: "double-ratamacue", name: "Double Ratamacue", category: "drag", difficulty: 3,
    description: "Dois ratamacues combinados.", pattern: ["R","L","L","R","L","R"], defaultBpm: 100 },
  { id: "triple-ratamacue", name: "Triple Ratamacue", category: "drag", difficulty: 3,
    description: "Sequência tripla de ratamacues.", pattern: ["R","L","R","L","L","R","L","R"], defaultBpm: 110 },
];

export function getRudiment(id: string) {
  return RUDIMENTS.find((r) => r.id === id);
}
