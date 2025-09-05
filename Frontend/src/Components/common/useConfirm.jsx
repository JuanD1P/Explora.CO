import React from "react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Hook de confirmación con modal estilable.
 * Uso:
 *   const { confirm, ConfirmModal } = useConfirm();
 *   const ok = await confirm({ title: "Eliminar", message: "¿Seguro?" });
 *   if (!ok) return;
 */
export function useConfirm() {
  const [opts, setOpts] = React.useState(null);

  const confirm = (o = {}) =>
    new Promise((resolve) => {
      const def = {
        title: "¿Estás seguro?",
        message: "Esta acción no se puede deshacer.",
        okText: "Aceptar",
        cancelText: "Cancelar",
      };
      setOpts({ ...def, ...o, _resolve: resolve });
    });

  const close = (result) => {
    opts?._resolve?.(result);
    setOpts(null);
  };

  const ConfirmModal = () => (
    <AnimatePresence>
      {opts && (
        <motion.div
          className="emp-modal__backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => close(false)}
        >
          <motion.div
            className="emp-modal card-3d"
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
          >
            <div className="emp-modal__body">
              <h3 style={{ margin: "0 0 8px" }}>{opts.title}</h3>
              <p style={{ margin: "0 0 16px", color: "#6b7280" }}>{opts.message}</p>

              <div className="emp-modal__actions" style={{ gap: 8 }}>
                <button className="btn btn-danger" onClick={() => close(true)}>
                  {opts.okText}
                </button>
                <button className="btn btn-light" onClick={() => close(false)}>
                  {opts.cancelText}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return { confirm, ConfirmModal };
}