import React, { useState, useEffect, useRef, useCallback } from 'react'
import './HeroCarousel.scss'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const slides = [
  { id: 1, image: '/assets/teamOuting.png',  tag: 'Team Event',   caption: 'Annual Team Outing 2025',      sub: 'Building bonds beyond the office' },
  { id: 2, image: '/assets/teamOuting2.png', tag: 'Celebration',  caption: 'X-mas Celebrations',           sub: 'Spreading joy across the GSR family' },
  { id: 3, image: '/assets/teamOuting3.png', tag: 'Fun at Work',  caption: 'Fun Friday Activities',        sub: 'Because great teams play together' },
  { id: 4, image: '/assets/teamOuting4.png', tag: 'Achievement',  caption: 'Q3 Milestone Celebration',     sub: 'Recognising excellence across every team' },
  { id: 5, image: '/assets/teamOuting5.png', tag: 'Community',    caption: 'CSR Day 2025',                 sub: 'Giving back to the world around us' },
  { id: 6, image: '/assets/teamOuting6.png', tag: 'Offsite',      caption: 'Leadership Offsite Retreat',   sub: 'Shaping the future, together' },
]

const INTERVAL = 6000

const HeroCarousel: React.FC = () => {
  const [current, setCurrent] = useState(0)
  const [prev, setPrev] = useState<number | null>(null)
  const [paused, setPaused] = useState(false)
  const [progress, setProgress] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const goTo = useCallback((idx: number) => {
    setPrev(current)
    setCurrent(idx)
    setProgress(0)
  }, [current])

  const goNext = useCallback(() => goTo((current + 1) % slides.length), [current, goTo])
  const goPrev = useCallback(() => goTo((current - 1 + slides.length) % slides.length), [current, goTo])

  useEffect(() => {
    if (paused) return
    timerRef.current = setInterval(goNext, INTERVAL)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [paused, goNext])

  useEffect(() => {
    if (paused) return
    setProgress(0)
    const tick = 50
    progressRef.current = setInterval(() => {
      setProgress((p) => Math.min(p + (tick / INTERVAL) * 100, 100))
    }, tick)
    return () => { if (progressRef.current) clearInterval(progressRef.current) }
  }, [current, paused])

  useEffect(() => {
    if (prev === null) return
    const t = setTimeout(() => setPrev(null), 900)
    return () => clearTimeout(t)
  }, [prev])

  return (
    <div className="hc" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {slides.map((slide, i) => {
        const isActive = i === current
        const isPrev = i === prev
        if (!isActive && !isPrev) return null
        return (
          <div key={slide.id} className={`hc-slide ${isActive ? 'hc-slide--active' : ''} ${isPrev ? 'hc-slide--exit' : ''}`}>
            <img src={slide.image} alt={slide.caption} className="hc-img" />
          </div>
        )
      })}

      <div className="hc-gradient hc-gradient--bottom" />
      <div className="hc-gradient hc-gradient--left" />
      <div className="hc-gradient hc-gradient--top" />

      <div className="hc-portal-label">
        <span className="hc-portal-sub">Welcome to</span>
        <span className="hc-portal-title">GSR Employee Portal</span>
      </div>

      <div className="hc-info" key={`info-${current}`}>
        <span className="hc-tag">{slides[current].tag}</span>
        <h2 className="hc-caption">{slides[current].caption}</h2>
        <p className="hc-sub">{slides[current].sub}</p>
      </div>

      <button className="hc-arrow hc-arrow--left" onClick={goPrev} aria-label="Previous">
        <ChevronLeft size={20} />
      </button>
      <button className="hc-arrow hc-arrow--right" onClick={goNext} aria-label="Next">
        <ChevronRight size={20} />
      </button>

      <div className="hc-bottom-bar">
        <div className="hc-counter">
          <span className="hc-counter-current">{String(current + 1).padStart(2, '0')}</span>
          <span className="hc-counter-sep">/</span>
          <span className="hc-counter-total">{String(slides.length).padStart(2, '0')}</span>
        </div>
        <div className="hc-progress-track">
          <div className="hc-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  )
}

export default HeroCarousel
