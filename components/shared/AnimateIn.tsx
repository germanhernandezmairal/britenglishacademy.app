"use client"

import { motion } from "framer-motion"

interface AnimateInProps {
  children: React.ReactNode
  className?: string
  delay?: number
  direction?: "up" | "left" | "right" | "none"
}

export function AnimateIn({
  children,
  className,
  delay = 0,
  direction = "up",
}: AnimateInProps) {
  const initial =
    direction === "up"
      ? { opacity: 0, y: 28 }
      : direction === "left"
      ? { opacity: 0, x: -28 }
      : direction === "right"
      ? { opacity: 0, x: 28 }
      : { opacity: 0 }

  return (
    <motion.div
      initial={initial}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
