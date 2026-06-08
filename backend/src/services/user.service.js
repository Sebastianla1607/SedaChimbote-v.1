const prisma = require('../utils/prisma')
const bcrypt = require('bcryptjs')

// Generar código de acceso único por rol
const generateAccessCode = async (role) => {
  const prefix = role === 'ESP_' ? 'ESP' : role === 'ADM_' ? 'ADM' : 'JEF'

  const lastUser = await prisma.user.findFirst({
    where: { role, access_code: { startsWith: prefix } },
    orderBy: { created_at: 'desc' }
  })

  let sequence = 1
  if (lastUser && lastUser.access_code) {
    const lastSequence = parseInt(lastUser.access_code.replace(prefix, ''))
    sequence = lastSequence + 1
  }

  return `${prefix}${String(sequence).padStart(3, '0')}`
}

// Crear empleado
const createEmployee = async (creatorRole, data) => {
  const { role, first_name, last_name_pat, last_name_mat, phone, specialties } = data

  // Validar que el creador tenga permiso
  if (creatorRole === 'ADM_' && role !== 'ESP_') {
    throw new Error('El administrador solo puede crear técnicos')
  }
  if (creatorRole === 'JEF_' && role !== 'ADM_') {
    throw new Error('El jefe solo puede crear administradores')
  }

  const access_code = await generateAccessCode(role)
  const tempPassword = `Seda${access_code}2024!`
  const password_hash = await bcrypt.hash(tempPassword, 10)

  const user = await prisma.user.create({
    data: {
      role,
      access_code,
      password_hash,
      first_name,
      last_name_pat,
      last_name_mat,
      phone: phone || null,
    }
  })

  // Si es técnico y vienen especialidades
  if (role === 'ESP_' && specialties && specialties.length > 0) {
    await prisma.userSpecialty.createMany({
      data: specialties.map(specialty_id => ({
        user_id: user.id,
        specialty_id
      }))
    })
  }

  return {
    ...user,
    temp_password: tempPassword
  }
}

// Listar técnicos
const getEmployees = async (role) => {
  const users = await prisma.user.findMany({
    where: { role },
    select: {
      id: true,
      access_code: true,
      first_name: true,
      last_name_pat: true,
      last_name_mat: true,
      phone: true,
      is_active: true,
      is_wip_locked: true,
      created_at: true,
      specialties: {
        include: { specialty: true }
      }
    },
    orderBy: { created_at: 'desc' }
  })

  return users
}

// Desactivar empleado (soft delete)
const deactivateEmployee = async (userId) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { is_active: false }
  })
  return user
}

module.exports = { createEmployee, getEmployees, deactivateEmployee }