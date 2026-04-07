import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Button, IconButton, Modal, Stack, TextField, Typography,
} from '@mui/material'
import { CircleX } from 'lucide-react'
import './career.scss'

const jobData = [
  {
    roleCode: 'JD0001',
    role: 'React.js Developer',
    des: 'With a minimum of 3 to 6 years of experience in front-end development and a strong proficiency in React.js, you will play a key part in our dynamic team.',
  },
  {
    roleCode: 'JD0002',
    role: '.Net Full Stack Developer',
    des: 'Senior Dot Net Developer with 6 to 8 years of experience, you will be joining a global digital solutions and professional services firm that empowers businesses to compete by leveraging emerging technologies.',
  },
]

export default function CareersPage() {
  const navigate = useNavigate()
  const [handleRefPopUp, setHandleRefPopUp] = useState(false)
  const [fileName, setFileName] = useState('')
  const [referralForm, setReferralForm] = useState({
    name: '', totalExp: '', relevantExp: '', skills: '', noticePeriod: '',
  })

  const handleReferralSubmit = () => {
    if (!referralForm.name.trim()) { alert('Candidate name is required'); return }
    alert(`Referral for ${referralForm.name} submitted successfully!`)
    setReferralForm({ name: '', totalExp: '', relevantExp: '', skills: '', noticePeriod: '' })
    setFileName('')
    setHandleRefPopUp(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return
    if (!selectedFile.name.endsWith('.pdf')) {
      alert('Please upload a .pdf file only')
      e.target.value = ''
      return
    }
    setFileName(selectedFile.name)
  }

  return (
    <div className="careers-page">
      <div className="careers-header">
        <span className="careers-title">Explore New Opportunities</span>
        <Button
          variant="contained"
          className="careers-btn"
          onClick={() => navigate('/portal/careers/referral')}
          sx={{ textTransform: 'capitalize' }}
        >
          View Referrals
        </Button>
      </div>

      <div className="careers-list">
        {jobData.map((job, i) => (
          <div key={i} className="careers-card">
            <p className="careers-card-title">{job.roleCode} - {job.role}</p>
            <p className="careers-card-desc">{job.des}</p>
            <div className="careers-card-actions">
              <Button
                variant="contained"
                className="careers-btn"
                sx={{ textTransform: 'capitalize' }}
              >
                Download Job Description
              </Button>
              <Button
                variant="contained"
                className="careers-btn"
                sx={{ textTransform: 'capitalize' }}
                onClick={() => setHandleRefPopUp(true)}
              >
                Refer your Friend
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={handleRefPopUp} onClose={() => setHandleRefPopUp(false)}>
        <Box className="ref-modal">
          <div className="ref-modal-header">
            <span className="ref-modal-title">Refer a Candidate</span>
            <IconButton onClick={() => setHandleRefPopUp(false)}>
              <CircleX strokeWidth={1.7} size={25} color="white" />
            </IconButton>
          </div>

          <div className="ref-modal-body">
            <Stack gap={1}>
              <Typography className="ref-label">Candidate Name</Typography>
              <TextField
                fullWidth
                size="small"
                value={referralForm.name}
                onChange={(e) => setReferralForm((f) => ({ ...f, name: e.target.value }))}
              />
            </Stack>

            <div className="ref-row">
              <Stack gap={1} style={{ flex: 1 }}>
                <Typography className="ref-label">Overall Experience</Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={referralForm.totalExp}
                  onChange={(e) => setReferralForm((f) => ({ ...f, totalExp: e.target.value }))}
                />
              </Stack>
              <Stack gap={1} style={{ flex: 1 }}>
                <Typography className="ref-label">Relevant Experience</Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={referralForm.relevantExp}
                  onChange={(e) => setReferralForm((f) => ({ ...f, relevantExp: e.target.value }))}
                />
              </Stack>
            </div>

            <Stack gap={1}>
              <Typography className="ref-label">Skill Sets</Typography>
              <TextField
                fullWidth
                size="small"
                value={referralForm.skills}
                onChange={(e) => setReferralForm((f) => ({ ...f, skills: e.target.value }))}
              />
            </Stack>

            <Stack gap={1}>
              <Typography className="ref-label">Notice Period (in days)</Typography>
              <TextField
                fullWidth
                size="small"
                value={referralForm.noticePeriod}
                onChange={(e) => setReferralForm((f) => ({ ...f, noticePeriod: e.target.value }))}
              />
            </Stack>

            <Stack gap={1}>
              <Typography className="ref-label">Upload Resume</Typography>
              <Button
                variant="outlined"
                component="label"
                sx={{
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'rgba(255,255,255,0.7)',
                  textTransform: 'capitalize',
                  display: 'flex',
                  gap: '8px',
                  justifyContent: 'flex-start',
                }}
              >
                <img src="/assets/uploadpdf.png" alt="" width={28} />
                {fileName || 'Choose resume'}
                <input type="file" accept=".pdf" hidden onChange={handleFileChange} />
              </Button>
            </Stack>
          </div>

          <div className="ref-modal-footer">
            <Button
              variant="contained"
              className="careers-btn"
              onClick={handleReferralSubmit}
              sx={{ fontWeight: 600, minWidth: 120 }}
            >
              Submit
            </Button>
          </div>
        </Box>
      </Modal>
    </div>
  )
}
