import { v2 as cloudinary } from 'cloudinary'
import multer from 'multer'
import dotenv from 'dotenv'

dotenv.config()

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

const memoryStorage = multer.memoryStorage()

const createUploader = (allowedTypes, maxSize, folder) => {
  return {
    middleware: multer({
      storage: memoryStorage,
      limits: { fileSize: maxSize },
      fileFilter: (req, file, cb) => {
        if (!allowedTypes.includes(file.mimetype)) {
          return cb(new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`))
        }
        cb(null, true)
      }
    }),
    upload: async (buffer, mimetype) => {
      return new Promise((resolve, reject) => {
        const resourceType = mimetype === 'application/pdf' ? 'raw' : 'image'
        const publicId = `aether/${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}`

        cloudinary.uploader.upload_stream(
          { folder: `aether/${folder}`, resource_type: resourceType, public_id: publicId },
          (error, result) => {
            if (error) return reject(error)
            resolve(result)
          }
        ).end(buffer)
      })
    }
  }
}

export const receiptUploader = createUploader(
  ['image/jpeg', 'image/png', 'application/pdf'],
  5 * 1024 * 1024,
  'receipts'
)

export const logoUploader = createUploader(
  ['image/jpeg', 'image/png'],
  2 * 1024 * 1024,
  'logos'
)

export const templateUploader = createUploader(
  ['image/jpeg', 'image/png', 'application/pdf'],
  10 * 1024 * 1024,
  'templates'
)

export const studentIdUploader = createUploader(
  ['image/jpeg', 'image/png', 'application/pdf'],
  5 * 1024 * 1024,
  'student-verification'
)

export const deleteFile = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId)
  } catch (error) {
    console.error('Cloudinary delete error:', error.message)
  }
}

export default cloudinary