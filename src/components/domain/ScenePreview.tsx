import { cn, hashString } from '@/lib/utils'

interface Palette {
  wall: string
  shade: string
  floor: string
  floorLine: string
  rug: string
  rugLine: string
  wood: string
  woodDark: string
  woodLight: string
  fabric: string
  fabricLight: string
  fabricDark: string
  green: string
  greenDark: string
  sky: string
  line: string
  board: string
  skin: string
  hair: string
  accent: string
}

type Kind = 'classroom' | 'home' | 'play' | 'calm' | 'store' | 'outdoor'

const basePalettes: Record<Kind, Palette> = {
  classroom: {
    wall: '#eef3f8',
    shade: '#e6edf4',
    floor: '#eee3d3',
    floorLine: '#e0d0ba',
    rug: '#dce9f2',
    rugLine: '#c2d8e8',
    wood: '#c8a47d',
    woodDark: '#ab8862',
    woodLight: '#dec4a4',
    fabric: '#84aad5',
    fabricLight: '#a9c5e4',
    fabricDark: '#6d93c0',
    green: '#8db79c',
    greenDark: '#6f9d80',
    sky: '#d8eaf6',
    line: '#dbe4ee',
    board: '#fbfcfe',
    skin: '#e9b99c',
    hair: '#3f3747',
    accent: '#e3b38f',
  },
  home: {
    wall: '#f7f2ea',
    shade: '#efe8dd',
    floor: '#e9d9c4',
    floorLine: '#dcc8ad',
    rug: '#eae0d2',
    rugLine: '#d7c5b0',
    wood: '#bd9770',
    woodDark: '#9f7b53',
    woodLight: '#d9bb96',
    fabric: '#a8bfa6',
    fabricLight: '#c3d4bf',
    fabricDark: '#8ca58a',
    green: '#88ad8b',
    greenDark: '#6b9270',
    sky: '#e2eef4',
    line: '#e6ddd0',
    board: '#fffdf8',
    skin: '#e6b596',
    hair: '#4a3b32',
    accent: '#d9a47f',
  },
  play: {
    wall: '#f0f6f3',
    shade: '#e7f0eb',
    floor: '#eadfc9',
    floorLine: '#ddcdb1',
    rug: '#d6ebe1',
    rugLine: '#b8dccd',
    wood: '#c9a67d',
    woodDark: '#ab8962',
    woodLight: '#dfc4a3',
    fabric: '#e0a184',
    fabricLight: '#efc0a9',
    fabricDark: '#c9886d',
    green: '#8cb89d',
    greenDark: '#6e9c81',
    sky: '#dcecf7',
    line: '#dde7e1',
    board: '#fbfdfb',
    skin: '#e7b596',
    hair: '#463a33',
    accent: '#e7c07d',
  },
  calm: {
    wall: '#eff4f4',
    shade: '#e7eeee',
    floor: '#e8ddcd',
    floorLine: '#dacbb7',
    rug: '#dfe9e5',
    rugLine: '#c7d8d1',
    wood: '#c4a27c',
    woodDark: '#a58360',
    woodLight: '#dcc2a1',
    fabric: '#a9bfba',
    fabricLight: '#c3d4d0',
    fabricDark: '#8ba6a0',
    green: '#8fb7a1',
    greenDark: '#709c83',
    sky: '#e1eef3',
    line: '#dde7e6',
    board: '#fbfdfc',
    skin: '#e8b99a',
    hair: '#403a3c',
    accent: '#d9b48c',
  },
  store: {
    wall: '#eef4f5',
    shade: '#e5eeef',
    floor: '#e9e2d5',
    floorLine: '#dbd1bf',
    rug: '#e0ece8',
    rugLine: '#c7ddd6',
    wood: '#c7a77f',
    woodDark: '#a98a64',
    woodLight: '#ddc5a4',
    fabric: '#7fb3ac',
    fabricLight: '#a7cdc8',
    fabricDark: '#679c95',
    green: '#93b8a4',
    greenDark: '#749b86',
    sky: '#dcebf4',
    line: '#dce6e7',
    board: '#fbfdfd',
    skin: '#e7b596',
    hair: '#443a38',
    accent: '#dea96f',
  },
  outdoor: {
    wall: '#dcebf6',
    shade: '#d0e3f1',
    floor: '#cfe0c8',
    floorLine: '#bcd3b5',
    rug: '#ecdfc9',
    rugLine: '#dbc9ab',
    wood: '#c19a70',
    woodDark: '#a07b52',
    woodLight: '#d9bd98',
    fabric: '#8fb28e',
    fabricLight: '#b3cdb1',
    fabricDark: '#749773',
    green: '#8fb996',
    greenDark: '#6c9a74',
    sky: '#dcebf6',
    line: '#d5e4d0',
    board: '#ffffff',
    skin: '#e8b799',
    hair: '#463b34',
    accent: '#e8c987',
  },
}

