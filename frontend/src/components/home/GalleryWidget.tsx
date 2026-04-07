import React, { useRef } from 'react'
import './GalleryWidget.scss'
import { Images } from 'lucide-react'

const photos = [
  { id: 1, src: '/assets/teamOuting.png',  label: 'Fun at Work' },
  { id: 2, src: '/assets/teamOuting2.png', label: 'X-mas Party' },
  { id: 3, src: '/assets/teamOuting3.png', label: 'Team Lunch' },
  { id: 4, src: '/assets/teamOuting4.png', label: 'Q3 Awards' },
  { id: 5, src: '/assets/teamOuting5.png', label: 'CSR Drive' },
  { id: 6, src: '/assets/teamOuting6.png', label: 'Offsite 2025' },
]

const GalleryWidget: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <div className="gallery-widget glass-card">
      <div className="widget-header">
        <Images size={15} color="var(--accent-purple-light)" />
        <span className="widget-title">Photo Gallery</span>
      </div>

      <div className="gallery-scroll" ref={scrollRef}>
        {photos.map((p) => (
          <div key={p.id} className="gallery-thumb">
            <img src={p.src} alt={p.label} className="gallery-thumb-img" />
            <span className="gallery-thumb-label">{p.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default GalleryWidget
