const { createEmployee, getEmployees, deactivateEmployee } = require('../services/user.service')

const create = async (req, res) => {
  try {
    const user = await createEmployee(req.user.role, req.body)
    res.status(201).json({
      message: 'Empleado creado exitosamente',
      user: {
        id: user.id,
        access_code: user.access_code,
        first_name: user.first_name,
        role: user.role,
        temp_password: user.temp_password
      }
    })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

const list = async (req, res) => {
  try {
    const { role } = req.query
    if (!role) return res.status(400).json({ error: 'Rol requerido' })
    const users = await getEmployees(role)
    res.json({ users })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const deactivate = async (req, res) => {
  try {
    await deactivateEmployee(parseInt(req.params.id))
    res.json({ message: 'Empleado desactivado correctamente' })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

module.exports = { create, list, deactivate }