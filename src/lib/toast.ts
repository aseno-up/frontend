import { toast, ToastOptions } from "react-toastify"

const defaultOptions: ToastOptions = {
  position: "top-right",
  autoClose: 4000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
}

export const showToast = {
  success: (message: string, options?: ToastOptions) => {
    toast.success(message, { ...defaultOptions, ...options })
  },

  error: (message: string, options?: ToastOptions) => {
    toast.error(message, { ...defaultOptions, ...options })
  },

  warning: (message: string, options?: ToastOptions) => {
    toast.warning(message, { ...defaultOptions, ...options })
  },

  info: (message: string, options?: ToastOptions) => {
    toast.info(message, { ...defaultOptions, ...options })
  },

  loading: (message: string, options?: ToastOptions) => {
    return toast.loading(message, { ...defaultOptions, ...options })
  },

  dismiss: (toastId?: string | number) => {
    toast.dismiss(toastId)
  },

  update: (toastId: string | number, options: ToastOptions & { render: string }) => {
    toast.update(toastId, options)
  },

  // Promise helper for async operations
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      pending: string
      success: string
      error: string
    },
    options?: ToastOptions
  ) => {
    return toast.promise(promise, messages, { ...defaultOptions, ...options })
  },
}

// Error handler for API errors
export const handleApiError = (error: unknown, fallbackMessage = "Ocorreu um erro inesperado") => {
  console.error(error)

  if (error instanceof Error) {
    // Check for axios error response
    const axiosError = error as { response?: { data?: { message?: string } } }
    if (axiosError.response?.data?.message) {
      showToast.error(axiosError.response.data.message)
      return
    }
    showToast.error(error.message || fallbackMessage)
    return
  }

  showToast.error(fallbackMessage)
}
