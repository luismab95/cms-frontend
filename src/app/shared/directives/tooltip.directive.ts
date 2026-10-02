import {
  Directive,
  ElementRef,
  HostListener,
  Renderer2,
  OnDestroy,
  input,
  inject,
} from '@angular/core';

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

@Directive({
  selector: '[appTooltip]',
})
export class TooltipDirective implements OnDestroy {
  @HostListener('mouseenter')
  onMouseEnter(): void {
    this.showTooltipWithDelay();
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.cancelShow();
    this.destroyTooltip();
  }

  @HostListener('focus')
  onFocus(): void {
    this.showTooltipWithDelay();
  }

  @HostListener('blur')
  onBlur(): void {
    this.cancelShow();
    this.destroyTooltip();
  }

  readonly tooltip = input<string>('', {
    alias: 'appTooltip',
  });
  tooltipPosition = input<TooltipPosition>('top');
  tooltipDisabled = input<boolean>(false);
  tooltipDelay = input<number>(300);

  private tooltipElement?: HTMLElement;
  private showTimeout?: ReturnType<typeof setTimeout>;

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);

  /**
   * Show tooltip delay
   * @returns
   */
  private showTooltipWithDelay(): void {
    if (this.tooltipDisabled() || !this.tooltip() || this.tooltipElement || this.showTimeout)
      return;

    this.showTimeout = setTimeout(() => {
      this.showTimeout = undefined;
      if (this.tooltipDisabled() || !this.tooltip || this.tooltipElement) return;

      this.createTooltip();
    }, this.tooltipDelay());
  }

  /**
   * Create tooltip
   */
  private createTooltip(): void {
    const tooltip = this.renderer.createElement('div') as HTMLElement;

    this.tooltipElement = tooltip;
    this.renderer.setProperty(tooltip, 'textContent', this.tooltip());
    this.addTooltipClasses(tooltip);

    const arrow = this.renderer.createElement('span') as HTMLElement;
    this.addArrowClasses(arrow);
    this.renderer.appendChild(tooltip, arrow);
    this.renderer.appendChild(document.body, tooltip);

    requestAnimationFrame(() => {
      if (!this.tooltipElement) return;

      this.positionTooltip();
      this.renderer.removeClass(this.tooltipElement, 'opacity-0');
      this.renderer.removeClass(this.tooltipElement, 'scale-95');
      this.renderer.addClass(this.tooltipElement, 'opacity-100');
      this.renderer.addClass(this.tooltipElement, 'scale-100');
    });
  }

  /**
   * Position of tooltip
   * @returns
   */
  private positionTooltip(): void {
    if (!this.tooltipElement) return;

    const host = this.el.nativeElement;
    const tooltip = this.tooltipElement;

    const hostRect = host.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    const gap = 8;
    let top = 0;
    let left = 0;

    switch (this.tooltipPosition()) {
      case 'bottom':
        top = hostRect.bottom + gap;
        left = hostRect.left + hostRect.width / 2 - tooltipRect.width / 2;
        break;
      case 'left':
        top = hostRect.top + hostRect.height / 2 - tooltipRect.height / 2;
        left = hostRect.left - tooltipRect.width - gap;
        break;
      case 'right':
        top = hostRect.top + hostRect.height / 2 - tooltipRect.height / 2;
        left = hostRect.right + gap;
        break;
      case 'top':
      default:
        top = hostRect.top - tooltipRect.height - gap;
        left = hostRect.left + hostRect.width / 2 - tooltipRect.width / 2;
        break;
    }

    const padding = 8;
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding));
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding));

    this.renderer.setStyle(tooltip, 'top', `${top}px`);
    this.renderer.setStyle(tooltip, 'left', `${left}px`);
  }

  /**
   * Styles
   * @param tooltip
   */
  private addTooltipClasses(tooltip: HTMLElement): void {
    const baseClasses = [
      'pointer-events-none',
      'fixed',
      'z-[99999]',
      'whitespace-nowrap',
      'rounded-lg',
      'border',
      'border-indigo-500/20',
      'bg-indigo-600',
      'px-3',
      'py-1.5',
      'text-[11px]',
      'font-semibold',
      'leading-4',
      'text-white',
      'shadow-lg',
      'shadow-indigo-500/20',
      'opacity-0',
      'scale-95',
      'transition-all',
      'duration-150',
      'ease-out',
    ];

    baseClasses.forEach((className) => {
      this.renderer.addClass(tooltip, className);
    });
  }

  /**
   * Add arrow in tooltip
   * @param arrow
   */
  private addArrowClasses(arrow: HTMLElement): void {
    const baseClasses = ['absolute', 'h-0', 'w-0', 'border-solid', 'border-transparent'];

    baseClasses.forEach((className) => {
      this.renderer.addClass(arrow, className);
    });

    switch (this.tooltipPosition()) {
      case 'bottom':
        [
          'bottom-full',
          'left-1/2',
          '-translate-x-1/2',
          'border-x-4',
          'border-b-4',
          'border-b-indigo-600',
        ].forEach((className) => {
          this.renderer.addClass(arrow, className);
        });
        break;
      case 'left':
        [
          'left-full',
          'top-1/2',
          '-translate-y-1/2',
          'border-y-4',
          'border-l-4',
          'border-l-indigo-600',
        ].forEach((className) => {
          this.renderer.addClass(arrow, className);
        });
        break;
      case 'right':
        [
          'right-full',
          'top-1/2',
          '-translate-y-1/2',
          'border-y-4',
          'border-r-4',
          'border-r-indigo-600',
        ].forEach((className) => {
          this.renderer.addClass(arrow, className);
        });
        break;
      case 'top':
      default:
        [
          'top-full',
          'left-1/2',
          '-translate-x-1/2',
          'border-x-4',
          'border-t-4',
          'border-t-indigo-600',
        ].forEach((className) => {
          this.renderer.addClass(arrow, className);
        });
        break;
    }
  }

  /**
   * Destroy tooltip
   * @returns
   */
  private destroyTooltip(): void {
    if (!this.tooltipElement) return;

    this.renderer.removeChild(document.body, this.tooltipElement);
    this.tooltipElement = undefined;
  }

  /**
   * Cancel show
   */
  private cancelShow(): void {
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
      this.showTimeout = undefined;
    }
  }

  /**
   * OnDestroy
   */
  ngOnDestroy(): void {
    this.cancelShow();
    this.destroyTooltip();
  }
}
