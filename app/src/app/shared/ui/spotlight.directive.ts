import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '.glass-panel, .control-panel, .visual-panel, .graph-panel',
  standalone: true
})
export class SpotlightDirective {
  constructor(private el: ElementRef<HTMLElement>) {
    this.el.nativeElement.style.position = 'relative';
    this.el.nativeElement.style.overflow = 'hidden';
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    const rect = this.el.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    this.el.nativeElement.style.setProperty('--mouse-x', `${x}px`);
    this.el.nativeElement.style.setProperty('--mouse-y', `${y}px`);
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    this.el.nativeElement.style.setProperty('--mouse-x', `-1000px`);
    this.el.nativeElement.style.setProperty('--mouse-y', `-1000px`);
  }
}
