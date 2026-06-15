import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';
import UnfoldReveal from '@/components/animations/UnfoldReveal';
import { X } from 'lucide-react';

interface EcosystemNode {
  id: string;
  label: string;
  title: string;
  description?: string;
  content: React.ReactNode;
  icon?: React.ReactNode;
}

interface InfinityEcosystemProps {
  nodes: EcosystemNode[];
  centerLabel?: string;
  className?: string;
  onNodeSelect?: (node: EcosystemNode) => void;
}

/**
 * InfinityEcosystem Component
 * Interactive circular diagram with nodes that expand into detailed cards.
 * - Default first node (prepare) is open on load
 * - Open node highlighted with bright accent colour
 * - Arrows drawn mid-line between each adjacent node
 * - Center label stays cream/fixed, never changes colour
 */
export const InfinityEcosystem: React.FC<InfinityEcosystemProps> = ({
  nodes,
  centerLabel = 'Artist at the centre',
  className,
  onNodeSelect,
}) => {
  // Default to the first node (prepare) being open
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    nodes.length > 0 ? nodes[0].id : null
  );
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start center', 'center center'],
  });

  // Animate circle drawing on scroll
  const strokeDashoffset = useTransform(scrollYProgress, [0, 1], [2827, 0]);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleNodeClick = (node: EcosystemNode) => {
    setSelectedNodeId(node.id === selectedNodeId ? null : node.id);
    onNodeSelect?.(node);
  };

  // SVG constants
  const CX = 900;
  const CY = 900;
  const RADIUS = 450;
  const NODE_R = 135;
  const total = nodes.length;

  // Get position of each node on the circle
  const getNodePos = (index: number) => {
    // Start from top (-90°) so prepare is at the top
    const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
    return {
      x: CX + Math.cos(angle) * RADIUS,
      y: CY + Math.sin(angle) * RADIUS,
    };
  };

  // Get the point ON the arc that sits exactly between node i and node i+1
  // (arc midpoint, not chord midpoint)
  const getArcMidpoint = (indexA: number, indexB: number) => {
    const angleA = (indexA / total) * Math.PI * 2 - Math.PI / 2;
    const angleB = (indexB / total) * Math.PI * 2 - Math.PI / 2;
    // Average angle (handles wraparound via the short arc)
    let mid = (angleA + angleB) / 2;
    // If the two angles straddle the -π/+π boundary, flip mid to the other arc
    if (Math.abs(angleB - angleA) > Math.PI) mid += Math.PI;
    return {
      x: CX + Math.cos(mid) * RADIUS,
      y: CY + Math.sin(mid) * RADIUS,
      // Tangent angle for clockwise motion at angle `mid` = mid (radians) * 180/π + 90
      deg: mid * (180 / Math.PI) + 90,
    };
  };

  const nodePositions = nodes.map((_, i) => getNodePos(i));

  return (
    <div
      ref={containerRef}
      className={cn(
        'w-full flex flex-col lg:flex-row items-stretch gap-6 sm:gap-8 md:gap-10 lg:gap-16',
        className
      )}
    >
      {/* Left: Circle SVG — Sticky on desktop */}
      <div className="w-full lg:w-1/2 lg:sticky lg:top-24 h-fit">
        <UnfoldReveal className="w-full">
          <div
            className="relative w-full mx-auto lg:mx-0 px-4 sm:px-0"
            style={{ aspectRatio: '1/1', maxWidth: 'clamp(300px, 90vw, 720px)' }}
          >
            <svg
              viewBox="0 0 1800 1800"
              className="w-full h-full drop-shadow-sm"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Animated circle — always pumpkin/orange stroke */}
              <motion.circle
                cx={CX}
                cy={CY}
                r={RADIUS}
                stroke="#D4622D"
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={2827}
                strokeDashoffset={strokeDashoffset}
              />

              {/* Arrows sitting ON the circle arc, straddling the stroke line */}
              {nodes.map((_, index) => {
                const arc = getArcMidpoint(index, (index + 1) % total);
                // Chevron symmetric about y=0:
                // tip -> (38, 0), upper-wing -> (-18, -26), notch -> (-6, 0), lower-wing -> (-18, 26)
                // The line (y=0 in local coords after rotation) bisects it perfectly
                return (
                  <g
                    key={`arrow-${index}`}
                    transform={`translate(${arc.x}, ${arc.y}) rotate(${arc.deg})`}
                  >
                    <polygon
                      points="38,0 -18,-26 -6,0 -18,26"
                      fill="#D4622D"
                    />
                  </g>
                );
              })}

              {/* Center Label — fixed black, never changes */}
              <text
                x={CX}
                y={CY + 20}
                textAnchor="middle"
                fill="#000000"
                style={{ fontSize: '52px', fontWeight: 'bold', fontFamily: 'inherit' }}
              >
                {centerLabel}
              </text>

              {/* Node circles */}
              {nodes.map((node, index) => {
                const pos = nodePositions[index];
                const isSelected = selectedNodeId === node.id;

                return (
                  <g key={node.id} transform={`translate(${pos.x}, ${pos.y})`}>
                    {/* Glow ring when selected */}
                    {isSelected && (
                      <motion.circle
                        r={NODE_R + 24}
                        fill="none"
                        stroke="#000000"
                        strokeWidth="6"
                        opacity={0.1}
                        animate={{ r: [NODE_R + 20, NODE_R + 32, NODE_R + 20] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    )}

                    {/* Node circle — orange when unselected, bright orange when selected */}
                    <motion.circle
                      r={NODE_R}
                      fill={isSelected ? '#FF8C00' : '#FF8C00'}
                      stroke={isSelected ? '#000000' : '#FF8C00'}
                      strokeWidth={isSelected ? 12 : 6}
                      className="cursor-pointer"
                      style={{
                        filter: isSelected
                          ? 'drop-shadow(0 0 18px rgba(255,123,58,0.7))'
                          : 'none',
                        transition: 'fill 0.3s ease, stroke 0.3s ease, filter 0.3s ease',
                      }}
                      whileHover={{ scale: 1.1 }}
                      animate={{ scale: isSelected ? 1.18 : 1 }}
                      transition={{ duration: 0.3 }}
                      onClick={() => handleNodeClick(node)}
                    />

                    {/* Node label text */}
                    <motion.text
                      y="16"
                      textAnchor="middle"
                      fill={isSelected ? '#FFFFFF' : '#FFFFFF'}
                      style={{
                        fontSize: '38px',
                        fontWeight: isSelected ? '900' : 'bold',
                        pointerEvents: 'none',
                        transition: 'fill 0.3s ease',
                      }}
                    >
                      {node.label}
                    </motion.text>
                  </g>
                );
              })}
            </svg>

            {/* Mobile selected label */}
            {isMobile && selectedNodeId && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-0 left-0 right-0 text-center"
              >
                <p className="text-sm font-semibold text-black">
                  {nodes.find((n) => n.id === selectedNodeId)?.label}
                </p>
              </motion.div>
            )}
          </div>
        </UnfoldReveal>
      </div>

      {/* Right: Node detail card */}
      <div className="w-full lg:w-1/2 hidden lg:flex items-center justify-center">
        <AnimatePresence mode="wait">
          {selectedNodeId ? (
            <motion.div
              key={selectedNodeId}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.4, type: 'spring', bounce: 0.3 }}
              className="w-full px-3 sm:px-4 md:px-6 lg:px-8"
            >
              {nodes.map(
                (node) =>
                  node.id === selectedNodeId && (
                    <div
                      key={node.id}
                      className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6 md:p-10 border border-black/5 w-full"
                    >
                      {/* Header row */}
                      <div className="flex flex-col sm:flex-row items-start justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
                        <div className="w-full">
                          {/* Active node accent */}
                          <span className="inline-block px-3 py-1 rounded-full bg-orange/10 text-orange text-xs font-bold uppercase tracking-widest mb-3 font-alan-sans">
                            {node.label}
                          </span>
                          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-black mb-2 font-signika">
                            {node.title}
                          </h3>
                          {node.description && (
                            <p className="text-black/70 text-xs sm:text-sm md:text-base font-alan-sans">
                              {node.description}
                            </p>
                          )}
                        </div>
                        {node.icon && (
                          <div className="text-3xl sm:text-4xl flex-shrink-0">{node.icon}</div>
                        )}
                      </div>

                      <div className="prose prose-sm md:prose max-w-none text-black/90 mb-4 sm:mb-6 text-xs sm:text-sm font-alan-sans">
                        {node.content}
                      </div>

                      <motion.button
                        onClick={() => setSelectedNodeId(null)}
                        className="flex items-center gap-2 text-black/40 font-semibold hover:text-black transition-colors text-xs sm:text-sm md:text-base"
                        whileHover={{ x: 4 }}
                      >
                        Close <X size={14} />
                      </motion.button>
                    </div>
                  )
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full text-center lg:text-left py-12 lg:py-0"
            >
              <p className="text-black/30 text-lg font-alan-sans">
                Select a node to explore the ecosystem
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Bottom Sheet */}
      {isMobile && selectedNodeId && (
        <AnimatePresence>
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30 }}
            className="fixed inset-0 z-50 lg:hidden"
            style={{ top: 'auto' }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedNodeId(null)}
              className="absolute inset-0 bg-black/20"
            />
            <motion.div className="relative bg-white rounded-t-2xl border-t border-black/10 p-6 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="inline-block px-2 py-0.5 rounded-full bg-orange/10 text-orange text-xs font-bold uppercase tracking-widest mb-2 font-alan-sans">
                    {nodes.find((n) => n.id === selectedNodeId)?.label}
                  </span>
                  <h3 className="text-2xl font-bold text-black font-signika">
                    {nodes.find((n) => n.id === selectedNodeId)?.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedNodeId(null)}
                  className="w-10 h-10 flex items-center justify-center text-black/40 hover:text-black transition-colors bg-black/5 rounded-full"
                >
                  <X size={24} />
                </button>
              </div>
              {nodes.find((n) => n.id === selectedNodeId)?.content}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default InfinityEcosystem;
