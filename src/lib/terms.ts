import terms from '../data/terms.json';

/** The short notice's first three paragraphs, as the Terms and download pages show them. */
export const shortNotice: string[] = [terms.short[2], terms.short[3], terms.short[4].split(' Full terms:')[0]];

/** Section headings as the Terms page shows them. */
export const headings: Record<string, string> = {
  'PLAYING': 'Playing',
  'SHARING': 'Sharing',
  'NOT ALLOWED': 'Not allowed',
  'EVERYTHING ELSE IS RESERVED': 'Everything else is reserved',
  'THE PLAYER IN THE STEAM AND MOBILE VERSIONS': 'The player in the Steam and mobile versions',
  'IF THESE TERMS ARE BROKEN': 'If these terms are broken',
  'LATER VERSIONS': 'Later versions',
  'NO WARRANTY': 'No warranty',
  'NINTENDO': 'Nintendo',
  'ASKING PERMISSION': 'Asking permission',
};

export { terms };
