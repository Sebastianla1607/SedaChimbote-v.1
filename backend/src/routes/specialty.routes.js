const express = require('express')
const router = express.Router()
const prisma = require('../utils/prisma')
const { verifyToken } = require('../middlewares/auth.middleware')

router.get('/', verifyToken, async (req, res) => {
  try {
    const specialties = await prisma.specialty.findMany({
      orderBy: { name: 'asc' }
    })
    res.json({ specialties })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router