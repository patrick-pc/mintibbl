import toast from 'react-hot-toast'

export const copyToClipboard = (value, prompt) => {
  navigator.clipboard.writeText(value)
  toast.success(prompt)
}
