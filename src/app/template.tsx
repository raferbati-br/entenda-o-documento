"use client";

import { motion, useReducedMotion } from "framer-motion";

export default function Template({ children }: Readonly<{ children: React.ReactNode }>) {
  const shouldReduceMotion = useReducedMotion();
  const initial = shouldReduceMotion ? false : { opacity: 0, y: 20 };
  const transition = shouldReduceMotion ? { duration: 0 } : { duration: 0.4 };

  return (
    <motion.div
      data-page-transition="true"
      initial={initial} // Começa invisível e levemente abaixo
      animate={{ opacity: 1, y: 0 }} // Aparece e sobe para o lugar certo
      transition={transition} // Duração suave
      style={{ width: "100%" }} // Garante que o layout não quebre
    >
      {children}
    </motion.div>
  );
}
