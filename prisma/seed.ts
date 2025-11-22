import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const investmentPlans = [
  {
    name: 'Starter Plan',
    price: 5000,
    durationDays: 30,
    dailyReturnRate: 0.40,
    isActive: true
  },
  {
    name: 'Basic Plan',
    price: 10000,
    durationDays: 30,
    dailyReturnRate: 0.40,
    isActive: true
  },
  {
    name: 'Premium Plan',
    price: 25000,
    durationDays: 30,
    dailyReturnRate: 0.40,
    isActive: true
  },
  {
    name: 'Gold Plan',
    price: 50000,
    durationDays: 30,
    dailyReturnRate: 0.40,
    isActive: true
  },
  {
    name: 'Platinum Plan',
    price: 100000,
    durationDays: 30,
    dailyReturnRate: 0.40,
    isActive: true
  },
  {
    name: 'Diamond Plan',
    price: 200000,
    durationDays: 30,
    dailyReturnRate: 0.40,
    isActive: true
  }
]

async function main() {
  console.log('Start seeding...')

  for (const plan of investmentPlans) {
    await prisma.investmentPlan.upsert({
      where: { name: plan.name },
      update: plan,
      create: plan
    })
  }

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })