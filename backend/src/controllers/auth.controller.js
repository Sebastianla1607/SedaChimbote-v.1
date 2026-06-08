const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const prisma = require('../utils/prisma')

// REGISTRO DE CLIENTE
const register = async (req, res) => {
  try {
    const {
      supply_code,
      reference_amount,
      doc_type,
      doc_number,
      first_name,
      last_name_pat,
      last_name_mat,
      phone,
      email,
      password
    } = req.body

    // 1. Verificar que el cliente existe en customers
    const customer = await prisma.customer.findUnique({
      where: { supply_code }
    })

    if (!customer) {
      return res.status(404).json({ error: 'Número de suministro no encontrado' })
    }

    // 2. Validar referencia de cobro
    if (parseFloat(reference_amount) !== parseFloat(customer.reference_amount)) {
      return res.status(400).json({ error: 'Referencia de cobro incorrecta' })
    }

    // 3. Validar datos personales
    if (
      customer.doc_type !== doc_type ||
      customer.doc_number !== doc_number ||
      customer.first_name.toLowerCase() !== first_name.toLowerCase() ||
      customer.last_name_pat.toLowerCase() !== last_name_pat.toLowerCase() ||
      customer.last_name_mat.toLowerCase() !== last_name_mat.toLowerCase()
    ) {
      return res.status(400).json({ error: 'Los datos personales no coinciden con los registrados' })
    }

    // 4. Verificar que no tenga ya una cuenta
    const existingUser = await prisma.user.findFirst({
      where: { customer_id: customer.id }
    })

    if (existingUser) {
      return res.status(400).json({ error: 'Este suministro ya tiene una cuenta registrada' })
    }

    // 5. Verificar que el email no esté en uso
    const emailInUse = await prisma.user.findUnique({ where: { email } })
    if (emailInUse) {
      return res.status(400).json({ error: 'El correo electrónico ya está en uso' })
    }

    // 6. Hashear contraseña y crear usuario
    const password_hash = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        role: 'CLI_',
        email,
        password_hash,
        first_name,
        last_name_pat,
        last_name_mat,
        phone,
        customer_id: customer.id
      }
    })

    // 7. Generar token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.status(201).json({
      message: 'Cuenta creada exitosamente',
      token,
      user: {
        id: user.id,
        role: user.role,
        first_name: user.first_name,
        email: user.email
      }
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// LOGIN UNIVERSAL
const login = async (req, res) => {
  try {
    const { identifier, password } = req.body

    // Detectar si es email (cliente) o código de acceso (empleado)
    const isEmail = identifier.includes('@')

    const user = await prisma.user.findFirst({
      where: isEmail
        ? { email: identifier }
        : { access_code: identifier }
    })

    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Credenciales incorrectas' })
    }

    const validPassword = await bcrypt.compare(password, user.password_hash)
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales incorrectas' })
    }

    // Actualizar último login
    await prisma.user.update({
      where: { id: user.id },
      data: { last_login: new Date() }
    })

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      token,
      user: {
        id: user.id,
        role: user.role,
        first_name: user.first_name,
        access_code: user.access_code || null,
        email: user.email || null
      }
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

module.exports = { register, login }