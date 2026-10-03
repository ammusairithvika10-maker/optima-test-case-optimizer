import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import ParticleField from "../components/ParticleField";
import "../index.css";

function Landing({ setEngineStarted }) {

  const [transitioning, setTransitioning] = useState(false);

  const handleEnterEngine = () => {
    // Start cinematic animation
    setTransitioning(true);

    // Open Engine after animation finishes
    setTimeout(() => {
      setEngineStarted(true);
    }, 1600);
  };

  return (
    <div className="landing">

      {/* Animated Test-Case Network */}
      <ParticleField />

      {/* Background Grid */}
      <div className="grid-bg"></div>

      {/* Scanning Line */}
      <motion.div
        className="scan-line"
        animate={{
          y: ["0vh", "100vh"]
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      {/* OPTIMA Logo */}
      <motion.div
        className="logo"
        initial={{
          opacity: 0,
          y: -30
        }}
        animate={{
          opacity: transitioning ? 0 : 1,
          y: transitioning ? -30 : 0
        }}
        transition={{
          duration: 0.5
        }}
      >
        OPTIMA
      </motion.div>

      {/* Main Content */}
      <motion.div
        className="content"
        initial={{
          opacity: 0,
          scale: 0.95
        }}
        animate={{
          opacity: transitioning ? 0 : 1,
          scale: transitioning ? 0.85 : 1
        }}
        transition={{
          duration: 0.7
        }}
      >

        {/* Status */}
        <div className="status">
          <span></span>
          OPTIMIZATION ENGINE ONLINE
        </div>

        {/* Heading */}
        <h1>
          ALGORITHMIC
          <br />
          <strong>TEST-CASE OPTIMIZATION</strong>
        </h1>

        {/* Subtitle */}
        <p>
          Maximize Coverage. Minimize Execution Cost.
        </p>

        {/* Enter Engine */}
        <motion.button
          whileHover={{
            scale: 1.05
          }}
          whileTap={{
            scale: 0.95
          }}
          className="enter-btn"
          onClick={handleEnterEngine}
          disabled={transitioning}
        >
          ENTER ENGINE
          <ArrowRight size={20} />
        </motion.button>

      </motion.div>

      {/* Bottom Algorithms */}
      <motion.div
        className="bottom-text"
        animate={{
          opacity: transitioning ? 0 : 1
        }}
      >
        GREEDY • SORTING • KNAPSACK
      </motion.div>


      {/* ===================================== */}
      {/* CINEMATIC ENGINE TRANSITION */}
      {/* ===================================== */}

      <motion.div
        className="engine-transition"
        initial={{
          opacity: 0
        }}
        animate={{
          opacity: transitioning ? 1 : 0
        }}
        transition={{
          duration: 0.3
        }}
      >

        <motion.div
          className="transition-core"
          initial={{
            scale: 0,
            opacity: 0
          }}
          animate={
            transitioning
              ? {
                  scale: [0, 1, 1.5, 25],
                  opacity: [0, 1, 1, 0]
                }
              : {
                  scale: 0,
                  opacity: 0
                }
          }
          transition={{
            duration: 1.5,
            ease: "easeInOut"
          }}
        />

      </motion.div>

    </div>
  );
}

export default Landing;