import Swal from 'sweetalert2';

// Custom SweetAlert2 Toast configured with Rinvox Theme
export const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  customClass: {
    popup: 'rounded-2xl shadow-lg border border-gray-100 font-["Nunito",sans-serif]',
    title: 'text-[14px] font-bold text-[#212B36]',
  },
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  },
});

// Toast notification helper
export const showToast = (message, icon = 'success') => {
  return Toast.fire({
    icon,
    title: message,
  });
};

// Standard Modal Alert configured with Rinvox theme colors
export const showAlert = ({
  title,
  text,
  icon = 'info',
  confirmButtonText = 'Okay',
}) => {
  return Swal.fire({
    title,
    text,
    icon,
    confirmButtonText,
    confirmButtonColor: '#FE9F43',
    customClass: {
      popup: 'rounded-3xl shadow-2xl p-6 font-["Nunito",sans-serif]',
      title: 'text-[22px] font-bold text-[#212B36]',
      htmlContainer: 'text-[14px] font-medium text-[#646B72]',
      confirmButton: 'rounded-xl px-6 py-2.5 font-bold text-[14px] shadow-md shadow-[#FE9F43]/30',
    },
  });
};

// Confirmation Dialog helper
export const showConfirm = ({
  title,
  text,
  confirmButtonText = 'Confirm',
  cancelButtonText = 'Cancel',
}) => {
  return Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#FE9F43',
    cancelButtonColor: '#646B72',
    confirmButtonText,
    cancelButtonText,
    customClass: {
      popup: 'rounded-3xl shadow-2xl p-6 font-["Nunito",sans-serif]',
      title: 'text-[22px] font-bold text-[#212B36]',
      htmlContainer: 'text-[14px] font-medium text-[#646B72]',
      confirmButton: 'rounded-xl px-5 py-2.5 font-bold text-[14px]',
      cancelButton: 'rounded-xl px-5 py-2.5 font-bold text-[14px]',
    },
  });
};

export default {
  showToast,
  showAlert,
  showConfirm,
  Toast,
};
