import mongoose from 'mongoose'

const fieldPositionSchema = new mongoose.Schema({
  key: { type: String, required: true }, // e.g. 'businessName', 'invoiceNumber'
  label: { type: String },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  width: { type: Number, default: 200 },
  fontSize: { type: Number, default: 10 },
  fontWeight: { type: String, default: 'normal' },
  align: { type: String, default: 'left' },
}, { _id: false })

const templateSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // null = system/free template
  },
  name: { type: String, required: true },
  description: { type: String },
  type: {
    type: String,
    enum: ['free', 'custom'],
    default: 'free'
  },
  previewUrl: { type: String }, // Cloudinary thumbnail
  backgroundUrl: { type: String }, // for custom uploaded templates
  fieldPositions: [fieldPositionSchema],
  isDefault: { type: Boolean, default: false }, // user's chosen default
  pageWidth: { type: Number, default: 595 },   // A4 in points
  pageHeight: { type: Number, default: 842 },
}, { timestamps: true })

const Template = mongoose.model('Template', templateSchema)
export default Template