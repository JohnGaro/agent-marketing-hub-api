import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { Listing } from '../../listing/entities/listing.entity';
import { ListingPhoto } from '../../listing/entities/listing-photo.entity';
import { PropertyType } from '../../listing/enums/property-type.enum';
import { Orientation } from '../../listing/enums/orientation.enum';
import { EnergyClass } from '../../listing/enums/energy-class.enum';
import { PropertyCondition } from '../../listing/enums/property-condition.enum';
import { HeatingType } from '../../listing/enums/heating-type.enum';
import { ListingStatus } from '../../listing/enums/listing-status.enum';

const listings: Partial<Listing>[] = [
  {
    propertyType: PropertyType.VILLA,
    address: '12 Chemin des Oliviers, 06250 Mougins',
    neighborhood: 'Mougins Village',
    price: 1850000,
    surface: 280,
    rooms: 8,
    bedrooms: 4,
    bathrooms: 3,
    floor: null,
    orientation: Orientation.SOUTH,
    hasElevator: false,
    hasBalcony: true,
    balconySurface: 40,
    hasGarden: true,
    gardenSurface: 1200,
    energyClass: EnergyClass.B,
    condition: PropertyCondition.EXCELLENT,
    heatingType: HeatingType.HEAT_PUMP,
    description:
      'Magnifique villa provençale avec vue panoramique sur les collines, piscine et grand jardin paysager.',
    improvements: 'Rénovation complète cuisine et salles de bain en 2022.',
    notes: 'Proche commodités, calme absolu.',
    status: ListingStatus.DRAFT,
  },
  {
    propertyType: PropertyType.VILLA,
    address: '45 Rue du Faubourg Saint-Honoré, 75008 Paris',
    neighborhood: 'Champs-Élysées',
    price: 1250000,
    surface: 120,
    rooms: 5,
    bedrooms: 3,
    bathrooms: 2,
    floor: '4',
    orientation: Orientation.WEST,
    hasElevator: true,
    hasBalcony: true,
    balconySurface: 12,
    hasGarden: false,
    gardenSurface: null,
    energyClass: EnergyClass.C,
    condition: PropertyCondition.EXCELLENT,
    heatingType: HeatingType.COLLECTIVE_GAS,
    description:
      "Appartement haussmannien en plein cœur de Paris, hauts plafonds, parquet et moulures d'époque.",
    improvements: 'Cuisine entièrement refaite, double vitrage posé en 2021.',
    notes: 'Gardien, cave, parking en option.',
    status: ListingStatus.ENHANCED,
  },
  {
    propertyType: PropertyType.APARTMENT,
    address: '8 Quai du Rhône, 69002 Lyon',
    neighborhood: "Presqu'île",
    price: 420000,
    surface: 75,
    rooms: 3,
    bedrooms: 2,
    bathrooms: 1,
    floor: '2',
    orientation: Orientation.EAST,
    hasElevator: false,
    hasBalcony: false,
    balconySurface: null,
    hasGarden: false,
    gardenSurface: null,
    energyClass: EnergyClass.D,
    condition: PropertyCondition.TO_REFRESH,
    heatingType: HeatingType.INDIVIDUAL_GAS,
    description:
      'Bel appartement avec vue sur le Rhône, lumineux et bien agencé, idéal pour une résidence principale ou investissement locatif.',
    improvements: null,
    notes: 'Quartier très prisé, transports à 2 min.',
    status: ListingStatus.PUBLISHED,
  },
];

const photosByListing: string[][] = [
  [
    'https://plus.unsplash.com/premium_photo-1694475117121-0c14f8ddf7bb?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTd8fHZpbGxhfGVufDB8fDB8fHww',
    'https://images.unsplash.com/photo-1721222201286-cd139caa1dfe?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjZ8fHZpbGxhfGVufDB8fDB8fHww',
    'https://plus.unsplash.com/premium_photo-1661954372617-15780178eb2e?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mjl8fHZpbGxhfGVufDB8fDB8fHww',
  ],
  [
    'https://images.unsplash.com/photo-1613553483056-c8cb4c5d2a7b?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8dmlsbGElMjBpbnRlcmlvcnxlbnwwfHwwfHx8MA%3D%3D',
    'https://plus.unsplash.com/premium_photo-1661906854568-8964f58ed859?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8dmlsbGElMjBpbnRlcmlvcnxlbnwwfHwwfHx8MA%3D%3D',
    'https://images.unsplash.com/photo-1601002257790-ebe0966a85ae?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTV8fHZpbGxhJTIwaW50ZXJpb3J8ZW58MHx8MHx8fDA%3D',
  ],
  [
    'https://images.unsplash.com/photo-1611095210561-67f0832b1ca3?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8Y29uZG98ZW58MHx8MHx8fDA%3D',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8Y29uZG98ZW58MHx8MHx8fDA%3D',
    'https://images.unsplash.com/photo-1622644874224-7bdb61351dca?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fGNvbmRvfGVufDB8fDB8fHww',
  ],
];

async function seed() {
  await AppDataSource.initialize();

  const listingRepo = AppDataSource.getRepository(Listing);
  const photoRepo = AppDataSource.getRepository(ListingPhoto);

  for (let i = 0; i < listings.length; i++) {
    const listing = listingRepo.create(listings[i]);
    const savedListing = await listingRepo.save(listing);

    const photos = photosByListing[i].map((url, position) =>
      photoRepo.create({ url, position, caption: null, listing: savedListing }),
    );
    await photoRepo.save(photos);
  }

  await AppDataSource.destroy();
  console.log('Seed completed.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
