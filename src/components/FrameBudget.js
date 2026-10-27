// Mantém os mesmos objetos e shaders; ajusta somente a superfície interna de desenho.
export class FrameBudget {
  constructor(onSlow, fps = 60) {
    this.onSlow = onSlow;
    this.interval = 1000 / fps;
    this.last = 0;
    this.samples = 0;
    this.slow = 0;
  }
  frame(now) {
    if (document.hidden || document.documentElement.classList.contains("is-teleporting")) {
      this.last = 0; return false;
    }
    const delta = now - this.last;
    if (delta < this.interval - 1) return false;
    if (this.last) {
      this.samples++; if (delta > 45) this.slow++;
      if (this.samples >= 30) {
        if (this.slow > 15) this.onSlow();
        this.samples = this.slow = 0;
      }
    }
    this.last = now;
    return true;
  }
}
