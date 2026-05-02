import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

// Scans an uploaded template image and returns field positions as JSON
export const scanTemplateWithGemini = async (imageBuffer, mimeType = 'image/jpeg') => {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const prompt = `
You are analysing a business invoice template image.
The image is an A4 page (595 x 842 points in PDF coordinates).
Top-left is (0, 0). X increases right. Y increases down.

Identify where each of these fields would appear on this template and return ONLY a JSON array.
No explanation, no markdown, just raw JSON.

Fields to detect:
- businessName
- businessAddress  
- businessPhone
- businessEmail
- invoiceNumber
- issueDate
- dueDate
- customerName
- customerAddress
- customerEmail
- customerPhone
- subtotal
- vatAmount
- whtAmount
- total
- bankName
- accountNumber
- accountName
- notes
- lineItemsTable

For each field found, return:
{
  "key": "fieldName",
  "label": "Human readable label",
  "x": <number>,
  "y": <number>,
  "width": <number>,
  "fontSize": <number>,
  "fontWeight": "normal" or "bold",
  "align": "left" or "right" or "center"
}

Only include fields you can clearly locate. Return an empty array [] if the image is unclear.
`

  const imagePart = {
    inlineData: {
      data: imageBuffer.toString('base64'),
      mimeType,
    }
  }

  const result = await model.generateContent([prompt, imagePart])
  const text = result.response.text()

  // Strip any accidental markdown fences
  const clean = text.replace(/```json|```/g, '').trim()

  try {
    return JSON.parse(clean)
  } catch {
    console.error('Gemini returned invalid JSON:', text)
    return []
  }
}