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

// Error types translations
const errorMap: Record<string, string> = {
  "INVALID_CREDENTIALS": "Email ou senha incorretos. Verifique suas credenciais.",
  "EMAIL_ALREADY_EXISTS": "Este e-mail já está em uso.",
  "USER_NOT_FOUND": "Usuário não encontrado.",
  "TENANT_NOT_FOUND": "Clínica não encontrada.",
  "VALIDATION": "Dados inválidos. Verifique as informações preenchidas.",
  "UNAUTHORIZED": "Sessão expirada. Por favor, faça login novamente.",
  "FORBIDDEN": "Você não tem permissão para realizar esta ação.",
  "SLOT_UNAVAILABLE": "Este horário não está mais disponível.",
  "INVALID": "Token inválido ou expirado. Por favor, solicite uma nova redefinição.",
}

// Error handler for API errors
export const handleApiError = (error: unknown, fallbackMessage = "Ocorreu um erro inesperado") => {
  console.error(error)

  if (error && typeof error === 'object') {
    // Check for axios error response with nested error object
    const axiosError = error as {
      response?: {
        data?: {
          message?: string,
          // Some handlers return `{error: {type, message}}` (structured),
          // others return `{error: "plain string"}`. Both shapes must surface
          // or users get the generic fallback and can't tell what went wrong.
          error?: string | {
            type?: string,
            message?: string
          }
        }
      },
      message?: string
    }

    const errData = axiosError.response?.data?.error

    // Plain-string error body (most Go handlers use `gin.H{"error": err.Error()}`).
    if (typeof errData === 'string' && errData.trim()) {
      showToast.error(errData)
      return
    }

    // Prefer the backend's specific message over the generic translation,
    // because validation errors typically carry actionable details
    // ("Desconto maior que o subtotal." beats a fallback "Dados inválidos").
    // Only fall back to errorMap[type] when no message was provided.
    if (typeof errData === 'object' && errData) {
      if (errData.message && errData.message.trim()) {
        showToast.error(errData.message)
        return
      }
      if (errData.type && errorMap[errData.type]) {
        showToast.error(errorMap[errData.type])
        return
      }
    }

    // Fallback to response.data.message
    if (axiosError.response?.data?.message) {
      showToast.error(axiosError.response.data.message)
      return
    }

    // Fallback to error object message (e.g. Axios error message)
    if (axiosError.message && !axiosError.message.includes("status code")) {
      showToast.error(axiosError.message)
      return
    }
  }

  showToast.error(fallbackMessage)
}
