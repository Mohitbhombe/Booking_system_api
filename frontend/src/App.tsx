import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, 
  MapPin, 
  Star, 
  Calendar, 
  LogOut, 
  Activity, 
  Loader, 
  X, 
  Check, 
  AlertCircle, 
  Home, 
  Sparkles, 
  Bookmark,
  Plus,
  Trash2,
  Edit2,
  Users,
  Layers,
  Settings,
  ChevronRight,
  Filter
} from 'lucide-react';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Set up Axios defaults
axios.defaults.baseURL = API_BASE_URL;
const token = localStorage.getItem('jwt_token');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
}

interface Hotel {
  _id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  country: string;
  pricePerNight: number;
  amenities: string[];
  images: string[];
  rating: number;
  totalRooms: number;
  availableRooms: number;
}

interface Room {
  _id: string;
  roomNumber: string;
  type: string;
  hotel: any;
  pricePerNight: number;
  capacity: number;
  amenities: string[];
  isAvailable: boolean;
}

interface Booking {
  _id: string;
  user: any;
  hotel: Hotel;
  room: Room;
  checkInDate: string;
  checkOutDate: string;
  totalPrice: number;
  status: string;
  guestDetails: {
    name: string;
    email: string;
    phone: string;
    guestCount: number;
  };
  facilities?: string[];
  createdAt: string;
}

