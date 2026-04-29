import { v2 as cloudinary } from 'cloudinary'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import multer from 'multer'
import dotenv from 'dotenv'

dotenv.config()

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

const createStorage = (folder, allowedFormats) =>
  new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `fynlo/${folder}`,
      allowed_formats: allowedFormats,
      resource_type: 'auto',
      public_id: (req, file) => `${Date.now()}-${Math.random().toString(36).slice(2)}`
    }
  })

export const uploadReceipt = multer({
  storage: createStorage('receipts', ['jpg', 'jpeg', 'png', 'pdf']),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'application/pdf']
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Invalid file type. Only JPG, PNG and PDF allowed.'))
    }
    cb(null, true)
  }
})

export const uploadLogo = multer({
  storage: createStorage('logos', ['jpg', 'jpeg', 'png']),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png']
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Invalid file type. Only JPG and PNG allowed.'))
    }
    cb(null, true)
  }
})

export const uploadTemplate = multer({
  storage: createStorage('templates', ['jpg', 'jpeg', 'png', 'pdf']),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'application/pdf']
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Invalid file type. Only JPG, PNG and PDF allowed.'))
    }
    cb(null, true)
  }
})

export const uploadStudentId = multer({
  storage: createStorage('student-verification', ['jpg', 'jpeg', 'png', 'pdf']),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'application/pdf']
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Invalid file type. Only JPG, PNG and PDF allowed.'))
    }
    cb(null, true)
  }
})

export const deleteFile = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId)
  } catch (error) {
    console.error('Cloudinary delete error:', error.message)
  }
}

export default cloudinary