const accentOptions = ['#e3b38f', '#8db79c', '#84aad5', '#e0c07d']
const fabricOptions = [
  ['#84aad5', '#a9c5e4', '#6d93c0'],
  ['#a8bfa6', '#c3d4bf', '#8ca58a'],
  ['#e0a184', '#efc0a9', '#c9886d'],
  ['#9fb6c9', '#c2d2df', '#849db2'],
]

function resolvePalette(kind: Kind, seed: string): Palette {
  const hash = hashString(seed)
  const base = basePalettes[kind]
  const fabric = fabricOptions[hash % fabricOptions.length]
  return {
    ...base,
    accent: accentOptions[hash % accentOptions.length],
    fabric: fabric[0],
    fabricLight: fabric[1],
    fabricDark: fabric[2],
  }
}

function Window({ palette, x, y, width = 176, height = 124 }: {
  palette: Palette
  x: number
  y: number
  width?: number
  height?: number
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={10}
        fill={palette.sky}
        stroke={palette.woodLight}
        strokeWidth="6"
      />
      <path
        d={`M${x + width / 2} ${y}v${height}M${x} ${y + height / 2}h${width}`}
        stroke={palette.woodLight}
        strokeWidth="5"
      />
      <rect x={x - 10} y={y + height} width={width + 20} height="10" rx="5" fill={palette.wood} />
      <path
        d={`M${x + 44} 258 L${x - 2} 400 h92 l58 -142 Z`}
        fill="#ffffff"
        opacity="0.42"
      />
      <circle cx={x + 38} cy={y + 38} r="15" fill="#ffffff" opacity="0.55" />
      <circle cx={x + 60} cy={y + 40} r="20" fill="#ffffff" opacity="0.45" />
    </g>
  )
}

function Plant({ palette, x, y, scale = 1 }: {
  palette: Palette
  x: number
  y: number
  scale?: number
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse cx="0" cy="3" rx="26" ry="5" fill="rgba(20,35,55,0.07)" />
      <path d="M-15 0h30l-4 34h-22Z" fill={palette.woodLight} stroke={palette.wood} strokeWidth="1.5" />
      <path
        d="M0 -2C-6 -22 -18 -34 -30 -40M0 -4C2 -30 6 -48 2 -64M2 -4C14 -28 24 -38 34 -44M0 -4C10 -20 10 -36 16 -48"
        stroke={palette.greenDark}
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="-31" cy="-42" rx="10" ry="6" transform="rotate(-30 -31 -42)" fill={palette.green} />
      <ellipse cx="4" cy="-66" rx="9" ry="5" transform="rotate(-72 4 -66)" fill={palette.greenDark} />
      <ellipse cx="36" cy="-46" rx="10" ry="6" transform="rotate(28 36 -46)" fill={palette.green} />
      <ellipse cx="18" cy="-50" rx="8" ry="5" transform="rotate(58 18 -50)" fill={palette.greenDark} opacity="0.8" />
    </g>
  )
}

