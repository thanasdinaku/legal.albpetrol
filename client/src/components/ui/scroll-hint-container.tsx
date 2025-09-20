import * as React from "react";
import { cn } from "@/lib/utils";
import { MoreVertical, MoreHorizontal } from "lucide-react";

interface ScrollHintContainerProps {
  children: React.ReactNode;
  direction?: 'vertical' | 'horizontal' | 'both';
  className?: string;
  maxHeight?: string;
  maxWidth?: string;
  'data-testid'?: string;
}

export const ScrollHintContainer = React.forwardRef<
  HTMLDivElement,
  ScrollHintContainerProps
>(({ children, direction = 'vertical', className, maxHeight, maxWidth, 'data-testid': testId, ...props }, ref) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = React.useState({
    hasVerticalOverflow: false,
    hasHorizontalOverflow: false,
    atTop: true,
    atBottom: false,
    atStart: true,
    atEnd: false,
  });

  const checkOverflow = React.useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;

    const hasVerticalOverflow = element.scrollHeight > element.clientHeight;
    const hasHorizontalOverflow = element.scrollWidth > element.clientWidth;
    
    // Add small epsilon for floating point precision
    const epsilon = 1;
    const atTop = element.scrollTop <= epsilon;
    const atBottom = element.scrollTop >= element.scrollHeight - element.clientHeight - epsilon;
    const atStart = element.scrollLeft <= epsilon;
    const atEnd = element.scrollLeft >= element.scrollWidth - element.clientWidth - epsilon;

    setScrollState({
      hasVerticalOverflow,
      hasHorizontalOverflow,
      atTop,
      atBottom,
      atStart,
      atEnd,
    });
  }, []);

  const handleScroll = React.useCallback(() => {
    checkOverflow();
  }, [checkOverflow]);

  // Check overflow on mount and when content changes
  React.useEffect(() => {
    checkOverflow();
    
    // Setup ResizeObserver to detect content changes
    const element = scrollRef.current;
    if (!element) return;

    const resizeObserver = new ResizeObserver(checkOverflow);
    resizeObserver.observe(element);
    
    // Also observe children changes
    const mutationObserver = new MutationObserver(checkOverflow);
    mutationObserver.observe(element, { 
      childList: true, 
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [checkOverflow]);

  // Support keyboard scrolling
  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    const element = scrollRef.current;
    if (!element) return;

    switch (e.key) {
      case 'ArrowDown':
        element.scrollTop += 40;
        e.preventDefault();
        break;
      case 'ArrowUp':
        element.scrollTop -= 40;
        e.preventDefault();
        break;
      case 'ArrowRight':
        element.scrollLeft += 40;
        e.preventDefault();
        break;
      case 'ArrowLeft':
        element.scrollLeft -= 40;
        e.preventDefault();
        break;
      case 'PageDown':
        element.scrollTop += element.clientHeight - 40;
        e.preventDefault();
        break;
      case 'PageUp':
        element.scrollTop -= element.clientHeight - 40;
        e.preventDefault();
        break;
    }
  }, []);

  const showTopHint = (direction === 'vertical' || direction === 'both') && 
    scrollState.hasVerticalOverflow && !scrollState.atTop;
    
  const showBottomHint = (direction === 'vertical' || direction === 'both') && 
    scrollState.hasVerticalOverflow && !scrollState.atBottom;
    
  const showLeftHint = (direction === 'horizontal' || direction === 'both') && 
    scrollState.hasHorizontalOverflow && !scrollState.atStart;
    
  const showRightHint = (direction === 'horizontal' || direction === 'both') && 
    scrollState.hasHorizontalOverflow && !scrollState.atEnd;

  return (
    <div 
      ref={ref} 
      className={cn("relative", className)} 
      data-testid={testId}
      {...props}
    >
      {/* Scrollable content area */}
      <div
        ref={scrollRef}
        className={cn(
          "overflow-auto rounded-[inherit] relative",
          maxHeight && `max-h-[${maxHeight}]`,
          maxWidth && `max-w-[${maxWidth}]`
        )}
        style={{ 
          ...(maxHeight && !maxHeight.includes('[') && { maxHeight }),
          ...(maxWidth && !maxWidth.includes('[') && { maxWidth })
        }}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {children}
      </div>

      {/* Top gradient and hint */}
      {showTopHint && (
        <div 
          className="absolute top-0 left-0 right-0 h-6 pointer-events-none z-10"
          data-testid="hint-top"
        >
          <div className="h-full w-full bg-gradient-to-b from-background/90 to-transparent" />
          <div className="absolute top-1 left-1/2 transform -translate-x-1/2">
            <MoreVertical className="h-3 w-3 text-muted-foreground/70" aria-hidden="true" />
          </div>
          <span className="sr-only">More content above</span>
        </div>
      )}

      {/* Bottom gradient and hint */}
      {showBottomHint && (
        <div 
          className="absolute bottom-0 left-0 right-0 h-6 pointer-events-none z-10"
          data-testid="hint-bottom"
        >
          <div className="h-full w-full bg-gradient-to-t from-background/90 to-transparent" />
          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
            <MoreVertical className="h-3 w-3 text-muted-foreground/70" aria-hidden="true" />
          </div>
          <span className="sr-only">More content below</span>
        </div>
      )}

      {/* Left gradient and hint */}
      {showLeftHint && (
        <div 
          className="absolute top-0 bottom-0 left-0 w-6 pointer-events-none z-10"
          data-testid="hint-left"
        >
          <div className="h-full w-full bg-gradient-to-r from-background/90 to-transparent" />
          <div className="absolute top-1/2 left-1 transform -translate-y-1/2">
            <MoreHorizontal className="h-3 w-3 text-muted-foreground/70" aria-hidden="true" />
          </div>
          <span className="sr-only">More content to the left</span>
        </div>
      )}

      {/* Right gradient and hint */}
      {showRightHint && (
        <div 
          className="absolute top-0 bottom-0 right-0 w-6 pointer-events-none z-10"
          data-testid="hint-right"
        >
          <div className="h-full w-full bg-gradient-to-l from-background/90 to-transparent" />
          <div className="absolute top-1/2 right-1 transform -translate-y-1/2">
            <MoreHorizontal className="h-3 w-3 text-muted-foreground/70" aria-hidden="true" />
          </div>
          <span className="sr-only">More content to the right</span>
        </div>
      )}
    </div>
  );
});

ScrollHintContainer.displayName = "ScrollHintContainer";