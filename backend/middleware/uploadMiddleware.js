import { uploadReceipt, uploadLogo, uploadTemplate, uploadStudentId } from '../config/cloudinary.js'

export { uploadReceipt, uploadLogo, uploadTemplate, uploadStudentId }

export const handleUploadError = (err, req, res) => {
  if (err instanceof Error) {
    return res.status(400).json({ message: err.message })
  }
  res.status(500).json({ message: 'Upload failed' })
}