function Person({
  x,
  y,
  scale = 1,
  shirt,
  palette,
  hairLong = false,
}: {
  x: number
  y: number
  scale?: number
  shirt: string
  palette: Palette
  hairLong?: boolean
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse cx="0" cy="2" rx="27" ry="5" fill="rgba(20,35,55,0.09)" />
      <path d="M-23 0c0-38 7-54 23-54s23 16 23 54Z" fill={shirt} />
      <path d="M-21 -39c-8 6-12 17-13 27" stroke={shirt} strokeWidth="9" strokeLinecap="round" />
      <path d="M21 -39c8 6 12 17 13 27" stroke={shirt} strokeWidth="9" strokeLinecap="round" />
      <circle cx="0" cy="-68" r="17" fill={palette.skin} />
      {hairLong ? (
        <path d="M-17 -70c0-18 8-25 17-25s17 8 17 22c-4 8-4 18-2 24-6-10-15-15-24-15-7 0-10 4-8-6Z" fill={palette.hair} />
      ) : (
        <path d="M-17 -71c0-16 8-22 17-22s17 7 17 19c-9-7-25-7-34 3Z" fill={palette.hair} />
      )}
      <circle cx="-6" cy="-68" r="1.3" fill={palette.hair} />
      <circle cx="6" cy="-68" r="1.3" fill={palette.hair} />
      <path d="M-3 -61c2 2 5 2 7 0" stroke={palette.hair} strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M-12 0v8M12 0v8" stroke={palette.hair} strokeWidth="6" strokeLinecap="round" opacity="0.6" />
    </g>
  )
}

function Shelf({ palette, x, y, accent }: { palette: Palette; x: number; y: number; accent: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width="112" height="154" rx="8" fill={palette.woodLight} stroke={palette.wood} strokeWidth="2" />
      <path d="M0 52h112M0 104h112" stroke={palette.wood} strokeWidth="3" />
      <rect x="13" y="20" width="10" height="30" rx="2" fill={accent} />
      <rect x="27" y="14" width="9" height="36" rx="2" fill={palette.fabric} />
      <rect x="40" y="22" width="12" height="28" rx="2" fill={palette.green} />
      <rect x="56" y="16" width="8" height="34" rx="2" fill={palette.woodDark} />
      <rect x="68" y="26" width="22" height="24" rx="4" fill="#f4eadb" />
      <circle cx="22" cy="76" r="9" fill={accent} opacity="0.85" />
      <rect x="40" y="66" width="24" height="18" rx="3" fill={palette.fabric} />
      <rect x="72" y="62" width="26" height="22" rx="4" fill="#f4eadb" />
      <rect x="16" y="118" width="20" height="24" rx="3" fill={palette.fabricLight} />
      <rect x="42" y="112" width="11" height="30" rx="2" fill={palette.greenDark} />
      <rect x="58" y="120" width="30" height="22" rx="4" fill={accent} opacity="0.8" />
    </g>
  )
}

function Board({ palette, x, y }: { palette: Palette; x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width="136" height="92" rx="9" fill={palette.board} stroke={palette.line} strokeWidth="3" />
      <rect width="136" height="12" rx="6" fill={palette.fabricLight} opacity="0.7" />
      <path d="M18 38h58M18 54h42M18 70h32" stroke={palette.line} strokeWidth="4" strokeLinecap="round" />
      <circle cx="108" cy="42" r="9" fill={palette.accent} opacity="0.75" />
      <rect x="98" y="58" width="22" height="16" rx="3" fill={palette.green} opacity="0.7" />
    </g>
  )
}

