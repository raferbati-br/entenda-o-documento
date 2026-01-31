"use client";

import { motion } from "framer-motion";

export default function Template({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} // Começa invisível e levemente abaixo
      animate={{ opacity: 1, y: 0 }}  // Aparece e sobe para o lugar certo
      transition={{ ease: "easeOut", duration: 0.4 }} // Duração suave
      style={{ width: "100%" }} // Garante que o layout não quebre
    >
      {children}
    </motion.div>
  );
}
