import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, IconButton, Card } from '@mui/material'
import './dashboard.scss'

const userName = 'Raj Kumar'
const bdayName = 'Ajith Kumar'
const genderRevail = 'Male'

const communityGallery = [
  { path: '/assets/teamOuting.png', id: 1 },
  { path: '/assets/teamOuting2.png', id: 2 },
  { path: '/assets/teamOuting3.png', id: 3 },
  { path: '/assets/teamOuting4.png', id: 4 },
  { path: '/assets/teamOuting5.png', id: 5 },
  { path: '/assets/teamOuting6.png', id: 6 },
]

const upcomingEvents = [
  { date: '11 Dec, 2025', event: 'Team dinner in Zaitoon at 7:30PM' },
  { date: '12 Dec, 2025', event: 'Dhurandhar Movie at Devi Theatre at 8:30PM' },
  { date: '15 Dec, 2025', event: 'Group tour to Pondicherry' },
]

const alertMessage =
  "Make sure to get your Form-16 document from the Hr before Nov 23, 2025 and don't forget to file your Tax Details"

export default function DashboardPage() {
  const [prefix, setPrefix] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [animationType, setAnimationType] = useState('')

  useEffect(() => {
    setPrefix(genderRevail === 'Male' ? 'his' : 'her')
  }, [])

  const getIdx = (index: number) =>
    (index + communityGallery.length) % communityGallery.length

  const nextImage = () => {
    setAnimationType('slide-right')
    setTimeout(() => {
      setCurrentIndex((prev) => getIdx(prev + 1))
      setAnimationType('')
    }, 300)
  }

  const prevImage = () => {
    setAnimationType('slide-left')
    setTimeout(() => {
      setCurrentIndex((prev) => getIdx(prev - 1))
      setAnimationType('')
    }, 300)
  }

  const leftPreview = communityGallery[getIdx(currentIndex + 1)]
  const centerPreview = communityGallery[getIdx(currentIndex)]
  const rightPreview = communityGallery[getIdx(currentIndex - 1)]

  return (
    <div className="dash-page">
      {/* Top bar */}
      <div className="dash-top">
        <div className="dash-welcome">
          <img src="/assets/userProfile.png" alt="" className="dash-avatar" />
          <div>
            <p className="dash-welcome-text">welcome back,</p>
            <p className="dash-user-name">{userName}</p>
          </div>
        </div>

        <div className="dash-openings">
          <div className="dash-openings-row">
            <span className="dash-openings-label">New Openings</span>
            <Link to="/portal/careers" className="dash-openings-link">
              More Openings
            </Link>
          </div>
          <p className="dash-job-des">
            React.js Developer - 3+ years of experience candidate required, Bengaluru
          </p>
        </div>
      </div>

      {/* Quick action buttons */}
      <div className="dash-actions">
        <Button variant="contained" className="dash-btn">Hr Policy Document</Button>
        <Button variant="contained" className="dash-btn">Talent Prove</Button>
        <Button variant="contained" className="dash-btn">ISMS Test</Button>
      </div>

      {/* Center section */}
      <div className="dash-center">
        {/* Birthday */}
        <div className="dash-birthday">
          <img src="/assets/birthdayBoy.png" alt="birthday employee" className="dash-bday-img" />
          <p className="dash-wishes">A big shout-out to our</p>
          <p className="dash-bday-name">{bdayName}</p>
          <p className="dash-wishes">
            on {prefix} birthday, may your day be as wonderful as you are.
          </p>
          <Button variant="contained" className="dash-btn" style={{ marginTop: 8 }}>
            Send a Wish
          </Button>
        </div>

        {/* Gallery carousel */}
        <div className="dash-gallery">
          <IconButton onClick={prevImage}>
            <img src="/assets/leftArrow.png" alt="prev" width={25} />
          </IconButton>

          <div className="dash-gallery-inner">
            <div className={`dash-photo dash-photo--side ${animationType}`}>
              <img src={leftPreview.path} alt="" />
            </div>
            <div className={`dash-photo dash-photo--main ${animationType}`}>
              <img src={centerPreview.path} alt="" />
            </div>
            <div className={`dash-photo dash-photo--side ${animationType}`}>
              <img src={rightPreview.path} alt="" />
            </div>
          </div>

          <IconButton onClick={nextImage}>
            <img src="/assets/rightArrow.png" alt="next" width={25} />
          </IconButton>
        </div>

        {/* Events */}
        <div className="dash-events">
          <p className="dash-events-title">Upcoming Events</p>
          <div className="dash-event-list">
            {upcomingEvents.map((eve, i) => (
              <Card key={i} className="dash-event-card">
                <p className="dash-event-date">{eve.date}</p>
                <p className="dash-event-desc">{eve.event}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Alert bar */}
      <div className="dash-alert">
        <img src="/assets/alertIcon.png" alt="" width={30} />
        <p className="dash-alert-msg">{alertMessage}</p>
        <IconButton size="small">
          <Link to="/portal/master">
            <img src="/assets/editIcon.png" alt="edit" width={20} />
          </Link>
        </IconButton>
      </div>
    </div>
  )
}
