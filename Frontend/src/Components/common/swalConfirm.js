import Swal from "sweetalert2";
import "@sweetalert2/themes/borderless/borderless.css";

export async function confirmAction({
  title,
  text,
  confirmText = "Sí, eliminar",
  cancelText = "Cancelar",
  onConfirm, // async () => { ... }
}) {
  const res = await Swal.fire({
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
    focusCancel: true,
    showLoaderOnConfirm: Boolean(onConfirm),
    buttonsStyling: false,
    customClass: {
      popup: "sw-popup",
      title: "sw-title",
      htmlContainer: "sw-text",
      actions: "sw-actions",
      confirmButton: "sw-confirm",
      cancelButton: "sw-cancel",
    },
    preConfirm: onConfirm
      ? async () => {
          try { await onConfirm(); }
          catch (err) {
            Swal.showValidationMessage(err?.message || "No se pudo completar la acción");
            return false;
          }
        }
      : undefined,
    allowOutsideClick: () => !Swal.isLoading(),
  });
  return res.isConfirmed;
}

export function toastOk(title = "Acción realizada") {
  return Swal.fire({
    icon: "success",
    title,
    timer: 1200,
    showConfirmButton: false,
    buttonsStyling: false,
    customClass: { popup: "sw-popup" },
  });
}