import logger from '../utils/logger.js'

const BASE_CURRENCY = 'NGN'
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour

let rateCache = { rates: null, fetchedAt: null }

export const getExchangeRates = async () => {
  const now = Date.now()
  if (rateCache.rates && rateCache.fetchedAt && (now - rateCache.fetchedAt < CACHE_DURATION)) {
    return rateCache.rates
  }

  try {
    const res = await fetch(
      `https://v6.exchangerate-api.com/v6/${process.env.EXCHANGE_RATE_API_KEY}/latest/NGN`
    )
    const data = await res.json()
    if (data.result === 'success') {
      rateCache = { rates: data.conversion_rates, fetchedAt: now }
      return data.conversion_rates
    }
  } catch (err) {
    logger.error({ event: 'fx_fetch_error', error: err.message })
  }

  // Fallback rates if API fails
  return { NGN: 1, USD: 0.00065, GBP: 0.00051, CNY: 0.0047 }
}

export const convertToNGN = async (amount, fromCurrency) => {
  if (fromCurrency === 'NGN') return amount
  const rates = await getExchangeRates()
  const rate = rates[fromCurrency]
  if (!rate) return amount
  return amount / rate
}

export const calculateFXGainLoss = (invoiceAmount, invoiceCurrency, invoiceRate, paymentAmount, paymentCurrency, paymentRate) => {
  if (invoiceCurrency === 'NGN' && paymentCurrency === 'NGN') return 0
  const invoiceInNGN = invoiceAmount / invoiceRate
  const paymentInNGN = paymentAmount / paymentRate
  return paymentInNGN - invoiceInNGN
}