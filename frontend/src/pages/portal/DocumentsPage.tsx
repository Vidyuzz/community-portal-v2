import React, { useState } from 'react'
import './documents.scss'
import {
  FileText, Download, ChevronRight,
  ArrowLeft, Search, Clock, Shield, Users, FileCheck,
} from 'lucide-react'
import dayjs from 'dayjs'

/* ─── Types ───────────────────────────────────────────────────────── */

interface DocVersion {
  version: string
  uploadedBy: string
  date: string
  size: string
  notes: string
}

interface DocFile {
  id: string
  name: string
  type: string
  currentVersion: string
  lastUpdated: string
  size: string
  versions: DocVersion[]
}

interface DocFolder {
  id: string
  name: string
  icon: React.ElementType
  color: string
  docCount: number
  documents: DocFile[]
}

/* ─── Mock Data ───────────────────────────────────────────────────── */

const folders: DocFolder[] = [
  {
    id: 'hr', name: 'HR Policies', icon: Users, color: '#3B82F6', docCount: 4,
    documents: [
      {
        id: 'hr-1', name: 'Employee Handbook', type: 'PDF', currentVersion: 'v3.2',
        lastUpdated: '2026-01-10', size: '2.4 MB',
        versions: [
          { version: 'v3.2', uploadedBy: 'HR Admin', date: '2026-01-10', size: '2.4 MB', notes: 'Updated leave policy section and comp-off rules.' },
          { version: 'v3.1', uploadedBy: 'HR Admin', date: '2025-08-15', size: '2.3 MB', notes: 'Added remote work policy appendix.' },
          { version: 'v3.0', uploadedBy: 'HR Admin', date: '2025-04-01', size: '2.1 MB', notes: 'Annual revision — updated maternity leave clauses.' },
        ],
      },
      {
        id: 'hr-2', name: 'Leave Policy 2026', type: 'PDF', currentVersion: 'v2.0',
        lastUpdated: '2026-01-02', size: '320 KB',
        versions: [
          { version: 'v2.0', uploadedBy: 'HR Admin', date: '2026-01-02', size: '320 KB', notes: 'Added Comp Off and Paternity leave guidelines.' },
          { version: 'v1.0', uploadedBy: 'HR Admin', date: '2025-01-05', size: '290 KB', notes: 'Initial 2025 leave policy document.' },
        ],
      },
      {
        id: 'hr-3', name: 'Code of Conduct', type: 'PDF', currentVersion: 'v1.5',
        lastUpdated: '2025-06-20', size: '1.1 MB',
        versions: [
          { version: 'v1.5', uploadedBy: 'Legal', date: '2025-06-20', size: '1.1 MB', notes: 'Added social media conduct guidelines.' },
          { version: 'v1.0', uploadedBy: 'Legal', date: '2024-03-01', size: '980 KB', notes: 'Initial publication.' },
        ],
      },
      {
        id: 'hr-4', name: 'Onboarding Checklist', type: 'DOCX', currentVersion: 'v1.2',
        lastUpdated: '2025-11-01', size: '180 KB',
        versions: [
          { version: 'v1.2', uploadedBy: 'HR Admin', date: '2025-11-01', size: '180 KB', notes: 'Added IT setup steps and badge collection.' },
          { version: 'v1.0', uploadedBy: 'HR Admin', date: '2025-01-15', size: '160 KB', notes: 'First release.' },
        ],
      },
    ],
  },
  {
    id: 'it', name: 'IT Security', icon: Shield, color: '#EF4444', docCount: 3,
    documents: [
      {
        id: 'it-1', name: 'Information Security Policy', type: 'PDF', currentVersion: 'v4.1',
        lastUpdated: '2026-02-01', size: '1.8 MB',
        versions: [
          { version: 'v4.1', uploadedBy: 'CISO', date: '2026-02-01', size: '1.8 MB', notes: 'Updated password policy and MFA requirements.' },
          { version: 'v4.0', uploadedBy: 'CISO', date: '2025-09-10', size: '1.7 MB', notes: 'Full annual review.' },
        ],
      },
      {
        id: 'it-2', name: 'BYOD & Device Policy', type: 'PDF', currentVersion: 'v2.3',
        lastUpdated: '2025-10-15', size: '640 KB',
        versions: [
          { version: 'v2.3', uploadedBy: 'IT Admin', date: '2025-10-15', size: '640 KB', notes: 'Added mobile device enrollment steps.' },
          { version: 'v2.0', uploadedBy: 'IT Admin', date: '2025-03-01', size: '600 KB', notes: 'Revised encryption requirements.' },
        ],
      },
      {
        id: 'it-3', name: 'Acceptable Use Policy', type: 'PDF', currentVersion: 'v1.0',
        lastUpdated: '2024-12-01', size: '440 KB',
        versions: [
          { version: 'v1.0', uploadedBy: 'IT Admin', date: '2024-12-01', size: '440 KB', notes: 'Initial publication.' },
        ],
      },
    ],
  },
  {
    id: 'compliance', name: 'Compliance & Legal', icon: FileCheck, color: '#F59E0B', docCount: 2,
    documents: [
      {
        id: 'comp-1', name: 'POSH Policy', type: 'PDF', currentVersion: 'v3.0',
        lastUpdated: '2025-08-01', size: '740 KB',
        versions: [
          { version: 'v3.0', uploadedBy: 'Legal', date: '2025-08-01', size: '740 KB', notes: 'Revised ICC composition and redressal timelines.' },
          { version: 'v2.0', uploadedBy: 'Legal', date: '2024-08-01', size: '700 KB', notes: 'Annual update.' },
        ],
      },
      {
        id: 'comp-2', name: 'Whistleblower Policy', type: 'PDF', currentVersion: 'v1.0',
        lastUpdated: '2024-06-10', size: '380 KB',
        versions: [
          { version: 'v1.0', uploadedBy: 'Legal', date: '2024-06-10', size: '380 KB', notes: 'Initial publication.' },
        ],
      },
    ],
  },
]