function IndoorScene({ kind, palette }: { kind: Kind; palette: Palette }) {
  const isHome = kind === 'home'
  const isPlay = kind === 'play'
  const isCalm = kind === 'calm'
  const isStore = kind === 'store'
  const isClassroom = kind === 'classroom'

  return (
    <>
      <rect width="640" height="400" fill={palette.wall} />
      <rect width="640" height="262" fill={palette.wall} />
      <rect y="262" width="640" height="138" fill={palette.floor} />
      <path d="M0 262h640M0 262 640 400M640 262 0 400" stroke={palette.floorLine} strokeWidth="1" opacity="0.5" />
      <rect width="640" height="56" fill={palette.shade} opacity="0.55" />
      <path d="M0 0h238L66 400H0Z" fill="#ffffff" opacity="0.16" />

      <Window palette={palette} x={54} y={58} width={174} height={122} />
      <rect x={42} y={182} width={198} height="10" rx="5" fill={palette.wood} />

      {isClassroom && (
        <>
          <Board palette={palette} x={296} y={64} />
          <Shelf palette={palette} x={480} y={100} accent={palette.accent} />
          <Plant palette={palette} x={592} y={236} scale={0.86} />
        </>
      )}

      {isHome && (
        <>
          <g>
            <rect x="300" y="84" width="66" height="52" rx="6" fill={palette.board} stroke={palette.woodLight} strokeWidth="4" />
            <path d="M310 122l14-20 10 12 8-8 16 16Z" fill={palette.green} opacity="0.8" />
            <circle cx="344" cy="98" r="5" fill={palette.accent} />
            <rect x="382" y="72" width="50" height="66" rx="6" fill={palette.board} stroke={palette.woodLight} strokeWidth="4" />
            <path d="M392 124c4-16 12-24 24-26" stroke={palette.fabric} strokeWidth="3" fill="none" />
            <circle cx="412" cy="92" r="7" fill={palette.accent} opacity="0.65" />
          </g>
          <Shelf palette={palette} x={488} y={128} accent={palette.accent} />
          <Plant palette={palette} x={596} y={244} scale={1.05} />
          <g>
            <ellipse cx="428" cy="332" rx="126" ry="38" fill={palette.rug} />
            <ellipse cx="428" cy="332" rx="98" ry="26" fill="none" stroke={palette.rugLine} strokeWidth="2" strokeDasharray="6 7" />
            <rect x="336" y="250" width="204" height="58" rx="14" fill={palette.fabric} />
            <rect x="350" y="216" width="176" height="48" rx="13" fill={palette.fabricLight} />
            <rect x="326" y="264" width="24" height="60" rx="10" fill={palette.fabricDark} />
            <rect x="526" y="264" width="24" height="60" rx="10" fill={palette.fabricDark} />
            <rect x="378" y="236" width="58" height="26" rx="8" fill={palette.fabricLight} opacity="0.8" />
            <rect x="456" y="236" width="34" height="26" rx="8" fill={palette.accent} opacity="0.5" />
            <path d="M346 324v10M522 324v10" stroke={palette.woodDark} strokeWidth="5" strokeLinecap="round" />
            <ellipse cx="226" cy="326" rx="78" ry="16" fill="rgba(20,35,55,0.06)" />
            <rect x="170" y="294" width="116" height="13" rx="6" fill={palette.wood} />
            <path d="M182 307v26M274 307v26" stroke={palette.woodDark} strokeWidth="6" strokeLinecap="round" />
            <rect x="204" y="282" width="28" height="10" rx="2" fill={palette.accent} />
            <rect x="236" y="286" width="20" height="8" rx="2" fill={palette.fabric} />
          </g>
          <Person x={282} y={350} scale={0.82} shirt={palette.fabric} palette={palette} />
        </>
      )}

      {isPlay && (
        <>
          <Shelf palette={palette} x={54} y={200} accent={palette.accent} />
          <Shelf palette={palette} x={500} y={158} accent={palette.green} />
          <Plant palette={palette} x={602} y={252} scale={0.9} />
          <ellipse cx="322" cy="330" rx="170" ry="52" fill={palette.rug} />
          <ellipse cx="322" cy="330" rx="130" ry="35" fill="none" stroke={palette.rugLine} strokeWidth="2.5" strokeDasharray="7 8" />
          <circle cx="398" cy="312" r="15" fill={palette.accent} />
          <path d="M388 306c8 4 15 9 19 16M388 318c8-4 15-9 19-16" stroke="#ffffff" strokeWidth="2" opacity="0.6" fill="none" />
          <rect x="214" y="300" width="26" height="26" rx="5" fill={palette.fabric} />
          <rect x="244" y="304" width="22" height="22" rx="5" fill={palette.green} />
          <circle cx="196" cy="318" r="12" fill={palette.woodLight} stroke={palette.wood} strokeWidth="2" />
          <Person x={282} y={370} scale={0.84} shirt={palette.fabric} palette={palette} />
          <Person x={372} y={366} scale={0.8} shirt={palette.accent} palette={palette} hairLong />
        </>
      )}

      {isCalm && (
        <>
          <g>
            <rect x="300" y="76" width="58" height="48" rx="6" fill={palette.board} stroke={palette.woodLight} strokeWidth="4" />
            <path d="M312 112l12-18 8 10 6-6 12 14Z" fill={palette.green} opacity="0.75" />
            <rect x="374" y="88" width="44" height="36" rx="5" fill={palette.board} stroke={palette.woodLight} strokeWidth="4" />
            <path d="M384 104h24M384 112h16" stroke={palette.rugLine} strokeWidth="3" strokeLinecap="round" />
          </g>
          <Shelf palette={palette} x={52} y={196} accent={palette.accent} />
          <Plant palette={palette} x={580} y={256} scale={1.1} />
          <ellipse cx="364" cy="336" rx="150" ry="42" fill={palette.rug} />
          <g>
            <rect x="300" y="244" width="140" height="58" rx="18" fill={palette.fabric} />
            <rect x="316" y="212" width="108" height="46" rx="15" fill={palette.fabricLight} />
            <rect x="286" y="256" width="24" height="66" rx="10" fill={palette.fabricDark} />
            <rect x="430" y="256" width="24" height="66" rx="10" fill={palette.fabricDark} />
            <rect x="340" y="278" width="52" height="22" rx="7" fill={palette.accent} opacity="0.6" />
            <path d="M310 322v8M424 322v8" stroke={palette.woodDark} strokeWidth="5" strokeLinecap="round" />
          </g>
          <ellipse cx="192" cy="326" rx="58" ry="14" fill="rgba(20,35,55,0.06)" />
          <rect x="150" y="294" width="84" height="12" rx="6" fill={palette.wood} />
          <path d="M162 306v24M226 306v24" stroke={palette.woodDark} strokeWidth="5" strokeLinecap="round" />
          <rect x="180" y="282" width="24" height="10" rx="2" fill={palette.fabricLight} />
          <Person x={246} y={360} scale={0.78} shirt={palette.fabricDark} palette={palette} />
        </>
      )}

      {isStore && (
        <>
          <g transform="translate(44 96)">
            <rect width="150" height="168" rx="8" fill={palette.woodLight} stroke={palette.wood} strokeWidth="2" />
            <path d="M0 56h150M0 112h150" stroke={palette.wood} strokeWidth="3" />
            {[
              [16, 26, palette.accent],
              [40, 18, palette.fabric],
              [62, 30, palette.green],
              [90, 22, palette.woodDark],
              [114, 26, palette.accent],
              [16, 76, palette.fabricLight],
              [44, 70, palette.green],
              [76, 78, palette.fabric],
              [106, 72, palette.accent],
              [18, 132, palette.green],
              [58, 128, palette.fabric],
              [96, 134, palette.accent],
            ].map(([cx, cy, color], index) => (
              <circle
                key={index}
                cx={Number(cx) + 8}
                cy={Number(cy) + 4}
                r={index % 3 === 0 ? 11 : 8}
                fill={String(color)}
                opacity="0.85"
              />
            ))}
          </g>
          <g transform="translate(446 96)">
            <rect width="150" height="168" rx="8" fill={palette.woodLight} stroke={palette.wood} strokeWidth="2" />
            <path d="M0 56h150M0 112h150" stroke={palette.wood} strokeWidth="3" />
            {[
              [18, 26, palette.fabric],
              [50, 20, palette.accent],
              [82, 28, palette.green],
              [112, 22, palette.fabricLight],
              [20, 74, palette.green],
              [54, 80, palette.fabric],
              [92, 72, palette.accent],
              [116, 78, palette.woodDark],
              [22, 132, palette.accent],
              [64, 128, palette.fabricLight],
              [104, 134, palette.green],
            ].map(([cx, cy, color], index) => (
              <circle
                key={index}
                cx={Number(cx) + 8}
                cy={Number(cy) + 4}
                r={index % 3 === 0 ? 11 : 8}
                fill={String(color)}
                opacity="0.85"
              />
            ))}
          </g>
          <ellipse cx="320" cy="332" rx="120" ry="32" fill={palette.rug} />
          <g>
            <rect x="248" y="236" width="148" height="16" rx="6" fill={palette.wood} />
            <rect x="256" y="252" width="132" height="42" rx="6" fill={palette.woodLight} stroke={palette.wood} strokeWidth="2" />
            <path d="M256 270h132" stroke={palette.wood} strokeWidth="2" />
            <rect x="274" y="280" width="28" height="10" rx="2" fill={palette.fabric} />
            <rect x="310" y="278" width="22" height="12" rx="2" fill={palette.accent} />
            <rect x="342" y="282" width="26" height="8" rx="2" fill={palette.green} />
            <circle cx="316" cy="226" r="10" fill={palette.accent} opacity="0.8" />
            <path d="M300 230h32" stroke={palette.woodDark} strokeWidth="3" strokeLinecap="round" />
          </g>
          <Person x={392} y={318} scale={0.88} shirt={palette.fabricDark} palette={palette} />
          <Person x={230} y={366} scale={0.8} shirt={palette.fabric} palette={palette} />
          <Plant palette={palette} x={606} y={260} scale={0.85} />
        </>
      )}

      {isClassroom && (
        <>
          <ellipse cx="322" cy="336" rx="178" ry="44" fill={palette.rug} />
          <ellipse cx="322" cy="336" rx="140" ry="30" fill="none" stroke={palette.rugLine} strokeWidth="2" />
          <g>
            <rect x="256" y="284" width="132" height="12" rx="6" fill={palette.wood} />
            <rect x="266" y="296" width="7" height="38" rx="3" fill={palette.woodDark} />
            <rect x="371" y="296" width="7" height="38" rx="3" fill={palette.woodDark} />
            <rect x="286" y="272" width="34" height="10" rx="2" fill={palette.accent} />
            <rect x="324" y="276" width="22" height="8" rx="2" fill={palette.fabricLight} />
            <rect x="214" y="300" width="34" height="8" rx="4" fill={palette.woodLight} />
            <path d="M220 308v24M240 308v24" stroke={palette.woodDark} strokeWidth="4" strokeLinecap="round" />
            <rect x="398" y="300" width="34" height="8" rx="4" fill={palette.woodLight} />
            <path d="M404 308v24M424 308v24" stroke={palette.woodDark} strokeWidth="4" strokeLinecap="round" />
          </g>
          <Person x={214} y={352} scale={0.78} shirt={palette.fabric} palette={palette} />
          <Person x={466} y={354} scale={0.94} shirt={palette.fabricDark} palette={palette} hairLong />
        </>
      )}
    </>
  )
}