function App() {
  // Navigation & View States
  const [activeTab, setActiveTab] = useState<'hotels' | 'bookings' | 'admin'>('hotels');
  const [adminActiveTab, setAdminActiveTab] = useState<'hotels' | 'rooms' | 'bookings'>('hotels');
  
  // Auth States
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  
  // Data States
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingHotels, setLoadingHotels] = useState(false);
  
  // Search Widget Filters
  const [searchCheckIn, setSearchCheckIn] = useState('');
  const [searchCheckOut, setSearchCheckOut] = useState('');
  const [searchGuests, setSearchGuests] = useState(2);
  
  // MakeMyTrip Filter States
  const [filterPrice, setFilterPrice] = useState<number | null>(null); // null = all, 100 = <100, 200 = 100-200, 300 = >200
  const [filterRating, setFilterRating] = useState<number | null>(null); // stars & above
  const [filterAmenity, setFilterAmenity] = useState<string | null>(null); // Specific amenity
  
  // Hotel Detail Modal States
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  
  // Booking Modal States
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestCount, setGuestCount] = useState(1);
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [submittingBooking, setSubmittingBooking] = useState(false);

  // User Bookings States
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Admin Systems States
  const [allSystemBookings, setAllSystemBookings] = useState<Booking[]>([]);
  const [loadingSystemBookings, setLoadingSystemBookings] = useState(false);
  const [systemBookingsSearch, setSystemBookingsSearch] = useState('');

  // Admin Hotel Add/Edit States
  const [showHotelModal, setShowHotelModal] = useState(false);
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
  const [hotelForm, setHotelForm] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    country: '',
    pricePerNight: 100,
    amenities: 'Free Wi-Fi, Swimming Pool, Gym',
    images: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
    totalRooms: 10,
    availableRooms: 10
  });

  // Admin Room Add/Edit States
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [adminSelectedHotelId, setAdminSelectedHotelId] = useState('');
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomForm, setRoomForm] = useState({
    roomNumber: '',
    type: 'Standard',
    pricePerNight: 80,
    capacity: 2,
    amenities: 'AC, Flat Screen TV, Mini Bar',
    isAvailable: true
  });

  // Global Alerts / Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Trigger custom toast
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Fetch current user session
  const fetchProfile = async () => {
    try {
      const res = await axios.get('/auth/profile');
      if (res.data.success) {
        setUser(res.data.data);
      }
    } catch (err) {
      console.log('No valid active session');
      localStorage.removeItem('jwt_token');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
    }
  };

  // Fetch all hotels or search
  const fetchHotels = async (search = '') => {
    setLoadingHotels(true);
    try {
      const url = search ? `/hotels?search=${encodeURIComponent(search)}` : '/hotels';
      const res = await axios.get(url);
      if (res.data.success) {
        setHotels(res.data.data);
      }
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to fetch hotels', 'error');
    } finally {
      setLoadingHotels(false);
    }
  };

  // Fetch rooms for a selected hotel
  const fetchRooms = async (hotelId: string) => {
    setLoadingRooms(true);
    try {
      const res = await axios.get(`/hotels/${hotelId}/rooms`);
      if (res.data.success) {
        setRooms(res.data.data);
      }
    } catch (err: any) {
      showToast('Failed to fetch rooms', 'error');
    } finally {
      setLoadingRooms(false);
    }
  };

  // Fetch user reservations
  const fetchBookings = async () => {
    setLoadingBookings(true);
    try {
      const res = await axios.get('/bookings/me');
      if (res.data.success) {
        setMyBookings(res.data.data);
      }
    } catch (err: any) {
      showToast('Failed to retrieve bookings', 'error');
    } finally {
      setLoadingBookings(false);
    }
  };

  // Fetch all system bookings for Admin
  const fetchSystemBookings = async () => {
    setLoadingSystemBookings(true);
    try {
      const res = await axios.get('/bookings');
      if (res.data.success) {
        setAllSystemBookings(res.data.data);
      }
    } catch (err: any) {
      showToast('Failed to retrieve system bookings', 'error');
    } finally {
      setLoadingSystemBookings(false);
    }
  };

  // Trigger search
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchHotels(searchTerm);
    }, 350);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  // Initial loads
  useEffect(() => {
    fetchProfile();
    fetchHotels();
  }, []);

  // Sync tabs when clicked
  useEffect(() => {
    if (activeTab === 'bookings' && user) {
      fetchBookings();
    } else if (activeTab === 'admin' && user?.role === 'admin') {
      fetchHotels();
      fetchSystemBookings();
    }
  }, [activeTab, user]);

  // Load nested rooms when admin changes selected hotel in room dashboard
  useEffect(() => {
    if (adminSelectedHotelId) {
      fetchRooms(adminSelectedHotelId);
    }
  }, [adminSelectedHotelId]);

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post('/auth/login', { email, password });
      if (res.data.success) {
        const jwt = res.data.token;
        localStorage.setItem('jwt_token', jwt);
        axios.defaults.headers.common['Authorization'] = `Bearer ${jwt}`;
        setUser(res.data.user || { name: 'Guest User', email, role: 'guest', id: '' });
        setShowAuthModal(false);
        showToast('Successfully logged in!', 'success');
        setEmail('');
        setPassword('');
        fetchProfile();
      }
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Login failed', 'error');
    }
  };

  // Register handler
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post('/auth/register', {
        name: registerName,
        email,
        password,
        phone: registerPhone,
        role: 'guest'
      });
      if (res.data.success) {
        const jwt = res.data.token;
        localStorage.setItem('jwt_token', jwt);
        axios.defaults.headers.common['Authorization'] = `Bearer ${jwt}`;
        setUser(res.data.user || { name: registerName, email, role: 'guest', id: '' });
        setShowAuthModal(false);
        showToast('Account registered successfully!', 'success');
        setRegisterName('');
        setRegisterPhone('');
        setEmail('');
        setPassword('');
        fetchProfile();
      }
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Registration failed', 'error');
    }
  };

  // Quick Mock Login feature
  const handleQuickLogin = async (mockEmail: string, mockPass: string) => {
    try {
      const res = await axios.post('/auth/login', { email: mockEmail, password: mockPass });
      if (res.data.success) {
        const jwt = res.data.token;
        localStorage.setItem('jwt_token', jwt);
        axios.defaults.headers.common['Authorization'] = `Bearer ${jwt}`;
        setShowAuthModal(false);
        showToast(`Welcome back, ${res.data.user.name}!`, 'success');
        fetchProfile();
      }
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Quick Login failed', 'error');
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await axios.post('/auth/logout');
    } catch (err) {
      console.log('Token blacklisting backend skipped');
    }
    localStorage.removeItem('jwt_token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setActiveTab('hotels');
    showToast('Logged out successfully.');
  };

  // Modal selector for hotel details
  const handleSelectHotel = (hotel: Hotel) => {
    setSelectedHotel(hotel);
    fetchRooms(hotel._id);
  };

  // Start Room booking flow
  const handleOpenBooking = (room: Room) => {
    if (!user) {
      setAuthMode('login');
      setShowAuthModal(true);
      showToast('Please log in or register to make a reservation.', 'error');
      return;
    }
    setSelectedRoom(room);
    setSelectedFacilities([]);
    setGuestName(user.name || '');
    setGuestEmail(user.email || '');
    setGuestPhone(user.phone || '');
    
    // Pre-populate logical check-in check-out dates
    const today = new Date();
    const checkInDate = new Date(today);
    checkInDate.setDate(today.getDate() + 1);
    const checkOutDate = new Date(checkInDate);
    checkOutDate.setDate(checkInDate.getDate() + 3);
    
    setCheckIn(checkInDate.toISOString().split('T')[0]);
    setCheckOut(checkOutDate.toISOString().split('T')[0]);
  };

  // Facility checking toggler
  const handleToggleFacility = (facility: string) => {
    if (selectedFacilities.includes(facility)) {
      setSelectedFacilities(selectedFacilities.filter(f => f !== facility));
    } else {
      setSelectedFacilities([...selectedFacilities, facility]);
    }
  };

  // Handle Booking form submit
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom || !selectedHotel) return;
    
    setSubmittingBooking(true);
    try {
      const res = await axios.post('/bookings', {
        hotel: selectedHotel._id,
        room: selectedRoom._id,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        guestDetails: {
          name: guestName,
          email: guestEmail,
          phone: guestPhone,
          guestCount: guestCount
        },
        facilities: selectedFacilities
      });
      if (res.data.success) {
        showToast('Reservation booked successfully!', 'success');
        setSelectedRoom(null);
        setSelectedHotel(null);
        setActiveTab('bookings');
      }
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to create booking', 'error');
    } finally {
      setSubmittingBooking(false);
    }
  };

  // Handle Cancel Booking
  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) return;
    try {
      const res = await axios.put(`/bookings/${bookingId}/cancel`);
      if (res.data.success) {
        showToast('Reservation cancelled successfully.', 'success');
        if (user?.role === 'admin') {
          fetchSystemBookings();
        } else {
          fetchBookings();
        }
      }
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Cancellation failed', 'error');
    }
  };

  // Admin update booking status (confirm / cancel)
  const handleAdminUpdateStatus = async (bookingId: string, status: string) => {
    try {
      const res = await axios.put(`/bookings/${bookingId}/status`, { status });
      if (res.data.success) {
        showToast(`Booking marked as ${status} successfully.`, 'success');
        fetchSystemBookings();
      }
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Status update failed', 'error');
    }
  };

  // Admin Hotels CRUD operations
  const handleCreateOrUpdateHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...hotelForm,
      pricePerNight: Number(hotelForm.pricePerNight),
      totalRooms: Number(hotelForm.totalRooms),
      availableRooms: Number(hotelForm.availableRooms),
      amenities: hotelForm.amenities.split(',').map(s => s.trim()).filter(Boolean),
      images: hotelForm.images.split(',').map(s => s.trim()).filter(Boolean)
    };

    try {
      let res;
      if (editingHotel) {
        res = await axios.put(`/hotels/${editingHotel._id}`, payload);
        showToast('Hotel updated successfully!', 'success');
      } else {
        res = await axios.post('/hotels', payload);
        showToast('New hotel registered successfully!', 'success');
      }
      if (res.data.success) {
        setShowHotelModal(false);
        setEditingHotel(null);
        fetchHotels();
      }
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to persist hotel details', 'error');
    }
  };

  const handleEditHotelClick = (hotel: Hotel) => {
    setEditingHotel(hotel);
    setHotelForm({
      name: hotel.name,
      description: hotel.description,
      address: hotel.address,
      city: hotel.city,
      country: hotel.country,
      pricePerNight: hotel.pricePerNight,
      amenities: hotel.amenities.join(', '),
      images: hotel.images.join(', '),
      totalRooms: hotel.totalRooms,
      availableRooms: hotel.availableRooms
    });
    setShowHotelModal(true);
  };

  const handleDeleteHotel = async (hotelId: string) => {
    if (!window.confirm('Are you sure you want to delete this hotel and all its associations?')) return;
    try {
      const res = await axios.delete(`/hotels/${hotelId}`);
      if (res.data.success) {
        showToast('Hotel deleted successfully.', 'success');
        fetchHotels();
      }
    } catch (err: any) {
      showToast('Deletion failed.', 'error');
    }
  };

  // Admin Rooms CRUD operations
  const handleCreateOrUpdateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminSelectedHotelId) return;

    const payload = {
      ...roomForm,
      pricePerNight: Number(roomForm.pricePerNight),
      capacity: Number(roomForm.capacity),
      amenities: roomForm.amenities.split(',').map(s => s.trim()).filter(Boolean),
      hotel: adminSelectedHotelId
    };

    try {
      let res;
      if (editingRoom) {
        res = await axios.put(`/rooms/${editingRoom._id}`, payload);
        showToast('Room details updated successfully.', 'success');
      } else {
        res = await axios.post(`/hotels/${adminSelectedHotelId}/rooms`, payload);
        showToast('New room registered successfully.', 'success');
      }
      if (res.data.success) {
        setShowRoomModal(false);
        setEditingRoom(null);
        fetchRooms(adminSelectedHotelId);
      }
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Room persistence failed.', 'error');
    }
  };

  const handleEditRoomClick = (room: Room) => {
    setEditingRoom(room);
    setRoomForm({
      roomNumber: room.roomNumber,
      type: room.type,
      pricePerNight: room.pricePerNight,
      capacity: room.capacity,
      amenities: room.amenities.join(', '),
      isAvailable: room.isAvailable
    });
    setShowRoomModal(true);
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!window.confirm('Delete this room accommodation permanently?')) return;
    try {
      const res = await axios.delete(`/rooms/${roomId}`);
      if (res.data.success) {
        showToast('Room successfully deleted.', 'success');
        fetchRooms(adminSelectedHotelId);
      }
    } catch (err: any) {
      showToast('Room deletion failed.', 'error');
    }
  };

  // Helpers to calculate prices
  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const timeDiff = end.getTime() - start.getTime();
    if (timeDiff <= 0) return 0;
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  const calculateTotalPrice = () => {
    const nights = calculateNights();
    if (!selectedRoom) return 0;
    
    let base = nights * selectedRoom.pricePerNight;
    
    // Facility charges (matching backend prices)
    let extra = 0;
    const facilityPrices: Record<string, number> = {
      'Airport Shuttle': 25,
      'Breakfast Buffet': 15,
      'Spa Access': 40,
      'Late Check-out': 10
    };
    
    selectedFacilities.forEach(facility => {
      if (facilityPrices[facility] !== undefined) {
        extra += facilityPrices[facility];
      }
    });

    return base + extra;
  };

  // Filtered hotel array for MMT search and filter bar
  const filteredHotels = hotels.filter(hotel => {
    // Fuzzy search already handled on backend, but filters can narrow down
    if (filterPrice) {
      if (filterPrice === 100 && hotel.pricePerNight >= 100) return false;
      if (filterPrice === 200 && (hotel.pricePerNight < 100 || hotel.pricePerNight > 200)) return false;
      if (filterPrice === 300 && hotel.pricePerNight <= 200) return false;
    }

    if (filterRating) {
      if (hotel.rating < filterRating) return false;
    }

    if (filterAmenity) {
      const hasAmenity = hotel.amenities.some(a => a.toLowerCase().includes(filterAmenity.toLowerCase()));
      if (!hasAmenity) return false;
    }

    return true;
  });

  // Filtered system bookings for admin
  const filteredSystemBookings = allSystemBookings.filter(b => {
    if (!systemBookingsSearch) return true;
    const search = systemBookingsSearch.toLowerCase();
    const guestName = b.guestDetails?.name?.toLowerCase() || '';
    const guestEmail = b.guestDetails?.email?.toLowerCase() || '';
    const hotelName = b.hotel?.name?.toLowerCase() || '';
    return guestName.includes(search) || guestEmail.includes(search) || hotelName.includes(search);
  });

  return (
    <>
      {/* Toast Notifications */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header / Navbar */}
      <header className="navbar">
        <div className="container navbar-content">
          <div className="logo-container" onClick={() => { setActiveTab('hotels'); setSelectedHotel(null); }}>
            <Sparkles size={24} color="#6366f1" />
            <span className="logo-text">LuxeStay</span>
          </div>

          <nav className="nav-links">
            <span 
              className={`nav-link ${activeTab === 'hotels' ? 'active' : ''}`}
              onClick={() => { setActiveTab('hotels'); setSelectedHotel(null); }}
            >
              <Home size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              Hotels
            </span>
            {user && (
              <span 
                className={`nav-link ${activeTab === 'bookings' ? 'active' : ''}`}
                onClick={() => setActiveTab('bookings')}
              >
                <Bookmark size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                My Bookings
              </span>
            )}
            {user?.role === 'admin' && (
              <span 
                className={`nav-link ${activeTab === 'admin' ? 'active' : ''}`}
                onClick={() => setActiveTab('admin')}
                style={{ border: '1px solid var(--primary)', color: 'var(--primary)', fontWeight: '700' }}
              >
                <Settings size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                Admin Panel
              </span>
            )}

            {user ? (
              <div className="profile-widget">
                <div className="profile-avatar">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className="profile-name">{user.name}</span>
                  <span style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    {user.role}
                  </span>
                </div>
                <span title="Logout Session" style={{ display: 'inline-flex', cursor: 'pointer' }}>
                  <LogOut 
                    size={16} 
                    className="logout-icon" 
                    onClick={handleLogout} 
                  />
                </span>
              </div>
            ) : (
              <button 
                className="auth-button" 
                onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
              >
                Log In
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="container" style={{ flex: 1, paddingBottom: '80px' }}>
        
        {/* ================= GUEST HOTELS BROWSER ================= */}
        {activeTab === 'hotels' && (
          <>
            {/* Quick Login / Welcome Banner */}
            {!user ? (
              <div className="login-prompt-banner" onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}>
                <div className="login-prompt-left">
                  <span className="login-prompt-badge">🔑 DEMO ACCESS AVAILABLE</span>
                  <span className="login-prompt-text">
                    You are browsing in <strong>Guest Mode</strong>. Click here to instantly log in using a pre-seeded account and unlock premium hotel bookings!
                  </span>
                </div>
                <button className="login-prompt-btn">Log In Instantly</button>
              </div>
            ) : (
              <div className="welcome-member-banner">
                <span className="welcome-member-badge">✨ LUXESTAY VIP MEMBER</span>
                <span className="welcome-member-text">
                  Welcome back, <strong>{user.name}</strong>! You have authorized member access to secure premium rooms and custom facilities.
                </span>
              </div>
            )}

            {/* MakeMyTrip Styled Hero Section */}
            <section className="mmt-hero">
              <span className="mmt-hero-tag">🌟 Premium Local Getaways</span>
              <h1>Find Your Perfect Luxury Stay</h1>
              <p>Book premium resorts, boutique rooms, and holiday accommodations with exclusive surcharged facilities.</p>
              
              {/* MakeMyTrip horizontal search widget */}
              <div className="mmt-search-card">
                <div className="mmt-search-col">
                  <div className="mmt-label">City, Area or Property</div>
                  <input 
                    type="text" 
                    placeholder="Where are you travelling?" 
                    className="mmt-search-input-box"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="mmt-search-col">
                  <div className="mmt-label">Check-In</div>
                  <div className="mmt-search-val-input-wrapper">
                    <Calendar size={15} color="var(--primary)" />
                    <input 
                      type="date" 
                      className="mmt-search-date-input"
                      value={searchCheckIn}
                      onChange={(e) => setSearchCheckIn(e.target.value)}
                    />
                  </div>
                </div>
                <div className="mmt-search-col">
                  <div className="mmt-label">Check-Out</div>
                  <div className="mmt-search-val-input-wrapper">
                    <Calendar size={15} color="var(--primary)" />
                    <input 
                      type="date" 
                      className="mmt-search-date-input"
                      value={searchCheckOut}
                      onChange={(e) => setSearchCheckOut(e.target.value)}
                    />
                  </div>
                </div>
                <div className="mmt-search-col last-col">
                  <div className="mmt-label">Rooms & Guests</div>
                  <div className="mmt-search-val-input-wrapper">
                    <Users size={15} color="var(--primary)" />
                    <select 
                      className="mmt-search-select"
                      value={searchGuests}
                      onChange={(e) => setSearchGuests(Number(e.target.value))}
                    >
                      <option value={1}>1 Room, 1 Guest</option>
                      <option value={2}>1 Room, 2 Guests</option>
                      <option value={3}>1 Room, 3 Guests</option>
                      <option value={4}>2 Rooms, 4 Guests</option>
                      <option value={5}>2 Rooms, 5+ Guests</option>
                    </select>
                  </div>
                </div>
                
                <div className="mmt-search-btn-wrapper">
                  <button className="mmt-search-btn" onClick={() => fetchHotels(searchTerm)}>
                    Search Hotels
                  </button>
                </div>
              </div>
            </section>

            {/* Horizontal Filter Bar */}
            <section className="mmt-filter-section">
              <div className="mmt-filter-group">
                <span className="mmt-filter-title"><Filter size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Filters:</span>
                
                {/* Price Filters */}
                <button 
                  className={`mmt-filter-pill ${filterPrice === null ? 'active' : ''}`}
                  onClick={() => setFilterPrice(null)}
                >
                  All Prices
                </button>
                <button 
                  className={`mmt-filter-pill ${filterPrice === 100 ? 'active' : ''}`}
                  onClick={() => setFilterPrice(100)}
                >
                  &lt; $100 / night
                </button>
                <button 
                  className={`mmt-filter-pill ${filterPrice === 200 ? 'active' : ''}`}
                  onClick={() => setFilterPrice(200)}
                >
                  $100 - $200
                </button>
                <button 
                  className={`mmt-filter-pill ${filterPrice === 300 ? 'active' : ''}`}
                  onClick={() => setFilterPrice(300)}
                >
                  &gt; $200 / night
                </button>
              </div>

              <div className="mmt-filter-group" style={{ marginLeft: '12px' }}>
                {/* Star Ratings */}
                <button 
                  className={`mmt-filter-pill ${filterRating === null ? 'active' : ''}`}
                  onClick={() => setFilterRating(null)}
                >
                  Any Rating
                </button>
                <button 
                  className={`mmt-filter-pill ${filterRating === 4 ? 'active' : ''}`}
                  onClick={() => setFilterRating(4)}
                >
                  4★ & above
                </button>
                <button 
                  className={`mmt-filter-pill ${filterRating === 5 ? 'active' : ''}`}
                  onClick={() => setFilterRating(5)}
                >
                  5★ Premium
                </button>
              </div>

              <div className="mmt-filter-group" style={{ marginLeft: '12px' }}>
                {/* Amenities */}
                <button 
                  className={`mmt-filter-pill ${filterAmenity === null ? 'active' : ''}`}
                  onClick={() => setFilterAmenity(null)}
                >
                  Any Amenity
                </button>
                <button 
                  className={`mmt-filter-pill ${filterAmenity === 'pool' ? 'active' : ''}`}
                  onClick={() => setFilterAmenity('pool')}
                >
                  Pool
                </button>
                <button 
                  className={`mmt-filter-pill ${filterAmenity === 'wi-fi' ? 'active' : ''}`}
                  onClick={() => setFilterAmenity('wi-fi')}
                >
                  Wi-Fi
                </button>
              </div>
            </section>

            {/* List Header */}
            <h2 className="section-title">
              <span>Our Exclusive Premium Stays ({filteredHotels.length})</span>
              {loadingHotels && <Loader size={20} className="spinner" style={{ margin: 0 }} />}
            </h2>

            {/* Premium MakeMyTrip Hotels Listing */}
            {loadingHotels && filteredHotels.length === 0 ? (
              <div className="loading-box">
                <div className="spinner"></div>
                <p>Finding premium MakeMyTrip deals...</p>
              </div>
            ) : filteredHotels.length === 0 ? (
              <div className="loading-box" style={{ padding: '64px 24px' }}>
                <AlertCircle size={40} style={{ marginBottom: '16px', color: 'var(--text-muted)' }} />
                <h3>No luxury properties found matching selected filters.</h3>
                <p>Try resetting filters or searching for other destinations.</p>
              </div>
            ) : (
              <section style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filteredHotels.map((hotel) => (
                  <div 
                    key={hotel._id} 
                    className="mmt-hotel-card"
                  >
                    {/* Image Block */}
                    <div className="mmt-hotel-img-wrapper">
                      <img 
                        src={hotel.images[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'} 
                        alt={hotel.name} 
                        className="mmt-hotel-img"
                      />
                      {hotel.rating >= 4.5 ? (
                        <span className="mmt-badge premium">Luxe Pick</span>
                      ) : (
                        <span className="mmt-badge trending">Best Value</span>
                      )}
                    </div>

                    {/* Details Panel */}
                    <div className="mmt-hotel-details">
                      <div className="mmt-hotel-header">
                        <div className="mmt-hotel-stars">
                          {Array.from({ length: Math.round(hotel.rating || 4) }).map((_, i) => (
                            <Star key={i} size={14} fill="#fbbf24" color="#fbbf24" />
                          ))}
                        </div>
                        <h3 className="mmt-hotel-title">{hotel.name}</h3>
                        <div className="mmt-hotel-loc">
                          <MapPin size={14} color="var(--primary)" />
                          <span>{hotel.address}, {hotel.city}, {hotel.country}</span>
                        </div>
                      </div>

                      <p className="mmt-hotel-desc">{hotel.description}</p>

                      <div className="mmt-hotel-tagline">
                        {hotel.amenities.slice(0, 3).map((item, idx) => (
                          <span key={idx} className="mmt-pill">
                            {item}
                          </span>
                        ))}
                        <span className="mmt-pill success">Free Cancellation</span>
                      </div>
                    </div>

                    {/* MakeMyTrip Price Breakdown & Review */}
                    <div className="mmt-price-panel">
                      <div className="mmt-review-row">
                        <div style={{ textAlign: 'right' }}>
                          <span className="mmt-rating-text">
                            {hotel.rating >= 4.5 ? 'Exceptional' : hotel.rating >= 4.0 ? 'Wonderful' : 'Good'}
                          </span>
                          <div className="mmt-rating-count">1,248 reviews</div>
                        </div>
                        <span className="mmt-rating-score">{hotel.rating ? hotel.rating.toFixed(1) : '4.2'}</span>
                      </div>

                      <div className="mmt-original-price">${(hotel.pricePerNight * 1.25).toFixed(0)}</div>
                      <div className="mmt-discount-price">${hotel.pricePerNight}</div>
                      <span className="mmt-tax-text">+ taxes & service fees</span>

                      <button 
                        className="mmt-view-rooms-btn"
                        onClick={() => handleSelectHotel(hotel)}
                      >
                        View Rooms <ChevronRight size={14} style={{ verticalAlign: 'middle', marginLeft: '4px' }} />
                      </button>
                    </div>
                  </div>
                ))}
              </section>
            )}
          </>
        )}

        {/* ================= GUEST PERSONAL BOOKINGS ================= */}
        {activeTab === 'bookings' && (
          <section className="bookings-dashboard">
            <h2 className="section-title">My Travel Reservations</h2>
            
            {loadingBookings ? (
              <div className="loading-box">
                <div className="spinner"></div>
                <p>Retrieving your bookings...</p>
              </div>
            ) : myBookings.length === 0 ? (
              <div className="loading-box" style={{ border: '1px dashed var(--border)', borderRadius: '12px', marginTop: '24px' }}>
                <Activity size={40} style={{ marginBottom: '16px', color: 'var(--text-muted)' }} />
                <h3>You don't have any bookings yet.</h3>
                <p>Browse our list of hotels and secure your first premium room stay!</p>
                <button 
                  className="auth-button" 
                  style={{ marginTop: '20px' }}
                  onClick={() => setActiveTab('hotels')}
                >
                  Explore Hotels
                </button>
              </div>
            ) : (
              <div className="bookings-grid">
                {myBookings.map((b) => (
                  <div key={b._id} className="booking-ticket">
                    <img 
                      src={b.hotel?.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'} 
                      alt={b.hotel?.name} 
                      className="booking-ticket-img"
                    />
                    <div className="booking-ticket-body">
                      <div className="booking-ticket-header">
                        <h3 className="booking-ticket-hotel">{b.hotel?.name || 'Grand Hyatt Resort'}</h3>
                        <div className="booking-ticket-room">
                          Type: <strong>{b.room?.type || 'Double Room'}</strong> (Room {b.room?.roomNumber || '101'})
                        </div>
                        <div className="booking-ticket-dates">
                          <Calendar size={13} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                          {new Date(b.checkInDate).toLocaleDateString()} – {new Date(b.checkOutDate).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                        Reserved under: <strong>{b.guestDetails?.name}</strong> • Guests: {b.guestDetails?.guestCount}
                      </div>

                      {/* Display Selected surcharged facilities */}
                      {b.facilities && b.facilities.length > 0 && (
                        <div style={{ marginTop: '12px' }}>
                          <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold', color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>
                            Included Facilities:
                          </span>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {b.facilities.map((fac, idx) => (
                              <span key={idx} style={{ fontSize: '11px', background: 'var(--primary-light)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                                ✓ {fac}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="booking-ticket-aside">
                      <span className={`booking-ticket-status ${b.status}`}>
                        {b.status}
                      </span>
                      <div style={{ textAlign: 'right' }}>
                        <div className="booking-ticket-price">${b.totalPrice}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>total price</div>
                      </div>
                      {b.status === 'confirmed' && (
                        <button 
                          className="booking-cancel-btn"
                          onClick={() => handleCancelBooking(b._id)}
                        >
                          Cancel Reservation
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ================= ADMIN MANAGEMENT DASHBOARD ================= */}
        {activeTab === 'admin' && user?.role === 'admin' && (
          <section className="bookings-dashboard">
            <h2 className="section-title">
              <span>LuxeStay System Administrator Panel</span>
              <span style={{ fontSize: '13px', background: 'var(--primary-light)', color: 'var(--primary)', padding: '6px 12px', borderRadius: '8px', fontWeight: 'bold' }}>
                ADMIN CONTROL ENVIRONMENT
              </span>
            </h2>

            {/* Tabs Bar */}
            <div className="admin-tab-bar">
              <div 
                className={`admin-tab ${adminActiveTab === 'hotels' ? 'active' : ''}`}
                onClick={() => setAdminActiveTab('hotels')}
              >
                <Home size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                Manage Hotels
              </div>
              <div 
                className={`admin-tab ${adminActiveTab === 'rooms' ? 'active' : ''}`}
                onClick={() => setAdminActiveTab('rooms')}
              >
                <Layers size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                Manage Accommodations
              </div>
              <div 
                className={`admin-tab ${adminActiveTab === 'bookings' ? 'active' : ''}`}
                onClick={() => setAdminActiveTab('bookings')}
              >
                <Bookmark size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                System Bookings
                <span className="admin-badge-count">{filteredSystemBookings.length}</span>
              </div>
            </div>

            {/* ================= SUB-PANEL: HOTEL CRUD ================= */}
            {adminActiveTab === 'hotels' && (
              <div className="admin-panel">
                <div className="admin-header-actions">
                  <h3>Global Properties ({hotels.length})</h3>
                  <button 
                    className="admin-btn"
                    onClick={() => {
                      setEditingHotel(null);
                      setHotelForm({
                        name: '',
                        description: '',
                        address: '',
                        city: '',
                        country: '',
                        pricePerNight: 120,
                        amenities: 'Free Wi-Fi, Swimming Pool, Gym, Room Service',
                        images: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
                        totalRooms: 10,
                        availableRooms: 10
                      });
                      setShowHotelModal(true);
                    }}
                  >
                    <Plus size={16} /> Add New Hotel
                  </button>
                </div>

                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Hotel Details</th>
                        <th>Location</th>
                        <th>Price/Night</th>
                        <th>Availability</th>
                        <th>Amenities</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hotels.map((hotel) => (
                        <tr key={hotel._id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <img 
                                src={hotel.images[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'} 
                                alt={hotel.name} 
                                style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }}
                              />
                              <div>
                                <strong style={{ color: 'var(--text-primary)' }}>{hotel.name}</strong>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Rating: {hotel.rating.toFixed(1)} ★</div>
                              </div>
                            </div>
                          </td>
                          <td>{hotel.city}, {hotel.country}</td>
                          <td><strong style={{ color: 'var(--text-primary)' }}>${hotel.pricePerNight}</strong></td>
                          <td>{hotel.availableRooms} / {hotel.totalRooms} Rooms</td>
                          <td>
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxWidth: '240px' }}>
                              {hotel.amenities.slice(0, 3).map((a, i) => (
                                <span key={i} className="mmt-pill">{a}</span>
                              ))}
                              {hotel.amenities.length > 3 && <span className="mmt-pill">+{hotel.amenities.length - 3}</span>}
                            </div>
                          </td>
                          <td>
                            <div className="admin-action-group">
                              <button className="admin-icon-btn" onClick={() => handleEditHotelClick(hotel)} title="Edit details">
                                <Edit2 size={16} />
                              </button>
                              <button className="admin-icon-btn delete" onClick={() => handleDeleteHotel(hotel._id)} title="Delete properties">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ================= SUB-PANEL: ROOM CRUD ================= */}
            {adminActiveTab === 'rooms' && (
              <div className="admin-panel">
                <div className="admin-header-actions" style={{ gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Select Hotel:</span>
                    <select 
                      className="form-input" 
                      style={{ width: '280px', margin: 0 }}
                      value={adminSelectedHotelId}
                      onChange={(e) => setAdminSelectedHotelId(e.target.value)}
                    >
                      <option value="">-- Choose Hotel Property --</option>
                      {hotels.map(h => (
                        <option key={h._id} value={h._id}>{h.name} ({h.city})</option>
                      ))}
                    </select>
                  </div>
                  
                  {adminSelectedHotelId && (
                    <button 
                      className="admin-btn"
                      onClick={() => {
                        setEditingRoom(null);
                        setRoomForm({
                          roomNumber: '',
                          type: 'Standard',
                          pricePerNight: 90,
                          capacity: 2,
                          amenities: 'Flat TV, Private Bath, Safe, Wi-Fi',
                          isAvailable: true
                        });
                        setShowRoomModal(true);
                      }}
                    >
                      <Plus size={16} /> Add Room to Hotel
                    </button>
                  )}
                </div>

                {!adminSelectedHotelId ? (
                  <div className="admin-empty-state" style={{ border: '1px dashed var(--border)', borderRadius: '12px' }}>
                    <Layers size={40} style={{ marginBottom: '12px' }} />
                    <h4>Select a hotel above to configure room inventory.</h4>
                    <p>You can manage availability and rates per individual accommodation unit.</p>
                  </div>
                ) : rooms.length === 0 ? (
                  <div className="admin-empty-state" style={{ border: '1px dashed var(--border)', borderRadius: '12px' }}>
                    <Layers size={40} style={{ marginBottom: '12px' }} />
                    <h4>No rooms configured for this hotel yet.</h4>
                    <p>Click "Add Room to Hotel" above to configure your first guest room!</p>
                  </div>
                ) : (
                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Room Number</th>
                          <th>Category Type</th>
                          <th>Capacity</th>
                          <th>Price / Night</th>
                          <th>Amenities</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rooms.map((room) => (
                          <tr key={room._id}>
                            <td><strong>{room.roomNumber}</strong></td>
                            <td>{room.type}</td>
                            <td>👥 {room.capacity} Guests</td>
                            <td><strong style={{ color: 'var(--text-primary)' }}>${room.pricePerNight}</strong></td>
                            <td>
                              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                {room.amenities.map((a, i) => (
                                  <span key={i} className="mmt-pill">{a}</span>
                                ))}
                              </div>
                            </td>
                            <td>
                              <span className={`admin-status-badge ${room.isAvailable ? 'confirmed' : 'cancelled'}`} style={{ fontSize: '10px' }}>
                                {room.isAvailable ? 'Available' : 'Maintenance'}
                              </span>
                            </td>
                            <td>
                              <div className="admin-action-group">
                                <button className="admin-icon-btn" onClick={() => handleEditRoomClick(room)}>
                                  <Edit2 size={16} />
                                </button>
                                <button className="admin-icon-btn delete" onClick={() => handleDeleteRoom(room._id)}>
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ================= SUB-PANEL: BOOKINGS LIST ================= */}
            {adminActiveTab === 'bookings' && (
              <div className="admin-panel">
                <div className="admin-header-actions">
                  <div className="admin-search-wrapper">
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                      type="text" 
                      placeholder="Search by guest name, email, hotel..." 
                      className="admin-search-input"
                      value={systemBookingsSearch}
                      onChange={(e) => setSystemBookingsSearch(e.target.value)}
                    />
                  </div>
                  <h3>Total System Bookings: {filteredSystemBookings.length}</h3>
                </div>

                {loadingSystemBookings && filteredSystemBookings.length === 0 ? (
                  <div className="loading-box">
                    <div className="spinner"></div>
                    <p>Retrieving database bookings...</p>
                  </div>
                ) : filteredSystemBookings.length === 0 ? (
                  <div className="admin-empty-state" style={{ border: '1px dashed var(--border)', borderRadius: '12px' }}>
                    <Bookmark size={40} style={{ marginBottom: '12px' }} />
                    <h4>No guest registrations match search.</h4>
                    <p>Active guest bookings will appear here for confirm/cancel actions.</p>
                  </div>
                ) : (
                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Guest Details</th>
                          <th>Hotel & Room</th>
                          <th>Dates & Nights</th>
                          <th>Facilities Included</th>
                          <th>Total Paid</th>
                          <th>Status</th>
                          <th>Change Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSystemBookings.map((b) => (
                          <tr key={b._id}>
                            <td>
                              <div>
                                <strong style={{ color: 'var(--text-primary)' }}>{b.guestDetails?.name || 'Guest User'}</strong>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{b.guestDetails?.email}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{b.guestDetails?.phone}</div>
                              </div>
                            </td>
                            <td>
                              <div>
                                <strong style={{ color: 'var(--text-primary)' }}>{b.hotel?.name}</strong>
                                <div style={{ fontSize: '11px' }}>{b.room?.type} Room (Number {b.room?.roomNumber})</div>
                              </div>
                            </td>
                            <td>
                              <div>
                                <span>{new Date(b.checkInDate).toLocaleDateString()} to {new Date(b.checkOutDate).toLocaleDateString()}</span>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                                  Stay Duration: {(() => {
                                    const s = new Date(b.checkInDate);
                                    const e = new Date(b.checkOutDate);
                                    const d = e.getTime() - s.getTime();
                                    return d > 0 ? Math.ceil(d / (1000 * 3600 * 24)) : 0;
                                  })()} Nights
                                </div>
                              </div>
                            </td>
                            <td>
                              {b.facilities && b.facilities.length > 0 ? (
                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxWidth: '180px' }}>
                                  {b.facilities.map((fac, idx) => (
                                    <span key={idx} style={{ fontSize: '10px', background: 'var(--primary-light)', color: 'var(--primary)', padding: '1px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                                      ✓ {fac}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>None</span>
                              )}
                            </td>
                            <td>
                              <strong style={{ color: 'var(--text-primary)', fontSize: '14px' }}>${b.totalPrice}</strong>
                            </td>
                            <td>
                              <span className={`admin-status-badge ${b.status}`}>
                                {b.status}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                {b.status === 'pending' && (
                                  <button 
                                    className="admin-btn" 
                                    style={{ padding: '4px 8px', fontSize: '11px', background: 'var(--success)' }}
                                    onClick={() => handleAdminUpdateStatus(b._id, 'confirmed')}
                                  >
                                    Confirm
                                  </button>
                                )}
                                {b.status !== 'cancelled' && (
                                  <button 
                                    className="admin-btn danger" 
                                    style={{ padding: '4px 8px', fontSize: '11px' }}
                                    onClick={() => handleAdminUpdateStatus(b._id, 'cancelled')}
                                  >
                                    Cancel
                                  </button>
                                )}
                                {b.status === 'cancelled' && (
                                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Finalised</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </main>

      {/* ================= MODAL: HOTEL ROOMS SELECTION (GUEST) ================= */}
      {selectedHotel && (
        <div className="modal-overlay" onClick={() => setSelectedHotel(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '720px' }}>
            <div className="modal-header">
              <h2 className="modal-title">{selectedHotel.name}</h2>
              <button className="modal-close" onClick={() => setSelectedHotel(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-hero">
                <img 
                  src={selectedHotel.images[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'} 
                  alt={selectedHotel.name}
                  className="detail-img"
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                <MapPin size={16} color="var(--primary)" />
                <span style={{ fontSize: '14px', fontWeight: '600' }}>
                  {selectedHotel.address}, {selectedHotel.city}, {selectedHotel.country}
                </span>
              </div>

              <p className="detail-desc">{selectedHotel.description}</p>

              <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '8px' }}>Amenities & Comforts</h3>
              <div className="amenity-list">
                {selectedHotel.amenities.map((item, idx) => (
                  <span key={idx} className="amenity-tag">
                    {item}
                  </span>
                ))}
              </div>

              <h3 className="room-section-title">Available Accommodations</h3>

              {loadingRooms ? (
                <div className="loading-box" style={{ padding: '24px' }}>
                  <div className="spinner"></div>
                  <p>Listing available rooms...</p>
                </div>
              ) : rooms.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No rooms are currently configured or available in this hotel.</p>
              ) : (
                <div>
                  {rooms.map((room) => (
                    <div key={room._id} className="room-card">
                      <div className="room-info">
                        <span className="room-title">{room.type} Room (Number {room.roomNumber})</span>
                        <div className="room-capacity">
                          👥 Accommodates up to: {room.capacity} Guest{room.capacity > 1 ? 's' : ''}
                        </div>
                        <div className="room-amenities">
                          {room.amenities.map((am, i) => (
                            <span key={i} style={{ fontSize: '11px', background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                              {am}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="room-price-book">
                        <div className="room-price">${room.pricePerNight} <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)' }}>/ night</span></div>
                        <button 
                          className="room-book-btn"
                          onClick={() => handleOpenBooking(room)}
                          disabled={!room.isAvailable}
                          style={{ opacity: room.isAvailable ? 1 : 0.5, cursor: room.isAvailable ? 'pointer' : 'not-allowed' }}
                        >
                          {room.isAvailable ? 'Book Stay' : 'Booked Out'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: BOOKING FORM (GUEST WITH FACILITIES) ================= */}
      {selectedRoom && selectedHotel && (
        <div className="modal-overlay" onClick={() => setSelectedRoom(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Confirm Reservation Details</h2>
              <button className="modal-close" onClick={() => setSelectedRoom(null)}>
                <X size={20} />
              </button>
            </div>
            <form className="modal-body" onSubmit={handleCreateBooking}>
              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '13px', textTransform: 'uppercase', fontWeight: '700', color: 'var(--primary)' }}>Hotel Selection</span>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>{selectedHotel.name}</h3>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{selectedRoom.type} Room (Room {selectedRoom.roomNumber})</span>
              </div>

              {/* Date selections */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Check-In Date</label>
                  <input 
                    type="date" 
                    required 
                    className="form-input"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Check-Out Date</label>
                  <input 
                    type="date" 
                    required 
                    className="form-input"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                  />
                </div>
              </div>

              {/* Guest details */}
              <div className="form-group">
                <label className="form-label">Primary Guest Name</label>
                <input 
                  type="text" 
                  required 
                  className="form-input"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Guest Email</label>
                  <input 
                    type="email" 
                    required 
                    className="form-input"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Guest Phone</label>
                  <input 
                    type="text" 
                    required 
                    className="form-input"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Total Guest Count</label>
                <select 
                  className="form-input"
                  value={guestCount}
                  onChange={(e) => setGuestCount(Number(e.target.value))}
                >
                  {Array.from({ length: selectedRoom.capacity }, (_, i) => i + 1).map((val) => (
                    <option key={val} value={val}>{val} Guest{val > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>

              {/* EXTRA SURCHARGED FACILITIES SELECTIONS */}
              <div className="facility-title-label">🎒 Optional Upgrade Facilities</div>
              
              <div className="facility-selection-grid">
                <div 
                  className={`facility-tile ${selectedFacilities.includes('Breakfast Buffet') ? 'selected' : ''}`}
                  onClick={() => handleToggleFacility('Breakfast Buffet')}
                >
                  <input 
                    type="checkbox" 
                    checked={selectedFacilities.includes('Breakfast Buffet')}
                    readOnly
                    className="facility-tile-checkbox"
                  />
                  <div className="facility-tile-info">
                    <span className="facility-tile-name">🍳 Breakfast Buffet</span>
                    <span className="facility-tile-price">+$15 / night</span>
                  </div>
                </div>

                <div 
                  className={`facility-tile ${selectedFacilities.includes('Airport Shuttle') ? 'selected' : ''}`}
                  onClick={() => handleToggleFacility('Airport Shuttle')}
                >
                  <input 
                    type="checkbox" 
                    checked={selectedFacilities.includes('Airport Shuttle')}
                    readOnly
                    className="facility-tile-checkbox"
                  />
                  <div className="facility-tile-info">
                    <span className="facility-tile-name">🚌 Airport Shuttle</span>
                    <span className="facility-tile-price">+$25 flat rate</span>
                  </div>
                </div>

                <div 
                  className={`facility-tile ${selectedFacilities.includes('Spa Access') ? 'selected' : ''}`}
                  onClick={() => handleToggleFacility('Spa Access')}
                >
                  <input 
                    type="checkbox" 
                    checked={selectedFacilities.includes('Spa Access')}
                    readOnly
                    className="facility-tile-checkbox"
                  />
                  <div className="facility-tile-info">
                    <span className="facility-tile-name">💆 Ultimate Spa Access</span>
                    <span className="facility-tile-price">+$40 flat rate</span>
                  </div>
                </div>

                <div 
                  className={`facility-tile ${selectedFacilities.includes('Late Check-out') ? 'selected' : ''}`}
                  onClick={() => handleToggleFacility('Late Check-out')}
                >
                  <input 
                    type="checkbox" 
                    checked={selectedFacilities.includes('Late Check-out')}
                    readOnly
                    className="facility-tile-checkbox"
                  />
                  <div className="facility-tile-info">
                    <span className="facility-tile-name">⏰ Late Check-out</span>
                    <span className="facility-tile-price">+$10 flat rate</span>
                  </div>
                </div>
              </div>

              {/* Receipt Summary Box */}
              {calculateNights() > 0 && (
                <div className="booking-summary-box">
                  <h4 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px', color: 'var(--text-primary)' }}>Price Breakdowns</h4>
                  <div className="booking-summary-row">
                    <span>Base Accommodations</span>
                    <span>${selectedRoom.pricePerNight} × {calculateNights()} night{calculateNights() > 1 ? 's' : ''}</span>
                  </div>
                  
                  {selectedFacilities.map(fac => {
                    const facilityPrices: Record<string, number> = {
                      'Breakfast Buffet': 15,
                      'Airport Shuttle': 25,
                      'Spa Access': 40,
                      'Late Check-out': 10
                    };
                    return (
                      <div key={fac} className="booking-summary-row" style={{ color: 'var(--primary)', fontWeight: '500' }}>
                        <span>↳ Upgrade: {fac}</span>
                        <span>+${facilityPrices[fac]}</span>
                      </div>
                    );
                  })}

                  <div className="booking-summary-row total">
                    <span>Grand Total Price</span>
                    <span>${calculateTotalPrice()}</span>
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                className="form-submit"
                disabled={submittingBooking || calculateNights() <= 0}
                style={{ opacity: calculateNights() <= 0 ? 0.6 : 1 }}
              >
                {submittingBooking ? 'Securing Deal...' : 'Confirm & Secure Booking'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD / EDIT HOTEL (ADMIN) ================= */}
      {showHotelModal && (
        <div className="modal-overlay" onClick={() => setShowHotelModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2 className="modal-title">{editingHotel ? 'Edit Property Details' : 'Register New Hotel'}</h2>
              <button className="modal-close" onClick={() => setShowHotelModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form className="modal-body" onSubmit={handleCreateOrUpdateHotel}>
              <div className="form-group">
                <label className="form-label">Hotel Name</label>
                <input 
                  type="text" 
                  required 
                  className="form-input"
                  value={hotelForm.name}
                  onChange={(e) => setHotelForm({ ...hotelForm, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea 
                  required 
                  className="form-input" 
                  rows={3} 
                  style={{ resize: 'vertical' }}
                  value={hotelForm.description}
                  onChange={(e) => setHotelForm({ ...hotelForm, description: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Street Address</label>
                <input 
                  type="text" 
                  required 
                  className="form-input"
                  value={hotelForm.address}
                  onChange={(e) => setHotelForm({ ...hotelForm, address: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input 
                    type="text" 
                    required 
                    className="form-input"
                    value={hotelForm.city}
                    onChange={(e) => setHotelForm({ ...hotelForm, city: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Country</label>
                  <input 
                    type="text" 
                    required 
                    className="form-input"
                    value={hotelForm.country}
                    onChange={(e) => setHotelForm({ ...hotelForm, country: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Base Rate per Night ($)</label>
                  <input 
                    type="number" 
                    required 
                    className="form-input"
                    value={hotelForm.pricePerNight}
                    onChange={(e) => setHotelForm({ ...hotelForm, pricePerNight: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Total Room Inventory</label>
                  <input 
                    type="number" 
                    required 
                    className="form-input"
                    value={hotelForm.totalRooms}
                    onChange={(e) => setHotelForm({ ...hotelForm, totalRooms: Number(e.target.value), availableRooms: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Amenities (Comma separated)</label>
                <input 
                  type="text" 
                  required 
                  className="form-input"
                  placeholder="Wi-Fi, Pool, Gym, Room Service, Spa"
                  value={hotelForm.amenities}
                  onChange={(e) => setHotelForm({ ...hotelForm, amenities: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Images URLs (Comma separated)</label>
                <input 
                  type="text" 
                  required 
                  className="form-input"
                  placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg"
                  value={hotelForm.images}
                  onChange={(e) => setHotelForm({ ...hotelForm, images: e.target.value })}
                />
              </div>

              <button type="submit" className="form-submit">
                {editingHotel ? 'Save Property Changes' : 'Create Hotel Register'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD / EDIT ROOM (ADMIN) ================= */}
      {showRoomModal && (
        <div className="modal-overlay" onClick={() => setShowRoomModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 className="modal-title">{editingRoom ? 'Edit Room Inventory' : 'Register New Accommodation'}</h2>
              <button className="modal-close" onClick={() => setShowRoomModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form className="modal-body" onSubmit={handleCreateOrUpdateRoom}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Room Number</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. 301, 102B"
                    className="form-input"
                    value={roomForm.roomNumber}
                    onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Room Type</label>
                  <select 
                    className="form-input"
                    value={roomForm.type}
                    onChange={(e) => setRoomForm({ ...roomForm, type: e.target.value })}
                  >
                    <option value="Standard">Standard</option>
                    <option value="Deluxe">Deluxe</option>
                    <option value="Suite">Suite Premium</option>
                    <option value="Penthouse">Penthouse Luxe</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nightly Rate ($)</label>
                  <input 
                    type="number" 
                    required 
                    className="form-input"
                    value={roomForm.pricePerNight}
                    onChange={(e) => setRoomForm({ ...roomForm, pricePerNight: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Capacity (Max Guests)</label>
                  <input 
                    type="number" 
                    required 
                    className="form-input"
                    value={roomForm.capacity}
                    onChange={(e) => setRoomForm({ ...roomForm, capacity: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Room Comforts & Amenities (Comma separated)</label>
                <input 
                  type="text" 
                  required 
                  placeholder="AC, Minibar, Balcony, Safe, Kitchenette"
                  className="form-input"
                  value={roomForm.amenities}
                  onChange={(e) => setRoomForm({ ...roomForm, amenities: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="checkbox" 
                  id="roomAvailableCheck"
                  checked={roomForm.isAvailable}
                  onChange={(e) => setRoomForm({ ...roomForm, isAvailable: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="roomAvailableCheck" style={{ fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Available for Reservation
                </label>
              </div>

              <button type="submit" className="form-submit">
                {editingRoom ? 'Save Accommodations' : 'Register Room Accommodation'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: AUTHENTICATIONS ================= */}
      {showAuthModal && (
        <div className="modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h2 className="modal-title">{authMode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
              <button className="modal-close" onClick={() => setShowAuthModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              {/* Quick Login Shortcuts */}
              {authMode === 'login' && (
                <div className="quick-login-box">
                  <div className="quick-login-title">Quick-Access Demo Accounts</div>
                  <div className="quick-login-grid">
                    <button 
                      type="button" 
                      className="quick-login-btn"
                      onClick={() => handleQuickLogin('john@example.com', 'Password123')}
                    >
                      <div className="quick-login-name">John Guest</div>
                      <div className="quick-login-role">guest account</div>
                    </button>
                    <button 
                      type="button" 
                      className="quick-login-btn"
                      onClick={() => handleQuickLogin('admin@example.com', 'AdminPass1')}
                    >
                      <div className="quick-login-name">Jane Admin</div>
                      <div className="quick-login-role">admin account</div>
                    </button>
                  </div>
                </div>
              )}

              {/* Form details */}
              <form onSubmit={authMode === 'login' ? handleLogin : handleRegister}>
                {authMode === 'register' && (
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input 
                      type="text" 
                      required 
                      className="form-input" 
                      placeholder="e.g. John Doe"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                    />
                  </div>
                )}
                
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input 
                    type="email" 
                    required 
                    className="form-input" 
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {authMode === 'register' && (
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input 
                      type="text" 
                      required 
                      className="form-input" 
                      placeholder="+1-555-0199"
                      value={registerPhone}
                      onChange={(e) => setRegisterPhone(e.target.value)}
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input 
                    type="password" 
                    required 
                    className="form-input" 
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <button type="submit" className="form-submit">
                  {authMode === 'login' ? 'Log In' : 'Sign Up'}
                </button>
              </form>

              <div className="toggle-auth-mode">
                {authMode === 'login' ? (
                  <span>Don't have an account? <strong className="toggle-auth-link" onClick={() => setAuthMode('register')}>Sign Up</strong></span>
                ) : (
                  <span>Already have an account? <strong className="toggle-auth-link" onClick={() => setAuthMode('login')}>Log In</strong></span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
