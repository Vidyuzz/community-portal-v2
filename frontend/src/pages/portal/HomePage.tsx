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
      {/* Main row: Hero + Quick Links */}
      <div className="home-main-row">
        <div className="home-hero-area">
          <HeroCarousel />
        </div>
        <div className="home-ql-area">
          <QuickLinks />
        </div>
      </div>

      {/* Bottom widget row */}
      <div className="home-bottom-row">
        <GalleryWidget />
        <BirthdayWidget />
        <HolidayWidget />
        <NewHiresWidget />
      </div>
    </div>
  )
}
