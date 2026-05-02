import Template from '../models/Template.js'
import { scanTemplateWithGemini } from '../services/geminiService.js'
import { templateUploader } from '../config/cloudinary.js'

// GET /api/templates — get free templates + user's custom ones
export const getTemplates = async (req, res) => {
  try {
    const freeTemplates = await Template.find({ type: 'free', user: null })
    const userTemplates = await Template.find({ type: 'custom', user: req.user._id })
    res.json([...freeTemplates, ...userTemplates])
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// POST /api/templates/upload — upload custom template, scan with Gemini
export const uploadCustomTemplate = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' })

    const { name, description } = req.body

    // Upload to Cloudinary
    const result = await templateUploader.upload(req.file.buffer, req.file.mimetype)

    // Scan with Gemini to detect field positions
    let fieldPositions = []
    try {
      fieldPositions = await scanTemplateWithGemini(req.file.buffer, req.file.mimetype)
    } catch (geminiErr) {
      console.error('Gemini scan failed:', geminiErr.message)
      // Continue without positions — user will place them manually
    }

    const template = await Template.create({
      user: req.user._id,
      name: name || 'My Custom Template',
      description: description || '',
      type: 'custom',
      backgroundUrl: result.secure_url,
      previewUrl: result.secure_url,
      fieldPositions,
    })

    res.status(201).json(template)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// PUT /api/templates/:id/positions — save drag-drop field positions
export const saveFieldPositions = async (req, res) => {
  try {
    const { fieldPositions } = req.body
    const template = await Template.findById(req.params.id)

    if (!template) return res.status(404).json({ message: 'Template not found' })

    // Allow saving positions on free templates per-user by duplicating
    if (template.type === 'free') {
      // Create a user copy with their custom positions
      const userCopy = await Template.create({
        user: req.user._id,
        name: `${template.name} (My Layout)`,
        description: template.description,
        type: 'custom',
        previewUrl: template.previewUrl,
        backgroundUrl: template.backgroundUrl,
        fieldPositions,
        isDefault: true,
      })

      // Remove isDefault from all other user templates
      await Template.updateMany(
        { user: req.user._id, _id: { $ne: userCopy._id } },
        { isDefault: false }
      )

      return res.json(userCopy)
    }

    // For custom templates owned by user, update directly
    if (template.user?.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' })
    }

    template.fieldPositions = fieldPositions
    template.isDefault = true
    await template.save()

    await Template.updateMany(
      { user: req.user._id, _id: { $ne: template._id } },
      { isDefault: false }
    )

    res.json(template)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// GET /api/templates/default — get user's active default template
export const getDefaultTemplate = async (req, res) => {
  try {
    const template = await Template.findOne({ user: req.user._id, isDefault: true })
    res.json(template || null)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// DELETE /api/templates/:id
export const deleteTemplate = async (req, res) => {
  try {
    const template = await Template.findById(req.params.id)
    if (!template) return res.status(404).json({ message: 'Template not found' })
    if (template.user?.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' })
    }
    await template.deleteOne()
    res.json({ message: 'Template deleted' })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}