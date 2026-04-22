import React from 'react'
import './home-page.scss'
import HeroCarousel from '../../components/home/HeroCarousel'
import QuickLinks from '../../components/home/QuickLinks'
import GalleryWidget from '../../components/home/GalleryWidget'
import BirthdayWidget from '../../components/home/BirthdayWidget'
import HolidayWidget from '../../components/home/HolidayWidget'
import NewHiresWidget from '../../components/home/NewHiresWidget'

export default function HomePage() {
  return (
    <div className="home-layout page-enter">
      {/* 1. Quick Access strip — top */}
      <div className="home-ql-strip">
        <QuickLinks />
      </div>

      {/* 2. Hero Carousel — full width */}
      <div className="home-hero-area">
        <HeroCarousel />
      </div>

      {/* 3. Holiday (enlarged, left) + Milestones (right) */}
      <div className="home-mid-row">
        <HolidayWidget />
        <BirthdayWidget />
      </div>

      {/* 4. New Hires */}
      <div className="home-newhires-row">
        <NewHiresWidget />
      </div>

      {/* 5. Photo Gallery — full width, bottom */}
      <div className="home-gallery-strip">
        <GalleryWidget />
      </div>
    </div>
  )
}
