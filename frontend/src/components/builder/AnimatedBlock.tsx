"use client";

import { motion, Easing } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedBlockProps {
  children: ReactNode;
  animation?: "fade" | "slide-up" | "slide-left" | "slide-right" | "zoom" | "none";
  delay?: number;
}

const variants: Record<string, any> = {
  fade: {
    initial: { opacity: 0 },
    whileInView: { opacity: 1 },
    transition: { duration: 0.8, ease: "easeOut" }
  },
  "slide-up": {
    initial: { opacity: 0, y: 40 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
  },
  "slide-left": {
    initial: { opacity: 0, x: 50 },
    whileInView: { opacity: 1, x: 0 },
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
  },
  "slide-right": {
    initial: { opacity: 0, x: -50 },
    whileInView: { opacity: 1, x: 0 },
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
  },
  zoom: {
    initial: { opacity: 0, scale: 0.95 },
    whileInView: { opacity: 1, scale: 1 },
    transition: { duration: 0.6, ease: "easeOut" }
  },
  none: {
    initial: {},
    whileInView: {},
    transition: {}
  }
};

export function AnimatedBlock({ children, animation = "slide-up", delay = 0 }: AnimatedBlockProps) {
  if (animation === "none") return <>{children}</>;
  
  const variant = variants[animation] || variants["slide-up"];

  return (
    <motion.div
      initial={variant.initial}
      whileInView={variant.whileInView}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ ...variant.transition, delay }}
    >
      {children}
    </motion.div>
  );
}
