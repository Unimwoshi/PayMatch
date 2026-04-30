import { receiptUploader, logoUploader, templateUploader, studentIdUploader } from '../config/cloudinary.js'

export { receiptUploader, logoUploader, templateUploader, studentIdUploader }

export const handleUploadError = (err, req, res) => {
  if (err instanceof Error) {
    return res.status(400).json({ message: err.message })
  }
  res.status(500).json({ message: 'Upload failed' })
}