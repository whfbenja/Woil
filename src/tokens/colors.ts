export const colors = {
  background: {
    primary: '#080B10',
    secondary: '#0D141B',
  },
  surface: '#111A22',
  border: '#1D2A33',
  text: {
    primary: '#E8F0F5',
    secondary: '#8796A3',
  },
  water: '#39C6E8',
  oil: '#C99A52',
  book: '#8B7BD8',
  auxiliary: '#38A89D',
} as const;

export type Colors = typeof colors;