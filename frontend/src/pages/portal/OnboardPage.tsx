import React, { useState } from 'react'
import {
  Button, MenuItem, Stack, TextField, Typography,
} from '@mui/material'
import { MobileDatePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import './onboard.scss'

export default function OnboardPage() {
  const [formData, setFormData] = useState({
    empId: '', empName: '', empDesig: '', technology: '',
    location: '', gender: '', mobile: '', email: '', client: '',
  })

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = () => {
    if (!formData.empId || !formData.empName || !formData.empDesig) {
      alert('Employee ID, Name, and Designation are required')
      return
    }
    alert('Employee onboarded successfully!')
    setFormData({
      empId: '', empName: '', empDesig: '', technology: '',
      location: '', gender: '', mobile: '', email: '', client: '',
    })
  }

  return (
    <div className="onboard-page">
      <h1 className="onboard-title">Onboard New Employee</h1>

      <div className="onboard-content">
        <div className="onboard-form">
          <div className="onboard-col">
            <Stack gap={1}>
              <Typography className="onboard-label">Employee ID</Typography>
              <TextField fullWidth size="small" value={formData.empId} onChange={set('empId')} />
            </Stack>

            <Stack gap={1}>
              <Typography className="onboard-label">Employee Name</Typography>
              <TextField fullWidth size="small" value={formData.empName} onChange={set('empName')} />
            </Stack>

            <Stack gap={1}>
              <Typography className="onboard-label">Employee Designation</Typography>
              <TextField fullWidth size="small" value={formData.empDesig} onChange={set('empDesig')} />
            </Stack>

            <Stack gap={1}>
              <Typography className="onboard-label">Technology Name</Typography>
              <TextField fullWidth size="small" value={formData.technology} onChange={set('technology')} />
            </Stack>

            <Stack gap={1}>
              <Typography className="onboard-label">On Board Date</Typography>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <MobileDatePicker format="DD MMM, YYYY" maxDate={dayjs()} />
              </LocalizationProvider>
            </Stack>

            <Stack gap={1}>
              <Typography className="onboard-label">Onboarding Location</Typography>
              <TextField fullWidth size="small" value={formData.location} onChange={set('location')} />
            </Stack>
          </div>

          <div className="onboard-col">
            <Stack gap={1}>
              <Typography className="onboard-label">Date of Birth</Typography>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <MobileDatePicker format="DD MMM, YYYY" maxDate={dayjs()} />
              </LocalizationProvider>
            </Stack>

            <Stack gap={1}>
              <Typography className="onboard-label">Gender</Typography>
              <TextField fullWidth size="small" value={formData.gender} onChange={set('gender')} select>
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </TextField>
            </Stack>

            <Stack gap={1}>
              <Typography className="onboard-label">Mobile Number</Typography>
              <TextField fullWidth size="small" value={formData.mobile} onChange={set('mobile')} />
            </Stack>

            <Stack gap={1}>
              <Typography className="onboard-label">Email</Typography>
              <TextField fullWidth size="small" value={formData.email} onChange={set('email')} />
            </Stack>

            <Stack gap={1}>
              <Typography className="onboard-label">Assigned Client Name</Typography>
              <TextField fullWidth size="small" value={formData.client} onChange={set('client')} />
            </Stack>

            <div className="onboard-submit-row">
              <Button variant="contained" className="onboard-submit-btn" onClick={handleSubmit}>
                Submit
              </Button>
            </div>
          </div>
        </div>

        <div className="onboard-photo-placeholder">
          <img src="/assets/uploadprofile.png" alt="" style={{ maxWidth: 80 }} />
          <p className="onboard-photo-label">Upload image here..</p>
        </div>
      </div>
    </div>
  )
}
