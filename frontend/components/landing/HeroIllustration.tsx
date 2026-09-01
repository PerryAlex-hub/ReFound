/**
 * Isometric campus-scene illustration for the marketing hero, built entirely from
 * projected SVG primitives (no external asset) in the orange/navy brand palette.
 *
 * Everything is placed on a small dimetric grid via `iso(a, b, height)`, which is the
 * standard 2:1 isometric projection: moving along the "a" axis steps right+down on
 * screen, moving along "b" steps left+down, and `height` lifts a point straight up.
 */

const TILE = { sx: 30, sy: 15 };
const ORIGIN = { x: 300, y: 150 };

const ORANGE_A = '#FB923C';
const ORANGE_B = '#F97316';
const NAVY_A = '#334155';
const NAVY_B = '#1E293B';
const CREAM = '#FFF7ED';

type Pt = [number, number];

function iso(a: number, b: number, h = 0): Pt {
  return [ORIGIN.x + (a - b) * TILE.sx, ORIGIN.y + (a + b) * TILE.sy - h];
}

function poly(pts: Pt[]): string {
  return pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
}

function topFace(a: number, b: number, w: number, d: number, h: number): string {
  return poly([iso(a, b, h), iso(a + w, b, h), iso(a + w, b + d, h), iso(a, b + d, h)]);
}

function rightFace(a: number, b: number, w: number, d: number, h1: number, h2: number): string {
  return poly([iso(a + w, b, h2), iso(a + w, b + d, h2), iso(a + w, b + d, h1), iso(a + w, b, h1)]);
}

function leftFace(a: number, b: number, w: number, d: number, h1: number, h2: number): string {
  return poly([iso(a, b + d, h2), iso(a + w, b + d, h2), iso(a + w, b + d, h1), iso(a, b + d, h1)]);
}

const GRID_A = 7;
const GRID_B = 6;

const floorTiles: { key: string; points: string; fill: string }[] = [];
for (let a = 0; a < GRID_A; a++) {
  for (let b = 0; b < GRID_B; b++) {
    const isOrange = (a + b) % 2 === 0;
    const isLight = (a * 3 + b) % 2 === 0;
    const fill = isOrange ? (isLight ? ORANGE_A : ORANGE_B) : isLight ? NAVY_A : NAVY_B;
    floorTiles.push({ key: `${a}-${b}`, points: topFace(a, b, 1, 1, 0), fill });
  }
}

function Building({ a, b, w, d, h }: { a: number; b: number; w: number; d: number; h: number }) {
  return (
    <g>
      <polygon points={leftFace(a, b, w, d, 0, h)} fill={CREAM} />
      <polygon points={rightFace(a, b, w, d, 0, h)} fill={NAVY_B} />
      <polygon points={leftFace(a, b, w, d, h * 0.58, h * 0.78)} fill={ORANGE_A} opacity={0.85} />
      <polygon points={topFace(a, b, w, d, h)} fill={ORANGE_B} stroke={CREAM} strokeWidth={1.5} />
    </g>
  );
}

function Person({ a, b, body }: { a: number; b: number; body: string }) {
  const [x, y] = iso(a, b, 0);
  return (
    <g>
      <ellipse cx={x} cy={y + 3} rx={7} ry={2.5} fill="#000" opacity={0.12} />
      <rect x={x - 5} y={y - 17} width={10} height={15} rx={4} fill={body} />
      <circle cx={x} cy={y - 21} r={5} fill={NAVY_B} />
    </g>
  );
}

function Bag({ a, b }: { a: number; b: number }) {
  const [x, y] = iso(a, b, 0);
  return (
    <g>
      <ellipse cx={x} cy={y + 3} rx={9} ry={3} fill="#000" opacity={0.1} />
      <path d={`M ${x - 5} ${y - 12} Q ${x} ${y - 20} ${x + 5} ${y - 12}`} stroke={NAVY_B} strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <rect x={x - 9} y={y - 12} width={18} height={13} rx={3} fill={NAVY_B} />
    </g>
  );
}

