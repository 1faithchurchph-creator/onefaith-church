import { useEffect } from 'react'

const REVEAL_SELECTOR = '[data-reveal]:not(.is-revealed)'

const reducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Home sections render null until their own content hook is ready, so nodes
// mount late; a MutationObserver re-scans so those still get revealed.
export const useScrollReveal = (rootRef) => {
  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    if (reducedMotion() || typeof IntersectionObserver === 'undefined') {
      root.querySelectorAll(REVEAL_SELECTOR).forEach((el) => el.classList.add('is-revealed'))
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-revealed')
          io.unobserve(entry.target)
        })
      },
      { threshold: 0.15 }
    )

    const observeAll = () =>
      root.querySelectorAll(REVEAL_SELECTOR).forEach((el) => io.observe(el))

    observeAll()

    const mo = new MutationObserver(observeAll)
    mo.observe(root, { childList: true, subtree: true })

    return () => {
      io.disconnect()
      mo.disconnect()
    }
  }, [rootRef])
}