const fileTypeColors: Record<string, string> = {
  PDF:  '#EF4444',
  DOCX: '#3B82F6',
  XLSX: '#10B981',
}

/* ─── Component ───────────────────────────────────────────────────── */

export default function DocumentsPage() {
  const [activeFolder, setActiveFolder] = useState<DocFolder | null>(null)
  const [activeDoc,    setActiveDoc]    = useState<DocFile | null>(null)
  const [search,       setSearch]       = useState('')

  const filteredFolders = folders.map((f) => ({
    ...f,
    documents: f.documents.filter((d) =>
      d.name.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((f) => !search || f.documents.length > 0)

  /* ── Version history panel ── */
  if (activeDoc && activeFolder) {
    return (
      <div className="docs-page page-enter">
        <div className="docs-breadcrumb glass-card">
          <button className="docs-bc-btn" onClick={() => setActiveDoc(null)}>
            <ArrowLeft size={14} /> {activeFolder.name}
          </button>
          <ChevronRight size={13} className="docs-bc-sep" />
          <span className="docs-bc-current">{activeDoc.name}</span>
        </div>

        <div className="docs-doc-header glass-card">
          <div className="docs-doc-icon" style={{ background: `${fileTypeColors[activeDoc.type]}18`, borderColor: `${fileTypeColors[activeDoc.type]}35`, color: fileTypeColors[activeDoc.type] }}>
            <FileText size={22} />
          </div>
          <div className="docs-doc-meta">
            <h2 className="docs-doc-name">{activeDoc.name}</h2>
            <p className="docs-doc-sub">
              Current: <strong>{activeDoc.currentVersion}</strong> · {activeDoc.size} · Last updated {dayjs(activeDoc.lastUpdated).format('DD MMM YYYY')}
            </p>
          </div>
          <button className="docs-download-btn">
            <Download size={14} /> Download Latest
          </button>
        </div>

        <div className="docs-versions glass-card">
          <div className="docs-versions-header">
            <Clock size={14} color="rgba(255,255,255,0.4)" />
            <span className="docs-versions-title">Version History</span>
            <span className="docs-versions-count">{activeDoc.versions.length} version{activeDoc.versions.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="docs-version-list">
            {activeDoc.versions.map((v, i) => (
              <div key={v.version} className={`docs-version-row${i === 0 ? ' docs-version-row--latest' : ''}`}>
                <div className="docs-version-badge" style={{ background: i === 0 ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.05)', borderColor: i === 0 ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.12)', color: i === 0 ? '#60A5FA' : 'rgba(255,255,255,0.4)' }}>
                  {v.version}
                  {i === 0 && <span className="docs-version-latest-tag">Latest</span>}
                </div>
                <div className="docs-version-info">
                  <span className="docs-version-notes">{v.notes}</span>
                  <span className="docs-version-meta">{v.uploadedBy} · {dayjs(v.date).format('DD MMM YYYY')} · {v.size}</span>
                </div>
                <button className="docs-dl-btn glass-card-sm"><Download size={13} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  /* ── Document list for a folder ── */
  if (activeFolder) {
    const docsToShow = activeFolder.documents.filter((d) =>
      d.name.toLowerCase().includes(search.toLowerCase())
    )
    return (
      <div className="docs-page page-enter">
        <div className="docs-breadcrumb glass-card">
          <button className="docs-bc-btn" onClick={() => setActiveFolder(null)}>
            <ArrowLeft size={14} /> All Folders
          </button>
          <ChevronRight size={13} className="docs-bc-sep" />
          <span className="docs-bc-current">{activeFolder.name}</span>
        </div>

        <div className="docs-doc-grid">
          {docsToShow.length === 0 && (
            <div className="docs-empty glass-card">No documents found.</div>
          )}
          {docsToShow.map((doc) => (
            <div key={doc.id} className="docs-doc-card glass-card" onClick={() => setActiveDoc(doc)}>
              <div className="docs-doc-card-top">
                <div className="docs-doc-type-badge" style={{ background: `${fileTypeColors[doc.type] ?? '#888'}18`, color: fileTypeColors[doc.type] ?? '#888', borderColor: `${fileTypeColors[doc.type] ?? '#888'}35` }}>
                  {doc.type}
                </div>
                <span className="docs-doc-version">{doc.currentVersion}</span>
              </div>
              <div className="docs-doc-card-icon">
                <FileText size={28} color={fileTypeColors[doc.type] ?? '#888'} strokeWidth={1.4} />
              </div>
              <p className="docs-doc-card-name">{doc.name}</p>
              <div className="docs-doc-card-meta">
                <span>{doc.size}</span>
                <span>{dayjs(doc.lastUpdated).format('DD MMM YYYY')}</span>
              </div>
              <div className="docs-doc-card-footer">
                <span className="docs-doc-revs">{doc.versions.length} revision{doc.versions.length !== 1 ? 's' : ''}</span>
                <button className="docs-dl-btn glass-card-sm" onClick={(e) => e.stopPropagation()}>
                  <Download size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  /* ── Folder grid (home view) ── */
  return (
    <div className="docs-page page-enter">
      <div className="docs-header glass-card">
        <div>
          <h1 className="docs-title">Document Library</h1>
          <p className="docs-subtitle">Company policies, guidelines, and reference documents</p>
        </div>
        <div className="docs-search glass-card-sm">
          <Search size={14} className="docs-search-icon" />
          <input
            type="text"
            placeholder="Search all documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="docs-search-input"
          />
        </div>
      </div>

      <div className="docs-stats">
        <div className="docs-stat glass-card-sm">
          <span className="docs-stat-val">{folders.length}</span>
          <span className="docs-stat-lbl">Categories</span>
        </div>
        <div className="docs-stat glass-card-sm">
          <span className="docs-stat-val">{folders.reduce((s, f) => s + f.docCount, 0)}</span>
          <span className="docs-stat-lbl">Documents</span>
        </div>
        <div className="docs-stat glass-card-sm">
          <span className="docs-stat-val">{folders.reduce((s, f) => s + f.documents.reduce((ss, d) => ss + d.versions.length, 0), 0)}</span>
          <span className="docs-stat-lbl">Total Versions</span>
        </div>
      </div>

      <div className="docs-folder-grid">
        {filteredFolders.map((folder) => {
          const Icon = folder.icon
          return (
            <div
              key={folder.id}
              className="docs-folder-card glass-card"
              onClick={() => setActiveFolder(folder)}
              style={{ '--folder-color': folder.color } as React.CSSProperties}
            >
              <div className="docs-folder-card-top">
                <div className="docs-folder-icon-wrap" style={{ background: `${folder.color}1c`, borderColor: `${folder.color}40` }}>
                  <Icon size={28} color={folder.color} strokeWidth={1.5} />
                </div>
                <ChevronRight size={16} className="docs-folder-arrow" />
              </div>
              <div className="docs-folder-info">
                <span className="docs-folder-name">{folder.name}</span>
                <span className="docs-folder-count">{folder.docCount} document{folder.docCount !== 1 ? 's' : ''}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