function OutdoorScene({ palette }: { palette: Palette }) {
  return (
    <>
      <rect width="640" height="400" fill={palette.sky} />
      <circle cx="538" cy="74" r="32" fill="#f2d9a4" />
      <g fill="#ffffff" opacity="0.7">
        <ellipse cx="142" cy="88" rx="42" ry="16" />
        <ellipse cx="176" cy="80" rx="30" ry="18" />
        <ellipse cx="112" cy="80" rx="24" ry="13" />
        <ellipse cx="398" cy="58" rx="34" ry="12" />
        <ellipse cx="426" cy="52" rx="24" ry="14" />
      </g>
      <path d="M0 236c70-34 150-36 226-6 66 26 138 30 214 2 66-24 136-26 200-2v62H0Z" fill="#cfe3d2" opacity="0.8" />
      <path d="M0 272c92-22 182-18 268 10 84 28 184 30 372-6v124H0Z" fill={palette.floor} />
      <path d="M252 400c22-56 58-94 100-144 28-34 62-58 112-80-68 8-120 28-158 60-42 36-66 88-88 164Z" fill={palette.rug} />
      <path d="M398 400c10-40 32-76 68-108 26-24 58-38 96-46-58-2-108 14-144 44-34 28-50 66-58 110Z" fill={palette.rugLine} opacity="0.35" />
      <g>
        <rect x="86" y="238" width="16" height="86" rx="7" fill={palette.woodDark} />
        <circle cx="94" cy="206" r="48" fill={palette.green} />
        <circle cx="62" cy="228" r="30" fill={palette.greenDark} opacity="0.9" />
        <circle cx="124" cy="230" r="32" fill={palette.green} opacity="0.9" />
        <ellipse cx="94" cy="328" rx="46" ry="8" fill="rgba(20,35,55,0.08)" />
      </g>
      <g>
        <rect x="556" y="250" width="14" height="76" rx="6" fill={palette.woodDark} />
        <circle cx="562" cy="222" r="40" fill={palette.greenDark} />
        <circle cx="532" cy="240" r="26" fill={palette.green} opacity="0.9" />
        <circle cx="590" cy="242" r="27" fill={palette.green} opacity="0.85" />
      </g>
      <g>
        <rect x="398" y="282" width="112" height="12" rx="5" fill={palette.wood} />
        <rect x="398" y="254" width="112" height="10" rx="5" fill={palette.woodLight} />
        <path d="M410 294v34M498 294v34M400 264v-14M510 264v-14" stroke={palette.woodDark} strokeWidth="5" strokeLinecap="round" />
        <path d="M398 264h112" stroke={palette.woodDark} strokeWidth="4" />
      </g>
      <Person x={300} y={372} scale={0.88} shirt={palette.fabric} palette={palette} />
      <Person x={356} y={366} scale={0.72} shirt={palette.accent} palette={palette} hairLong />
      <g fill={palette.greenDark} opacity="0.6">
        <ellipse cx="452" cy="372" rx="14" ry="5" />
        <ellipse cx="486" cy="384" rx="11" ry="4" />
        <ellipse cx="206" cy="388" rx="16" ry="5" />
      </g>
    </>
  )
}

