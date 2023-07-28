export class Timer {
  static wait(delay: number): Promise<unknown> {
    return new Promise((resolve) => setTimeout(resolve, delay));
  }
}
