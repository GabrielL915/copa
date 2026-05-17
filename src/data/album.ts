// Shared album data. Country primary colors chosen as a single flag-ish accent
// (oklch-ish hex) — used as a small color chip beside the team code.

export interface Team {
  /** 3-letter code, e.g. "BRA" */
  c: string;
  /** display name, e.g. "Brasil" */
  n: string;
  /** flag emoji */
  f: string;
  /** accent color (hex) */
  k: string;
}

export const PER_TEAM = 20;
export const FWC_COUNT = 19;
export const CC_COUNT = 14;

export const GROUPS: Record<string, Team[]> = {
  A: [
    { c: 'MEX', n: 'México', f: '🇲🇽', k: '#0a6b3a' },
    { c: 'RSA', n: 'África do Sul', f: '🇿🇦', k: '#007749' },
    { c: 'KOR', n: 'Coreia do Sul', f: '🇰🇷', k: '#cd2e3a' },
    { c: 'CZE', n: 'Tchéquia', f: '🇨🇿', k: '#11457e' },
  ],
  B: [
    { c: 'CAN', n: 'Canadá', f: '🇨🇦', k: '#d52b1e' },
    { c: 'SUI', n: 'Suíça', f: '🇨🇭', k: '#d52b1e' },
    { c: 'QAT', n: 'Catar', f: '🇶🇦', k: '#8a1538' },
    { c: 'BIH', n: 'Bósnia e Herzegovina', f: '🇧🇦', k: '#002395' },
  ],
  C: [
    { c: 'BRA', n: 'Brasil', f: '🇧🇷', k: '#009c3b' },
    { c: 'MAR', n: 'Marrocos', f: '🇲🇦', k: '#c1272d' },
    { c: 'HAI', n: 'Haiti', f: '🇭🇹', k: '#00209f' },
    { c: 'SCO', n: 'Escócia', f: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', k: '#0065bd' },
  ],
  D: [
    { c: 'USA', n: 'Estados Unidos', f: '🇺🇸', k: '#b22234' },
    { c: 'PAR', n: 'Paraguai', f: '🇵🇾', k: '#d52b1e' },
    { c: 'AUS', n: 'Austrália', f: '🇦🇺', k: '#012169' },
    { c: 'TUR', n: 'Turquia', f: '🇹🇷', k: '#e30a17' },
  ],
  E: [
    { c: 'GER', n: 'Alemanha', f: '🇩🇪', k: '#1b1b1b' },
    { c: 'CUW', n: 'Curaçao', f: '🇨🇼', k: '#002b7f' },
    { c: 'CIV', n: 'Costa do Marfim', f: '🇨🇮', k: '#f77f00' },
    { c: 'ECU', n: 'Equador', f: '🇪🇨', k: '#ffd100' },
  ],
  F: [
    { c: 'NED', n: 'Holanda', f: '🇳🇱', k: '#ae1c28' },
    { c: 'JPN', n: 'Japão', f: '🇯🇵', k: '#bc002d' },
    { c: 'SWE', n: 'Suécia', f: '🇸🇪', k: '#005b9f' },
    { c: 'TUN', n: 'Tunísia', f: '🇹🇳', k: '#e70013' },
  ],
  G: [
    { c: 'BEL', n: 'Bélgica', f: '🇧🇪', k: '#ed2939' },
    { c: 'EGY', n: 'Egito', f: '🇪🇬', k: '#ce1126' },
    { c: 'IRN', n: 'Irã', f: '🇮🇷', k: '#239f40' },
    { c: 'NZL', n: 'Nova Zelândia', f: '🇳🇿', k: '#00247d' },
  ],
  H: [
    { c: 'ESP', n: 'Espanha', f: '🇪🇸', k: '#c60b1e' },
    { c: 'CPV', n: 'Cabo Verde', f: '🇨🇻', k: '#003893' },
    { c: 'KSA', n: 'Arábia Saudita', f: '🇸🇦', k: '#006c35' },
    { c: 'URU', n: 'Uruguai', f: '🇺🇾', k: '#0038a8' },
  ],
  I: [
    { c: 'FRA', n: 'França', f: '🇫🇷', k: '#0055a4' },
    { c: 'SEN', n: 'Senegal', f: '🇸🇳', k: '#00853f' },
    { c: 'NOR', n: 'Noruega', f: '🇳🇴', k: '#ba0c2f' },
    { c: 'IRQ', n: 'Iraque', f: '🇮🇶', k: '#ce1126' },
  ],
  J: [
    { c: 'ARG', n: 'Argentina', f: '🇦🇷', k: '#74acdf' },
    { c: 'ALG', n: 'Argélia', f: '🇩🇿', k: '#006233' },
    { c: 'AUT', n: 'Áustria', f: '🇦🇹', k: '#ed2939' },
    { c: 'JOR', n: 'Jordânia', f: '🇯🇴', k: '#007a3d' },
  ],
  K: [
    { c: 'POR', n: 'Portugal', f: '🇵🇹', k: '#006600' },
    { c: 'COD', n: 'RD Congo', f: '🇨🇩', k: '#007fff' },
    { c: 'UZB', n: 'Uzbequistão', f: '🇺🇿', k: '#1eb53a' },
    { c: 'COL', n: 'Colômbia', f: '🇨🇴', k: '#fcd116' },
  ],
  L: [
    { c: 'ENG', n: 'Inglaterra', f: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', k: '#cf142b' },
    { c: 'CRO', n: 'Croácia', f: '🇭🇷', k: '#171796' },
    { c: 'GHA', n: 'Gana', f: '🇬🇭', k: '#fcd116' },
    { c: 'PAN', n: 'Panamá', f: '🇵🇦', k: '#005293' },
  ],
};

export function getAllIds(): string[] {
  const ids = ['00'];
  for (let i = 1; i <= FWC_COUNT; i++) ids.push(`FWC ${i}`);
  Object.values(GROUPS)
    .flat()
    .forEach((t) => {
      for (let i = 1; i <= PER_TEAM; i++) ids.push(`${t.c} ${i}`);
    });
  for (let i = 1; i <= CC_COUNT; i++) ids.push(`CC ${i}`);
  return ids;
}

export const TOTAL =
  1 + FWC_COUNT + Object.values(GROUPS).flat().length * PER_TEAM + CC_COUNT;
