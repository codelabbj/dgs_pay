"use client"


import React, { useEffect, useRef, useState } from "react"


/* ---------- Helpers ---------- */


export function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0)
  const from = useRef(0)
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target)
      return
    }
    const start = performance.now()
    const begin = from.current
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p)
      const v = begin + (target - begin) * eased
      setValue(v)
      from.current = v
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return value
}


export const fmt = (n: number) => Math.round(n).toLocaleString("fr-FR")


export function Counter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const v = useCountUp(value)
  return (
    <span className="tabular-nums">
      {fmt(v)}
      {suffix}
    </span>
  )
}


/** Carte avec halo lumineux qui suit la souris + entrée en cascade */
export function Spot({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`)
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`)
  }
  return (
    <div
      onMouseMove={onMove}
      style={{ animationDelay: `${delay}ms` }}
      className={`dash-rise group relative overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-0.5 hover:border-ring/40 hover:shadow-lg ${className}`}
    >
      <div className="dash-spot pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative">{children}</div>
    </div>
  )
}


export function useGrow(delay = 150) {
  const [on, setOn] = useState(false)
  useEffect(() => {
    const id = setTimeout(() => setOn(true), delay)
    return () => clearTimeout(id)
  }, [delay])
  return on
}