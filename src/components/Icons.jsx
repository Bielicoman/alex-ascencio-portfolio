import { motion } from 'framer-motion';

const iconTransition = {
  type: "spring",
  stiffness: 300,
  damping: 20
};

export const PlayIcon = ({ size = 24, color = "currentColor" }) => (
  <motion.svg 
    width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    whileHover={{ scale: 1.2, rotate: 90 }}
    transition={iconTransition}
  >
    <polygon points="5 3 19 12 5 21 5 3" fill={color} fillOpacity="0.2" />
    <motion.path 
      d="M5 3l14 9-14 9V3z" 
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 1, ease: "easeInOut" }}
    />
  </motion.svg>
);

export const FilmIcon = ({ size = 24, color = "currentColor" }) => (
  <motion.svg 
    width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    whileHover={{ y: -5 }}
    transition={iconTransition}
  >
    <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
    <motion.line x1="7" y1="2" x2="7" y2="22" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 2 }} />
    <motion.line x1="17" y1="2" x2="17" y2="22" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 2, delay: 1 }} />
    <line x1="2" y1="12" x2="22" y2="12" />
    <line x1="2" y1="7" x2="7" y2="7" />
    <line x1="2" y1="17" x2="7" y2="17" />
    <line x1="17" y1="17" x2="22" y2="17" />
    <line x1="17" y1="7" x2="22" y2="7" />
  </motion.svg>
);

export const EditIcon = ({ size = 24, color = "currentColor" }) => (
  <motion.svg 
    width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    whileHover={{ rotate: [-5, 5, -5] }}
    transition={{ repeat: Infinity, duration: 0.5 }}
  >
    <motion.path 
      d="M3 6h18M3 12h18M3 18h18" 
      animate={{ strokeDasharray: ["0 40", "40 0"] }}
      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
    />
    <motion.circle cx="12" cy="12" r="3" animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} />
  </motion.svg>
);

export const CameraIcon = ({ size = 24, color = "currentColor" }) => (
  <motion.svg 
    width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    whileHover={{ scale: 1.1 }}
  >
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <motion.circle 
      cx="12" cy="13" r="4" 
      animate={{ r: [3, 4, 3] }}
      transition={{ repeat: Infinity, duration: 3 }}
    />
    <motion.line 
      x1="12" y1="13" x2="12.01" y2="13" 
      animate={{ opacity: [0, 1, 0] }}
      transition={{ repeat: Infinity, duration: 0.5 }}
    />
  </motion.svg>
);

export const LiveIcon = ({ size = 24, color = "currentColor" }) => (
  <motion.svg 
    width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
  >
    <motion.circle 
      cx="12" cy="12" r="2" fill={color} 
      animate={{ opacity: [0.4, 1, 0.4] }} 
      transition={{ repeat: Infinity, duration: 1 }}
    />
    <motion.path 
      d="M16.24 7.76a6 6 0 0 1 0 8.49" 
      animate={{ opacity: [0, 1, 0], x: [0, 2, 0] }}
      transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
    />
    <motion.path 
      d="M19.07 4.93a10 10 0 0 1 0 14.14" 
      animate={{ opacity: [0, 1, 0], x: [0, 4, 0] }}
      transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }}
    />
    <motion.path 
      d="M7.76 16.24a6 6 0 0 1 0-8.49" 
      animate={{ opacity: [0, 1, 0], x: [0, -2, 0] }}
      transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
    />
    <motion.path 
      d="M4.93 19.07a10 10 0 0 1 0-14.14" 
      animate={{ opacity: [0, 1, 0], x: [0, -4, 0] }}
      transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }}
    />
  </motion.svg>
);

export const GearIcon = ({ size = 24, color = "currentColor" }) => (
  <motion.svg 
    width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    animate={{ rotate: 360 }}
    transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </motion.svg>
);

export const UserIcon = ({ size = 24, color = "currentColor" }) => (
  <motion.svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" whileHover="animate">
    <motion.path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" variants={{ animate: { pathLength: [0, 1], transition: { duration: 0.5 } } }} />
    <motion.circle cx="12" cy="7" r="4" variants={{ animate: { y: [0, -2, 0], transition: { duration: 0.3 } } }} />
  </motion.svg>
);

export const MailIcon = ({ size = 24, color = "currentColor" }) => (
  <motion.svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" whileHover="animate">
    <motion.path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" variants={{ animate: { y: [0, 2, 0], transition: { duration: 0.3 } } }} />
    <path d="M22 7v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7" />
    <motion.path d="M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2" variants={{ animate: { opacity: [1, 0.5, 1], transition: { duration: 0.5 } } }} />
  </motion.svg>
);

export const GridIcon = ({ size = 24, color = "currentColor" }) => (
  <motion.svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" whileHover="animate">
    <motion.rect x="3" y="3" width="7" height="7" variants={{ animate: { scale: [1, 1.1, 1], transition: { duration: 0.3 } } }} />
    <motion.rect x="14" y="3" width="7" height="7" variants={{ animate: { scale: [1, 1.1, 1], transition: { duration: 0.3, delay: 0.1 } } }} />
    <motion.rect x="14" y="14" width="7" height="7" variants={{ animate: { scale: [1, 1.1, 1], transition: { duration: 0.3, delay: 0.2 } } }} />
    <motion.rect x="3" y="14" width="7" height="7" variants={{ animate: { scale: [1, 1.1, 1], transition: { duration: 0.3, delay: 0.3 } } }} />
  </motion.svg>
);
