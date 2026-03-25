const TASK_COLORS = [
  { color: 'var(--main)', dim: 'var(--main-dim)', border: 'var(--main)' },
  { color: 'var(--teal)', dim: 'var(--teal-dim)', border: 'var(--teal)' },
  { color: 'var(--purple)', dim: 'var(--purple-dim)', border: 'var(--purple)' },
  { color: 'var(--amber)', dim: 'var(--amber-dim)', border: 'var(--amber)' },
  { color: 'var(--pink)', dim: 'rgba(255,121,198,0.14)', border: 'var(--pink)' },
  { color: 'var(--green)', dim: 'var(--green-dim)', border: 'var(--green)' },
  { color: 'var(--red)', dim: 'var(--red-dim)', border: 'var(--red)' },
  { color: 'var(--yellow)', dim: 'rgba(241,250,140,0.14)', border: 'var(--yellow)' },
]

export function taskColors(index: number) {
  return TASK_COLORS[index % TASK_COLORS.length]
}
