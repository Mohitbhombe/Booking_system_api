require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Hotel = require('../models/Hotel');
const Room = require('../models/Room');
const User = require('../models/User');

const seedData = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected for data seeding...');

    // Clear existing data
    console.log('Purging existing data...');
    await Hotel.deleteMany();
    await Room.deleteMany();
    await User.deleteMany();
    console.log('Cleaned up previous records successfully.');

    // Seed Users
    console.log('Seeding Users...');
    const users = await User.create([
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123', // Will hash in Week 6
        role: 'guest',
        phone: '+1-555-0199'
      },
      {
        name: 'Jane Admin',
        email: 'admin@example.com',
        password: 'adminpassword', // Will hash in Week 6
        role: 'admin',
        phone: '+1-555-0100'
      }
    ]);
    console.log(`Successfully seeded ${users.length} Users.`);

    // Seed Hotels
    console.log('Seeding Hotels...');
    const hotels = await Hotel.create([
      {
        name: 'The Grand Hyatt Resort',
        description: 'Experience pure luxury right by the ocean side. The Grand Hyatt features standard modern conveniences, 5-star outdoor pools, exquisite dining options, and high-speed fiber internet throughout.',
        address: '777 Ocean Parkway',
        city: 'Miami',
        country: 'USA',
        pricePerNight: 350,
        amenities: ['Ocean View', 'Infinity Pool', 'Spa', 'Free WiFi', '24/7 Room Service', 'Valet Parking'],
        images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'],
        rating: 4.8,
        totalRooms: 120,
        availableRooms: 95
      },
      {
        name: 'Savoy Boutique Hotel',
        description: 'Charming vintage European style blended with top-tier modern customer service. Nestled in a quiet lane in central London, we offer a peaceful stay with walk-in access to all major theatrical shows.',
        address: '42 Strand Street',
        city: 'London',
        country: 'UK',
        pricePerNight: 195,
        amenities: ['Central Heating', 'Complimentary Breakfast', 'Free WiFi', 'Fitness Center', 'English Tea Lounge'],
        images: ['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80'],
        rating: 4.5,
        totalRooms: 50,
        availableRooms: 40
      },
      {
        name: 'Marina Bay Sands',
        description: 'An iconic resort overlooking the stunning Singapore skyline. Home to the world\'s largest infinity pool, celebrity chef restaurants, and world-class theatrical entertainments.',
        address: '10 Bayfront Avenue',
        city: 'Singapore',
        country: 'Singapore',
        pricePerNight: 650,
        amenities: ['Skyline Infinity Pool', 'Casino', 'Luxury Mall', 'Free WiFi', 'Spa', 'Helipad Access'],
        images: ['https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80'],
        rating: 4.9,
        totalRooms: 200,
        availableRooms: 170
      },
      {
        name: 'Alpine Vista Lodge',
        description: 'Charming rustic cabin ambiance located near direct chair lifts in Aspen. Enjoy warm fireplaces, outdoor hot tubs under the stars, and free ski gear rentals included with your room booking.',
        address: '320 Slope Road',
        city: 'Aspen',
        country: 'USA',
        pricePerNight: 280,
        amenities: ['Ski-in/Ski-out', 'Fireplace', 'Outdoor Hot Tub', 'Free WiFi', 'Ski Rental Shop', 'Sauna'],
        images: ['https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=800&q=80'],
        rating: 4.3,
        totalRooms: 45,
        availableRooms: 35
      }
    ]);
    console.log(`Successfully seeded ${hotels.length} Hotels.`);

    // Seed Rooms for each Hotel
    console.log('Seeding Rooms...');
    const roomSeeds = [];

    hotels.forEach(hotel => {
      // Create 3 rooms per hotel
      roomSeeds.push(
        {
          roomNumber: '101',
          type: 'Single',
          hotel: hotel._id,
          pricePerNight: hotel.pricePerNight * 0.8, // 20% cheaper than base
          capacity: 1,
          amenities: ['Single Bed', 'TV', 'Free WiFi', 'Minibar'],
          isAvailable: true
        },
        {
          roomNumber: '202',
          type: 'Double',
          hotel: hotel._id,
          pricePerNight: hotel.pricePerNight * 1.1, // 10% more expensive
          capacity: 2,
          amenities: ['Queen Bed', 'TV', 'Free WiFi', 'Minibar', 'Balcony'],
          isAvailable: true
        },
        {
          roomNumber: '303',
          type: 'Suite',
          hotel: hotel._id,
          pricePerNight: hotel.pricePerNight * 1.8, // 80% premium
          capacity: 4,
          amenities: ['King Bed', 'Living Area', 'Smart TV', 'Free WiFi', 'Kitchenette', 'Jacuzzi'],
          isAvailable: true
        }
      );
    });

    const rooms = await Room.create(roomSeeds);
    console.log(`Successfully seeded ${rooms.length} Rooms.`);

    console.log('Database Seeding finished successfully!');
    process.exit(0);
  } catch (error) {
    console.error(`Error with data seeding: ${error.message}`);
    process.exit(1);
  }
};

seedData();
