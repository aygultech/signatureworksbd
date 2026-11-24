'use client'

// "Where does this show up?" helper for the admin panel: a screenshot of the live section,
// a one-line location, short steps, and a link to open that part of the site.
import { useState } from 'react'

export default function AdminGuide({ title = 'এটা site-এর কোথায় দেখাবে?', where, demo, view, steps = [], defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  const [zoom, setZoom] = useState(false)

  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 text-sm text-indigo-950">
      <button type="button" onClick={() => setOpen(o => !o)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
        <span className="font-semibold">📍 {title}</span>
        <span className="text-xs font-medium text-indigo-600">{open ? 'লুকান ▲' : 'দেখুন ▼'}</span>
      </button>

      {open && (
        <div className="grid gap-4 border-t border-indigo-100 px-4 py-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="space-y-3">
            {where && <p className="leading-6"><span className="font-semibold">কোথায়:</span> {where}</p>}
            {steps.length > 0 && (
              <ol className="list-decimal space-y-1.5 pl-5 leading-6">
                {steps.map((s) => <li key={s}>{s}</li>)}
              </ol>
            )}
            {view && (
              <a href={view} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500">
                Live site-এ দেখুন ↗
              </a>
            )}
          </div>
          {demo && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-500">Demo — site-এ এভাবে দেখায়</p>
              <button type="button" onClick={() => setZoom(true)} className="block w-full overflow-hidden rounded-lg border border-indigo-200 bg-white" title="বড় করে দেখুন">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={demo} alt="Demo of this section on the website" loading="lazy" className="max-h-56 w-full object-cover object-top" />
              </button>
              <p className="mt-1 text-[11px] text-indigo-500">ছবিতে click করলে বড় হবে</p>
            </div>
          )}
        </div>
      )}

      {zoom && (
        <div className="fixed inset-0 z-[110] overflow-y-auto bg-black/80 p-4" role="dialog" aria-modal="true" onClick={() => setZoom(false)}>
          <button type="button" className="fixed right-4 top-4 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-gray-800">Close ✕</button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={demo} alt="Demo of this section on the website" className="mx-auto mt-10 max-w-5xl w-full rounded-lg" />
        </div>
      )}
    </div>
  )
}
