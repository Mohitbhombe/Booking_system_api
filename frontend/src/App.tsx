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
  Bookmark
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
  user: string;
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
  createdAt: string;
}

function App() {
  // Navigation & View States
  const [activeTab, setActiveTab] = useState<'hotels' | 'bookings'>('hotels');
  
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
  const [submittingBooking, setSubmittingBooking] = useState(false);

  // User Bookings States
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

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
      // Token might be expired, clean it up
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

  // Sync bookings tab when clicked
  useEffect(() => {
    if (activeTab === 'bookings' && user) {
      fetchBookings();
    }
  }, [activeTab, user]);

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
        }
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
        fetchBookings();
      }
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Cancellation failed', 'error');
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
    return nights * selectedRoom.pricePerNight;
  };

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

            {user ? (
              <div className="profile-widget">
                <div className="profile-avatar">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="profile-name">{user.name}</span>
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
      <main className="container" style={{ flex: 1 }}>
        {activeTab === 'hotels' ? (
          <>
            {/* Hero Banner & Fuzzy Search */}
            <section className="hero">
              <span className="hero-tag">Luxurious local getaways await</span>
              <h1>Find Your Perfect Premium Room</h1>
              <p>Explore five-star oceanfront resorts, charming boutique hotels, and rustic ski cabins instantly connected with our reservation system.</p>
              
              <div className="search-container">
                <div className="search-input-wrapper">
                  <Search size={20} className="search-icon" />
                  <input 
                    type="text" 
                    placeholder="Search by hotel name, city (e.g. Miami, London, Singapore), or country..." 
                    className="search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </section>

            {/* Hotel Grid Title */}
            <h2 className="section-title">
              <span>Our Exclusive Stays</span>
              {loadingHotels && <Loader size={20} className="spinner" style={{ margin: 0 }} />}
            </h2>

            {/* Hotel Cards Grid */}
            {loadingHotels && hotels.length === 0 ? (
              <div className="loading-box">
                <div className="spinner"></div>
                <p>Retrieving premium resorts...</p>
              </div>
            ) : hotels.length === 0 ? (
              <div className="loading-box" style={{ padding: '64px 24px' }}>
                <AlertCircle size={40} style={{ marginBottom: '16px', color: 'var(--text-muted)' }} />
                <h3>No hotels found matching your search.</h3>
                <p>Try searching for other terms like 'Miami', 'London', 'UK' or 'Resort'.</p>
              </div>
            ) : (
              <section className="hotel-grid">
                {hotels.map((hotel) => (
                  <div 
                    key={hotel._id} 
                    className="hotel-card" 
                    onClick={() => handleSelectHotel(hotel)}
                  >
                    <img 
                      src={hotel.images[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'} 
                      alt={hotel.name} 
                      className="hotel-card-image"
                    />
                    <div className="hotel-rating-badge">
                      <Star size={14} fill="#fbbf24" color="#fbbf24" />
                      <span>{hotel.rating.toFixed(1)}</span>
                    </div>
                    <div className="hotel-card-content">
                      <div className="hotel-card-location">{hotel.city}, {hotel.country}</div>
                      <h3 className="hotel-card-title">{hotel.name}</h3>
                      <p className="hotel-card-desc">{hotel.description}</p>
                      
                      <div className="hotel-card-footer">
                        <div className="hotel-price">
                          From <span className="hotel-price-num">${hotel.pricePerNight}</span> / night
                        </div>
                        <button className="hotel-card-button">View Rooms</button>
                      </div>
                    </div>
                  </div>
                ))}
              </section>
            )}
          </>
        ) : (
          /* Bookings Dashboard view */
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
                      
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        Reserved under: <strong>{b.guestDetails.name}</strong> • Guests: {b.guestDetails.guestCount}
                      </div>
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
      </main>

      {/* Hotel Rooms Modal */}
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
                        >
                          Book Stay
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

      {/* Booking Form Modal */}
      {selectedRoom && selectedHotel && (
        <div className="modal-overlay" onClick={() => setSelectedRoom(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Confirm Reservation</h2>
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

              {/* Receipt Summary Box */}
              {calculateNights() > 0 && (
                <div className="booking-summary-box">
                  <h4 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px', color: 'var(--text-primary)' }}>Price Summary</h4>
                  <div className="booking-summary-row">
                    <span>Price Per Night</span>
                    <span>${selectedRoom.pricePerNight}</span>
                  </div>
                  <div className="booking-summary-row">
                    <span>Number of Nights</span>
                    <span>{calculateNights()} night{calculateNights() > 1 ? 's' : ''}</span>
                  </div>
                  <div className="booking-summary-row total">
                    <span>Grand Total</span>
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
                {submittingBooking ? 'Reserving...' : 'Confirm & Secure Booking'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Login & Register Modal */}
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
