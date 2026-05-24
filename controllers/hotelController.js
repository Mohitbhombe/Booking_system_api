const Hotel = require('../models/Hotel');

// @desc    Create new hotel
// @route   POST /api/hotels
// @access  Public (Will restrict in Week 6)
exports.createHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.create(req.body);
    res.status(201).json({
      success: true,
      data: hotel
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all hotels (with search, filter, sort, paginate)
// @route   GET /api/hotels
// @access  Public
exports.getAllHotels = async (req, res, next) => {
  try {
    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude from matching
    const excludeFields = ['select', 'sort', 'page', 'limit', 'search'];
    excludeFields.forEach(param => delete reqQuery[param]);

    // Create query string and parse operators (gte, lte, etc.)
    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    const parsedQuery = JSON.parse(queryStr);

    // Initial query
    let query = Hotel.find(parsedQuery);

    // Fuzzy search by name, city, or country
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query = query.find({
        $or: [
          { name: searchRegex },
          { city: searchRegex },
          { country: searchRegex }
        ]
      });
    }

    // Select Fields
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // Pagination setup
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    
    // Get total matching documents
    const total = await Hotel.countDocuments(query.getFilter());

    query = query.skip(startIndex).limit(limit);

    // Execute query
    const hotels = await query;

    // Pagination results
    const pagination = {};
    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }
    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: hotels.length,
      total,
      pagination,
      data: hotels
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single hotel by ID
// @route   GET /api/hotels/:id
// @access  Public
exports.getHotelById = async (req, res, next) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        error: `Hotel not found with ID of ${req.params.id}`
      });
    }
    res.status(200).json({
      success: true,
      data: hotel
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update hotel by ID
// @route   PUT /api/hotels/:id
// @access  Public (Will restrict in Week 6)
exports.updateHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!hotel) {
      return res.status(404).json({
        success: false,
        error: `Hotel not found with ID of ${req.params.id}`
      });
    }
    res.status(200).json({
      success: true,
      data: hotel
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete hotel by ID
// @route   DELETE /api/hotels/:id
// @access  Public (Will restrict in Week 6)
exports.deleteHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.findByIdAndDelete(req.params.id);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        error: `Hotel not found with ID of ${req.params.id}`
      });
    }
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};
