import { motion } from "framer-motion";

const nodes = [
  { id: 1, x: 10, y: 25 },
  { id: 2, x: 25, y: 15 },
  { id: 3, x: 40, y: 30 },
  { id: 4, x: 58, y: 18 },
  { id: 5, x: 75, y: 28 },
  { id: 6, x: 88, y: 15 },
  { id: 7, x: 18, y: 55 },
  { id: 8, x: 35, y: 65 },
  { id: 9, x: 52, y: 50 },
  { id: 10, x: 70, y: 62 },
  { id: 11, x: 85, y: 52 },
  { id: 12, x: 28, y: 85 },
  { id: 13, x: 48, y: 78 },
  { id: 14, x: 68, y: 88 },
  { id: 15, x: 90, y: 78 }
];

const connections = [
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
  [5, 6],
  [1, 7],
  [2, 8],
  [3, 9],
  [4, 9],
  [5, 10],
  [6, 11],
  [7, 8],
  [8, 9],
  [9, 10],
  [10, 11],
  [7, 12],
  [8, 13],
  [9, 13],
  [10, 14],
  [11, 15],
  [12, 13],
  [13, 14],
  [14, 15]
];

function ParticleField() {
  const getNode = (id) => nodes.find((node) => node.id === id);

  return (
    <div className="particle-field">

      <svg
        className="network-svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >

        {connections.map(([from, to], index) => {
          const start = getNode(from);
          const end = getNode(to);

          return (
            <motion.line
              key={index}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              className="network-line"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.08, 0.25, 0.08] }}
              transition={{
                duration: 3,
                delay: index * 0.08,
                repeat: Infinity
              }}
            />
          );
        })}

      </svg>

      {nodes.map((node, index) => (
        <motion.div
          key={node.id}
          className="network-node"
          style={{
            left: `${node.x}%`,
            top: `${node.y}%`
          }}
          animate={{
            scale: [1, 1.35, 1],
            opacity: [0.35, 1, 0.35]
          }}
          transition={{
            duration: 2.5,
            delay: index * 0.15,
            repeat: Infinity
          }}
        />
      ))}

    </div>
  );
}

export default ParticleField;