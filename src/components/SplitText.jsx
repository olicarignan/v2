import { motion } from "motion/react";

export const SplitText = ({ children }) => {
  let words = children.split(" ");

  const wordAnimation = {
    visible: {
      y: 0,
      x: 0,
      // opacity: 1,
      transition: { duration: 1, ease: [0.16, 1, 0.3, 1] },
    },
    hidden: {
      y: "100%",
      x: 0,
      // opacity: 1,
      transition: { duration: 1, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return words.map((word, index) => (
    <motion.div
      key={index}
      className="split-text"
      style={{
        display: "inline-block",
        overflow: "hidden",
        whiteSpace: "nowrap",
        position: "relative",
      }}
    >
      <motion.div
        className="word"
        variants={wordAnimation}
      >
        {word + (index !== words.length - 1 ? "\u00A0" : "")}
      </motion.div>
    </motion.div>
  ));
};
