export function loop(times: number, callback: () => void): void {
  for (let i = 0; i < times; i++) {
    callback()
  }
}
