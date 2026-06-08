const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
  console.log('Sembrando datos...')

  // Especialidades
  await prisma.specialty.createMany({
    skipDuplicates: true,
    data: [
      { name: 'Fugas', description: 'Fuga de agua en red interna o externa' },
      { name: 'Medidores', description: 'Daño, robo o cambio de medidor' },
      { name: 'Presión baja', description: 'Baja presión o falta de suministro' },
      { name: 'Calidad del agua', description: 'Turbidez, olor, sabor o color' },
    ]
  })

  // Customers
  await prisma.customer.createMany({
    skipDuplicates: true,
    data: [
      {
        supply_code: 'SUM-001',
        reference_amount: 45.50,
        doc_type: 'DNI',
        doc_number: '12345678',
        first_name: 'Juan',
        last_name_pat: 'Pérez',
        last_name_mat: 'López',
        address: 'Av. Pardo 123, Chimbote',
        latitude: -9.0745,
        longitude: -78.5936,
        phone: '987654321',
        email: 'juan@example.com'
      },
      {
        supply_code: 'SUM-002',
        reference_amount: 38.00,
        doc_type: 'DNI',
        doc_number: '87654321',
        first_name: 'María',
        last_name_pat: 'García',
        last_name_mat: 'Torres',
        address: 'Jr. Bolívar 456, Chimbote',
        latitude: -9.0812,
        longitude: -78.5901,
        phone: '976543210',
        email: 'maria@example.com'
      },
      {
        supply_code: 'SUM-003',
        reference_amount: 52.75,
        doc_type: 'DNI',
        doc_number: '45678912',
        first_name: 'Carlos',
        last_name_pat: 'Ruiz',
        last_name_mat: 'Mendoza',
        address: 'Calle Lima 789, Chimbote',
        latitude: -9.0698,
        longitude: -78.5978,
        phone: '965432109',
        email: 'carlos@example.com'
      },
      {
        supply_code: 'SUM-004',
        reference_amount: 29.90,
        doc_type: 'DNI',
        doc_number: '32165498',
        first_name: 'Ana',
        last_name_pat: 'Flores',
        last_name_mat: 'Vega',
        address: 'Av. Meiggs 321, Chimbote',
        latitude: -9.0756,
        longitude: -78.5923,
        phone: '954321098',
        email: 'ana@example.com'
      },
      {
        supply_code: 'SUM-005',
        reference_amount: 61.20,
        doc_type: 'DNI',
        doc_number: '65498732',
        first_name: 'Luis',
        last_name_pat: 'Castillo',
        last_name_mat: 'Reyes',
        address: 'Jr. Tumbes 654, Chimbote',
        latitude: -9.0823,
        longitude: -78.5889,
        phone: '943210987',
        email: 'luis@example.com'
      }
    ]
  })

  // Jefe inicial
  const password_hash = await bcrypt.hash('Jefe2024!', 10)
  await prisma.user.upsert({
    where: { access_code: 'JEF001' },
    update: {},
    create: {
      role: 'JEF_',
      access_code: 'JEF001',
      password_hash,
      first_name: 'Roberto',
      last_name_pat: 'Sánchez',
      last_name_mat: 'Torres',
      phone: '999888777'
    }
  })

  console.log('✅ Datos sembrados correctamente')
  console.log('👤 Jefe: JEF001 / Jefe2024!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })