require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Hotel = require('../models/Hotel');
const Room = require('../models/Room');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');

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
    await Booking.deleteMany();
    await Payment.deleteMany();
    const EmailLog = require('../models/EmailLog');
    await EmailLog.deleteMany();
    console.log('Cleaned up previous records successfully.');

    // Seed Users
    console.log('Seeding Users...');
    const users = await User.create([
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123',
        role: 'guest',
        phone: '+1-555-0199'
      },
      {
        name: 'Jane Admin',
        email: 'admin@example.com',
        password: 'AdminPass1',
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
      },
      {
        name: 'Welcomhotel By ITC Hotels, Rama International',
        description: 'Set in Chhatrapati Sambhajinagar, this luxurious ITC hotel is nestled within 28 acres of lush green gardens. It features standard royal conveniences, local heritage-inspired decor, a pristine outdoor pool, therapeutic spa treatments, and premium dining venues serving delectable cuisines.',
        address: 'R-3, Jalna Rd, Town Center, Chilkalthana',
        city: 'Chhatrapati Sambhajinagar',
        country: 'India',
        pricePerNight: 5800,
        amenities: ['WiFi', 'Pool', 'Restaurant', 'Parking', 'Gym'],
        images: ['https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80'],
        rating: 4.5,
        totalRooms: 100,
        availableRooms: 45
      },
      {
        name: 'Gateway Aurangabad',
        description: 'A charming, upscale luxury hotel featuring beautiful Indian architecture surrounded by landscaped gardens. Gateway Aurangabad provides world-class hospitality, a quiet outdoor pool, therapeutic wellness spas, and exquisite dining options perfect for leisure and business travellers alike.',
        address: '8-N-12, Dr Rafiq Zakaria Marg, Rauza Bagh',
        city: 'Chhatrapati Sambhajinagar',
        country: 'India',
        pricePerNight: 6600,
        amenities: ['WiFi', 'Pool', 'Spa', 'Restaurant'],
        images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'],
        rating: 4.5,
        totalRooms: 80,
        availableRooms: 30
      },
      {
        name: 'Lemon Tree Hotel',
        description: 'Strategically located near the airport, Lemon Tree Hotel offers refreshing business stays with vibrant interiors, a cozy swimming pool, fitness center, and multi-cuisine restaurant. An ideal spot featuring modern conference halls and seamless high-speed internet.',
        address: 'Airport Rd, CIDCO Cannought',
        city: 'Chhatrapati Sambhajinagar',
        country: 'India',
        pricePerNight: 4900,
        amenities: ['WiFi', 'Parking', 'Restaurant', 'Conference Hall'],
        images: ['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80'],
        rating: 4.2,
        totalRooms: 60,
        availableRooms: 25
      },
      {
        name: 'VITS Aurangabad',
        description: 'Centrally situated near the railway station, VITS Hotel delivers standard premium amenities, an indoor swimming pool, multi-cuisine dining, and comfortable suites. Excellent hospitality caters to business groups and families looking for comfort.',
        address: 'Railway Station Rd, Vedant Nagar',
        city: 'Chhatrapati Sambhajinagar',
        country: 'India',
        pricePerNight: 4200,
        amenities: ['WiFi', 'Pool', 'Restaurant'],
        images: ['https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=800&q=80'],
        rating: 3.9,
        totalRooms: 100,
        availableRooms: 50
      },
      {
        name: 'The Fern Residency',
        description: 'An eco-sensitive premium hotel offering well-appointed rooms, modern fitness gym facilities, high-speed fiber internet, and comprehensive business services. Perfect for environmentally conscious travelers seeking an exceptional stay.',
        address: 'Jalgaon Rd, Town Center, CIDCO',
        city: 'Chhatrapati Sambhajinagar',
        country: 'India',
        pricePerNight: 3600,
        amenities: ['WiFi', 'Gym', 'Parking'],
        images: ['https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80'],
        rating: 4.4,
        totalRooms: 70,
        availableRooms: 35
      },
      {
        name: 'Ambassador Ajanta Hotel',
        description: 'The biggest five-star luxury resort in the region. Ambassador Ajanta offers a grand stay with historic elegance, extensive lawns, tennis courts, an outdoor pool, and exceptional banquet services adjacent to the High Court.',
        address: 'Opp. High Court, Jalna Rd',
        city: 'Chhatrapati Sambhajinagar',
        country: 'India',
        pricePerNight: 3600,
        amenities: ['WiFi', 'Restaurant', 'Parking'],
        images: ['https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80'],
        rating: 4.2,
        totalRooms: 60,
        availableRooms: 28
      },
      {
        name: 'Ginger Aurangabad',
        description: 'A smart, modern budget hotel offering crisp service, high-speed WiFi, secure parking, and an on-site multi-cuisine restaurant. Ginger provides highly reliable, functional comfort for budget-conscious business and leisure guests.',
        address: 'Railway Station Rd',
        city: 'Chhatrapati Sambhajinagar',
        country: 'India',
        pricePerNight: 3000,
        amenities: ['WiFi', 'Restaurant'],
        images: ['https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=800&q=80'],
        rating: 4.0,
        totalRooms: 80,
        availableRooms: 40
      },
      {
        name: 'Hotel Panchavati',
        description: 'A comfortable budget hotel located near the station. Offers standard traveler conveniences, clean air-conditioned rooms, free WiFi, secure parking, and warm local hospitality perfect for short visits.',
        address: 'Station Rd, Padampura',
        city: 'Chhatrapati Sambhajinagar',
        country: 'India',
        pricePerNight: 1700,
        amenities: ['WiFi', 'Parking'],
        images: ['https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80'],
        rating: 3.9,
        totalRooms: 50,
        availableRooms: 20
      },
      {
        name: 'Hotel Royal Regency',
        description: 'An extremely affordable budget lodge located right opposite the railway station. Features standard essential lodging conveniences, 24-hour reception desk, and free WiFi, catering to backpackers and transit travelers.',
        address: 'Station Rd, opposite Railway Station',
        city: 'Chhatrapati Sambhajinagar',
        country: 'India',
        pricePerNight: 800,
        amenities: ['WiFi'],
        images: ['https://images.unsplash.com/photo-1498503182468-3b51cbb6cb24?auto=format&fit=crop&w=800&q=80'],
        rating: 3.9,
        totalRooms: 30,
        availableRooms: 15
      },
      {
        name: 'Hotel Amarpreet',
        description: 'A renowned business stay featuring modern rooms, cozy garden dining, premium banquet spaces, and top-tier hospitality located on Jalna Road. Welcomes business executives and family gatherings with standard premium comforts.',
        address: 'Amarpreet Chowk, Jalna Rd',
        city: 'Chhatrapati Sambhajinagar',
        country: 'India',
        pricePerNight: 3500,
        amenities: ['WiFi', 'Restaurant', 'Parking'],
        images: ['https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=800&q=80'],
        rating: 4.0,
        totalRooms: 65,
        availableRooms: 32
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

    // Seed a sample booking for the guest user
    console.log('Seeding Bookings...');
    const guestUser = users[0];
    const sampleRoom = rooms[0];
    const sampleHotel = hotels[0];

    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 7);
    checkIn.setUTCHours(0, 0, 0, 0);

    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + 3);

    const nights = 3;
    const totalPrice = Math.round(sampleRoom.pricePerNight * nights * 100) / 100;

    const booking = await Booking.create({
      user: guestUser._id,
      hotel: sampleHotel._id,
      room: sampleRoom._id,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      totalPrice,
      status: 'confirmed',
      guestDetails: {
        name: guestUser.name,
        email: guestUser.email,
        phone: guestUser.phone,
        guestCount: 1
      }
    });

    await User.findByIdAndUpdate(guestUser._id, {
      $push: { bookings: booking._id }
    });

    console.log('Successfully seeded 1 sample Booking.');

    console.log('Database Seeding finished successfully!');
    process.exit(0);
  } catch (error) {
    console.error(`Error with data seeding: ${error.message}`);
    process.exit(1);
  }
};

seedData();
