import React from 'react'
import {
  Button, IconButton, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import './career.scss'

const columns = [
  'Job ID', 'Candidate Name', 'Referred By', 'Overall Experience',
  'Relevant Experience', 'Skill Sets', 'Notice Period', 'Download Resume', 'Remove',
]

const refCandidates = [
  {
    jobId: 'JD-0001',
    name: 'Luke Martin',
    refBy: 'Sriram Kannan',
    totalExp: 3,
    relExp: 2.5,
    skills: '.Net, Angular, SQL Server, GitHub, C#, TypeScript, JavaScript',
    noticePrd: 30,
  },
  {
    jobId: 'JD-0001',
    name: 'Andrew',
    refBy: 'Ronnie',
    totalExp: 5,
    relExp: 5,
    skills: 'Node.js, React.js, PostgreSQL, GitHub, TypeScript, JavaScript',
    noticePrd: 15,
  },
]

export default function ReferralPage() {
  return (
    <div className="referral-page">
      <div className="referral-header">
        <h1 className="referral-title">Referral Candidates Data</h1>
      </div>

      <div className="referral-table-wrap">
        <TableContainer
          component={Paper}
          sx={{
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'none',
          }}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {columns.map((col) => (
                  <TableCell
                    key={col}
                    sx={{
                      background: 'rgba(0,0,0,0.4)',
                      color: 'rgba(255,255,255,0.7)',
                      fontFamily: 'var(--fontFamily-two)',
                      fontSize: 12,
                      fontWeight: 600,
                      borderBottom: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    {col}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {refCandidates.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    sx={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '48px' }}
                  >
                    No Data Found
                  </TableCell>
                </TableRow>
              ) : (
                refCandidates.map((row, i) => (
                  <TableRow
                    key={i}
                    sx={{
                      '&:hover': { background: 'rgba(255,255,255,0.02)' },
                      '& td': {
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        color: 'rgba(255,255,255,0.7)',
                        fontFamily: 'var(--fontFamily-two)',
                        fontSize: 13,
                      },
                    }}
                  >
                    <TableCell>{row.jobId}</TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.refBy}</TableCell>
                    <TableCell>{row.totalExp}</TableCell>
                    <TableCell>{row.relExp}</TableCell>
                    <TableCell sx={{ maxWidth: 200 }}>{row.skills}</TableCell>
                    <TableCell>{row.noticePrd}</TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        size="small"
                        sx={{
                          fontFamily: 'var(--fontFamily-two)',
                          fontSize: 11,
                          fontWeight: 600,
                          background: '#3B82F6',
                          textTransform: 'capitalize',
                          borderRadius: 1,
                        }}
                      >
                        Click Here
                      </Button>
                    </TableCell>
                    <TableCell>
                      <IconButton size="small">
                        <DeleteForeverIcon sx={{ color: '#ee2929' }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    </div>
  )
}
