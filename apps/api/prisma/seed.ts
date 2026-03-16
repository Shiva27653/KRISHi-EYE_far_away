import { PrismaClient } from '@prisma/client'
import { RagService } from '../src/rag/rag.service';

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Starting database seeding...')

    // 1. Create Demo User
    const demoUser = await prisma.user.upsert({
        where: { phone: '+919999999999' },
        update: {},
        create: {
            phone: '+919999999999',
            name: 'Krishna Kumar',
            role: 'farmer',
            farmerProfile: {
                create: {
                    village: 'Palanpur',
                    district: 'Banas Kantha',
                    state: 'Gujarat',
                    primaryCrop: 'Wheat',
                    farmSizeAcres: 12.5
                }
            }
        }
    })
    console.log('✅ Demo user created:', demoUser.phone)

    // 2. Create Demo Farm
    const demoFarm = await prisma.farm.upsert({
        where: { id: 'demo-farm-001' },
        update: {},
        create: {
            id: 'demo-farm-001',
            ownerUserId: demoUser.id,
            name: "Krishna's Valley Farm",
            district: 'Banas Kantha',
            state: 'Gujarat',
            members: {
                create: {
                    userId: demoUser.id,
                    role: 'owner'
                }
            }
        }
    })
    console.log('✅ Demo farm created:', demoFarm.name)

    // 3. Create Demo Field
    const demoField = await prisma.field.upsert({
        where: { id: 'demo-field-001' },
        update: {},
        create: {
            id: 'demo-field-001',
            farmId: demoFarm.id,
            name: 'North Wheat Plot',
            crop: 'Wheat',
            season: 'Rabi',
            areaAcres: 5.2
        }
    })
    console.log('✅ Demo field created:', demoField.name)

    // 4. Create Demo Tractor
    const demoTractor = await prisma.tractor.upsert({
        where: { id: 'demo-tractor-001' },
        update: {},
        create: {
            id: 'demo-tractor-001',
            farmId: demoFarm.id,
            label: 'Swaraj 855 - Smart Edition',
            description: 'Main automated sprayer'
        }
    })
    console.log('✅ Demo tractor created:', demoTractor.label)

    // 5. Create Initial Analytics Snapshots
    const periods = ['Week 1', 'Week 2', 'Week 3', 'Week 4']
    for (let i = 0; i < periods.length; i++) {
        await prisma.analyticsSnapshot.create({
            data: {
                farmId: demoFarm.id,
                periodLabel: periods[i],
                metrics: {
                    chemicalSavings: 10 + i * 2,
                    yieldImprovement: 5 + i * 0.5,
                    totalJobs: 4 + i
                }
            }
        })
    }
    console.log('✅ Demo analytics snapshots created.')
    
    // 6. Create Support Organizations and Contacts
    console.log('🌱 Seeding support contacts...')
    const icar = await prisma.supportOrganization.create({
        data: {
            name: 'ICAR',
            category: 'government_office',
            website: 'https://icar.org.in'
        }
    })

    const kvk = await prisma.supportOrganization.create({
        data: {
            name: 'Krishi Vigyan Kendra (KVK)',
            category: 'government_office',
            website: 'https://kvk.icar.gov.in'
        }
    })

    const supportContacts = [
        {
            contactName: 'Kisan Call Centre (KCC)',
            organizationId: icar.id,
            phone: '1800-180-1551',
            tollFree: true,
            state: 'National',
            district: 'All',
            issueTypes: ['General Advisory', 'Crop Health']
        },
        {
            contactName: 'KVK Jaipur 1 (Chomu)',
            organizationId: kvk.id,
            phone: '01423-235133',
            state: 'Rajasthan',
            district: 'Jaipur',
            issueTypes: ['On-field Support', 'Training']
        },
        {
            contactName: 'PRADAN Hazaribag',
            organizationId: icar.id, 
            phone: '+91 99317 15240',
            state: 'Jharkhand',
            district: 'Hazaribag',
            issueTypes: ['Livelihood', 'Implementation']
        },
        {
            contactName: 'ATTPL Emergency Helpline',
            organizationId: icar.id,
            phone: '1800-890-0815',
            tollFree: true,
            state: 'National',
            district: 'All',
            issueTypes: ['Emergency', 'Pest Control']
        }
    ]

    for (const contact of supportContacts) {
        await prisma.supportContact.create({
            data: contact
        })
    }
    console.log('✅ Support contacts seeded.')
    
    // 7. RAG Ingestion (Manual CLI only in production)
    console.log('🤖 Note: Agri Advisor data is now managed via manual CLI (scripts/ingest-all.py).')

    console.log('✨ Seeding finished successfully.')
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
