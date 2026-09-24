const base = (size, props) => ({ width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true, ...props });

export const Arrow = ({ size = 18, ...p }) => (<svg {...base(size, p)}><path d="M7 17 17 7M8 7h9v9" /></svg>);
export const ArrowDown = ({ size = 16, ...p }) => (<svg {...base(size, p)}><path d="M12 5v14M6 13l6 6 6-6" /></svg>);
export const Play = ({ size = 18, ...p }) => (<svg {...base(size, p)}><path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none" /></svg>);
export const Close = ({ size = 20, ...p }) => (<svg {...base(size, p)}><path d="M6 6l12 12M18 6 6 18" /></svg>);
export const Menu = ({ size = 20, ...p }) => (<svg {...base(size, p)}><path d="M4 8h16M4 16h16" /></svg>);
export const Mail = ({ size = 20, ...p }) => (<svg {...base(size, p)}><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7 8 6 8-6" /></svg>);
export const Copy = ({ size = 16, ...p }) => (<svg {...base(size, p)}><rect x="8" y="8" width="12" height="12" rx="3" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></svg>);
export const Check = ({ size = 16, ...p }) => (<svg {...base(size, p)}><path d="m5 12 5 5 9-10" /></svg>);
export const Download = ({ size = 16, ...p }) => (<svg {...base(size, p)}><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>);
export const Instagram = ({ size = 20, ...p }) => (<svg {...base(size, p)}><rect x="3" y="3" width="18" height="18" rx="5.5" /><circle cx="12" cy="12" r="4" /><circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none" /></svg>);
export const Linkedin = ({ size = 20, ...p }) => (<svg {...base(size, p)}><rect x="3" y="3" width="18" height="18" rx="4" /><path d="M8 10.5V17M8 7.2v.1M12 17v-6.5M12 13.3c0-3.6 5-3.6 5 0V17" /></svg>);
export const Whatsapp = ({ size = 20, ...p }) => (
  <svg {...base(size, p)}><path d="M4.5 19.5 5.6 16A8 8 0 1 1 8.4 18.6z" /><path d="M9.2 8.6c.3-.6.7-.6 1-.6.3 0 .5 0 .7.5l.6 1.4c.1.3 0 .5-.2.7l-.4.5c.6 1.1 1.5 2 2.7 2.6l.5-.5c.2-.2.4-.3.7-.2l1.4.6c.4.2.5.4.4.8-.2.9-1 1.5-1.9 1.4-3.2-.4-5.9-3.1-6.2-6.3 0-.4.3-.8.7-1.1z" fill="currentColor" stroke="none" /></svg>
);
export const Clock = ({ size = 16, ...p }) => (<svg {...base(size, p)}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>);
export const Pin = ({ size = 16, ...p }) => (<svg {...base(size, p)}><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>);
export const Spark = ({ size = 16, ...p }) => (<svg {...base(size, p)}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" /></svg>);
export const Scissors = ({ size = 22, ...p }) => (<svg {...base(size, p)}><circle cx="6" cy="7" r="3" /><circle cx="6" cy="17" r="3" /><path d="M8.5 8.5 20 18M8.5 15.5 20 6" /></svg>);
export const Layers = ({ size = 22, ...p }) => (<svg {...base(size, p)}><path d="m12 3 9 5-9 5-9-5z" /><path d="m3 13 9 5 9-5" /></svg>);
export const Wave = ({ size = 22, ...p }) => (<svg {...base(size, p)}><path d="M3 12h2M7 8v8M11 5v14M15 9v6M19 7v10M21 12h0" /></svg>);
export const Aperture = ({ size = 22, ...p }) => (<svg {...base(size, p)}><circle cx="12" cy="12" r="9" /><path d="M14.3 3.3 9 12M20.6 9.6H10.4M18.4 18.3 12.9 9M9.7 20.7 15 12M3.4 14.4h10.2M5.6 5.7l5.5 9.3" /></svg>);
