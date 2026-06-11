const { body } = require('express-validator')

const registerValidator = [
  body('supply_code').notEmpty().withMessage('El número de suministro es requerido'),
  body('reference_amount').isNumeric().withMessage('La referencia de cobro debe ser un número'),
  body('doc_type').isIn(['DNI', 'CE']).withMessage('Tipo de documento inválido'),
  body('doc_number').notEmpty().withMessage('El número de documento es requerido'),
  body('first_name').notEmpty().withMessage('El nombre es requerido'),
  body('last_name_pat').notEmpty().withMessage('El apellido paterno es requerido'),
  body('last_name_mat').notEmpty().withMessage('El apellido materno es requerido'),
  body('email').isEmail().withMessage('Correo electrónico inválido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener mínimo 6 caracteres')
]

const loginValidator = [
  body('identifier').notEmpty().withMessage('El identificador es requerido'),
  body('password').notEmpty().withMessage('La contraseña es requerida')
]

const createTicketValidator = [
  body('description')
    .notEmpty().withMessage('La descripción es requerida')
    .isLength({ min: 10, max: 500 }).withMessage('La descripción debe tener entre 10 y 500 caracteres')
]

const createEmployeeValidator = [
  body('role').isIn(['ESP_', 'ADM_']).withMessage('Rol inválido'),
  body('first_name').notEmpty().withMessage('El nombre es requerido'),
  body('last_name_pat').notEmpty().withMessage('El apellido paterno es requerido'),
  body('last_name_mat').notEmpty().withMessage('El apellido materno es requerido')
]

const createInternalTicketValidator = [
  body('description')
    .notEmpty().withMessage('La descripción es requerida')
    .isLength({ min: 10 }).withMessage('La descripción debe tener mínimo 10 caracteres'),
  body('address').notEmpty().withMessage('La dirección es requerida'),
  body('priority').isIn(['BAJA', 'MEDIA', 'ALTA', 'EXTREMA']).withMessage('Prioridad inválida')
]

const surveyValidator = [
  body('nps_score')
    .isInt({ min: 1, max: 5 }).withMessage('La calificación debe ser entre 1 y 5')
]

const techReportValidator = [
  body('description')
    .notEmpty().withMessage('La descripción del reporte es requerida')
    .isLength({ min: 10 }).withMessage('La descripción debe tener mínimo 10 caracteres'),
  body('image_urls')
    .isArray({ min: 1 }).withMessage('Debes subir al menos una foto')
]

module.exports = {
  registerValidator,
  loginValidator,
  createTicketValidator,
  createEmployeeValidator,
  createInternalTicketValidator,
  surveyValidator,
  techReportValidator
}