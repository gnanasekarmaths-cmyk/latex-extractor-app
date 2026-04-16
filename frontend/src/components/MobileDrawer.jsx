/**
 * MobileDrawer — bottom sheet that slides up from the screen edge.
 *
 * Props
 * -----
 * open       : boolean       – whether the drawer is visible
 * onClose    : () => void    – called when the user drags down past threshold or taps backdrop
 * children   : ReactNode     – content rendered inside the drawer body
 *
 * Behaviour
 * ---------
 * • Hidden off-screen by default (y = "100%").
 * • Slides up with a spring animation when `open` becomes true.
 * • User can drag the drawer downward; releasing past 30 % of drawer
 *   height triggers `onClose`.  Otherwise it snaps back.
 * • Tapping the semi-transparent backdrop also closes.
 * • Glassmorphism background with rounded top corners and a drag handle bar.
 */

import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { useRef } from "react";

const CLOSE_THRESHOLD = 0.3; // fraction of drawer height to trigger close

export default function MobileDrawer({ open, onClose, children }) {
  const dragControls = useDragControls();
  const drawerRef = useRef(null);

  const handleDragEnd = (_e, info) => {
    const drawerHeight = drawerRef.current?.offsetHeight ?? 400;
    if (info.offset.y > drawerHeight * CLOSE_THRESHOLD) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Drawer panel */}
          <motion.div
            ref={drawerRef}
            className="drawer-panel"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 34 }}
            drag="y"
            dragControls={dragControls}
            dragConstraints={{ top: 0 }}
            dragElastic={0.15}
            onDragEnd={handleDragEnd}
          >
            {/* Handle bar — also serves as drag target */}
            <div
              className="drawer-handle-area"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="drawer-handle" />
            </div>

            {/* Scrollable content */}
            <div className="drawer-body">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