export function ScenePreview({
  seed = 'demo',
  sceneType = '幼儿园教室',
  className,
  showWatermark = true,
}: {
  seed?: string
  sceneType?: string
  className?: string
  showWatermark?: boolean
}) {
  const isOutdoor = sceneType.includes('户外') || sceneType.includes('公园')
  const kind: Kind = isOutdoor
    ? 'outdoor'
    : sceneType.includes('家庭') || sceneType.includes('客厅')
      ? 'home'
      : sceneType.includes('活动') || sceneType.includes('游戏')
        ? 'play'
        : sceneType.includes('休息')
          ? 'calm'
          : sceneType.includes('超市')
            ? 'store'
            : 'classroom'
  const palette = resolvePalette(kind, seed)

  return (
    <div className={cn('relative overflow-hidden bg-ink-100', className)}>
      <svg
        viewBox="0 0 640 400"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
        role="img"
        aria-label={`${sceneType}演示场景预览`}
      >
        {kind === 'outdoor' ? <OutdoorScene palette={palette} /> : <IndoorScene kind={kind} palette={palette} />}
      </svg>
      {showWatermark && (
        <>
          <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-medium text-ink-600 backdrop-blur">
            演示预览
          </span>
          <span className="pointer-events-none absolute bottom-2 right-3 text-[10px] text-ink-600/70">
            非真实生成结果
          </span>
        </>
      )}
    </div>
  )
}