function Keys({ a, b }: { a: number; b: number }) {
  const [x, y] = iso(a, b, 0);
  return (
    <g stroke={ORANGE_B} strokeWidth={2} fill="none" strokeLinecap="round">
      <ellipse cx={x} cy={y + 1} rx={7} ry={2} stroke="none" fill="#000" opacity={0.08} />
      <circle cx={x - 6} cy={y - 6} r={4} />
      <line x1={x - 2} y1={y - 6} x2={x + 8} y2={y - 6} />
      <line x1={x + 4} y1={y - 6} x2={x + 4} y2={y - 2} />
      <line x1={x + 7} y1={y - 6} x2={x + 7} y2={y - 3} />
    </g>
  );
}

function Books({ a, b }: { a: number; b: number }) {
  const [x, y] = iso(a, b, 0);
  const colors = [ORANGE_B, ORANGE_A, NAVY_A];
  return (
    <g>
      <ellipse cx={x} cy={y + 2} rx={11} ry={3} fill="#000" opacity={0.1} />
      {colors.map((c, i) => (
        <rect
          key={c}
          x={x - 10}
          y={y - 4 - i * 4.5}
          width={20}
          height={4}
          rx={1}
          fill={c}
          transform={`rotate(${(i - 1) * 4} ${x} ${y - 4 - i * 4.5})`}
        />
      ))}
    </g>
  );
}

function Tree({ a, b }: { a: number; b: number }) {
  const [x, y] = iso(a, b, 0);
  return (
    <g>
      <ellipse cx={x} cy={y + 2} rx={10} ry={3} fill="#000" opacity={0.1} />
      <rect x={x - 1.5} y={y - 14} width={3} height={14} fill="#7C4A24" />
      <circle cx={x} cy={y - 20} r={11} fill={NAVY_B} opacity={0.9} />
      <circle cx={x - 4} cy={y - 24} r={7} fill={ORANGE_B} opacity={0.9} />
    </g>
  );
}

const PLAZA = iso(3, 2.5, 0);

/** Evocative isometric campus-recovery scene: buildings, a central plaza, and scattered lost/found items. */
export function HeroIllustration() {
  return (
    <div className="relative w-full aspect-[3/2] rounded-[28px] bg-[#FFF7ED] shadow-[0_20px_60px_-15px_rgba(249,115,22,0.35)] overflow-hidden">
      <svg viewBox="0 0 600 420" className="w-full h-full" role="img" aria-label="Isometric illustration of students recovering lost items across campus">
        <defs>
          <radialGradient id="plazaGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F97316" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#F97316" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="600" height="420" fill="#FFF7ED" />
        <ellipse cx={PLAZA[0]} cy={PLAZA[1]} rx={150} ry={90} fill="url(#plazaGlow)" />

        {floorTiles.map((t) => (
          <polygon key={t.key} points={t.points} fill={t.fill} stroke="#FFF7ED" strokeWidth={0.75} />
        ))}

        <Tree a={6} b={0} />
        <Tree a={0} b={5} />

        <Building a={0} b={1} w={2} d={2} h={150} />
        <Building a={4} b={3} w={2} d={2} h={170} />

        {/* central plaza / recovery hub */}
        <ellipse cx={PLAZA[0]} cy={PLAZA[1]} rx={92} ry={44} fill="none" stroke={NAVY_B} strokeWidth={9} />
        <ellipse cx={PLAZA[0]} cy={PLAZA[1]} rx={92} ry={44} fill="none" stroke="#FFFFFF" strokeWidth={2.5} />
        <ellipse cx={PLAZA[0]} cy={PLAZA[1]} rx={26} ry={13} fill={ORANGE_B} />
        <ellipse cx={PLAZA[0]} cy={PLAZA[1]} rx={12} ry={6} fill={CREAM} />

        <Bag a={2} b={3.4} />
        <Keys a={5} b={3.6} />
        <Books a={1.2} b={2.1} />

        <Person a={1.4} b={4.2} body={ORANGE_B} />
        <Person a={2.6} b={4.6} body={NAVY_A} />
        <Person a={4.8} b={2} body={ORANGE_A} />
        <Person a={3.8} b={1.4} body={NAVY_B} />
      </svg>
    </div>
  );
}
