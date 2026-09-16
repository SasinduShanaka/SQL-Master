import React from 'react'

const paths = {
  home: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  book: 'M12 5v16 M12 5C9 3 5 3 2 4v15c4-1 7 0 10 2 3-2 6-3 10-2V4c-3-1-7-1-10 1Z',
  code: 'm8 6-6 6 6 6 m8-12 6 6-6 6 m-3-15-2 18',
  briefcase: 'M8 6V3h8v3 M3 6h18v15H3z M3 11l9 4 9-4 M10 13h4v4h-4z',
  check: 'm5 12 4 4L19 6',
  chart: 'M4 3v18h18 M8 16v-5 M13 16V7 M18 16v-9',
  folder: 'M3 5h7l2 3h9v13H3z',
  search: 'M21 21l-6-6 M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z',
  arrow: 'M4 12h16 m-6-6 6 6-6 6',
  arrowUp: 'M6 18 18 6 M6 6h12v12',
  clock: 'M12 8v5l3 2 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
  flame: 'M12 2c1 6 7 7 7 13a7 7 0 0 1-14 0c0-3 2-6 4-8 0 4 2 5 3 5 2-3 2-5 0-10Z',
  target: 'M21 12a9 9 0 1 1-9-9 M17 12a5 5 0 1 1-5-5 M12 12l9-9 M17 3h4v4',
  trophy: 'M8 3h8v8a4 4 0 0 1-8 0Z M8 5H4v3a4 4 0 0 0 4 4 M16 5h4v3a4 4 0 0 1-4 4 M12 15v5 M8 21h8',
  database: 'M21 5c0 2-4 3-9 3S3 7 3 5s4-3 9-3 9 1 9 3Z M3 5v14c0 2 4 3 9 3s9-1 9-3V5 M3 12c0 2 4 3 9 3s9-1 9-3',
  close: 'm6 6 12 12 M18 6 6 18',
  menu: 'M4 6h16 M4 12h16 M4 18h16',
  spark: 'm12 3 3 6 6 3-6 3-3 6-3-6-6-3 6-3Z',
}

export default function Icon({ name, size = 20, ...props }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={paths[name] || paths.code} /></svg>
}
