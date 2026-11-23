import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Elementos que aparecen suavemente al hacer scroll (fade + subida leve, en cascada)
const SEL = [
  '.section .h-heading', '.section .h-sub', '.card', '.svc', '.course', '.pay-item',
  '.gallery figure', '.menu-cat', '.policies > *', '.footer-grid > *'
].join(',')

export default function Motion() {
  const loc = useLocation()

  // Barra superior: se vuelve translúcida al bajar
  useEffect(() => {
    const on = () => document.documentElement.classList.toggle('scrolled', window.scrollY > 8)
    on(); window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  useEffect(() => {
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const io = new IntersectionObserver((entries) => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) }
    }), { rootMargin: '0px 0px -6% 0px', threshold: 0.08 })
    const scan = () => document.querySelectorAll(SEL).forEach(el => {
      if (el.dataset.rv || el.closest('.hero, .hero-cover, .admin, .modal-bg')) return
      if (el.parentElement?.closest('[data-rv]')) return // no animar dentro de algo que ya se anima
      const i = [...el.parentElement.children].filter(x => x.dataset.rv).length
      el.style.setProperty('--rv-d', `${Math.min(i, 5) * 90}ms`)
      el.dataset.rv = '1'
      io.observe(el)
    })
    // Respaldo: si se baja muy rápido, mostrar todo lo que ya pasó por la pantalla
    let raf = 0
    const sweep = () => {
      raf = 0
      document.querySelectorAll('[data-rv]:not(.in)').forEach(el => {
        if (el.getBoundingClientRect().top < window.innerHeight * 0.94) { el.classList.add('in'); io.unobserve(el) }
      })
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(sweep) }
    window.addEventListener('scroll', onScroll, { passive: true })
    scan()
    const t = setTimeout(sweep, 120)
    const mo = new MutationObserver(scan)
    mo.observe(document.getElementById('root'), { childList: true, subtree: true })
    return () => { io.disconnect(); mo.disconnect(); window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); clearTimeout(t) }
  }, [loc.pathname])

  return null
}
