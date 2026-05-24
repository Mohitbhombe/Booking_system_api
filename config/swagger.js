const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Hotel Booking System API',
      version: '1.0.0',
      description: 'API documentation for the Hotel Booking System (Week 7)'
    },
    servers: [
      { url: '/api/v1', description: 'API v1 base path' }
    ]
  },
  // Paths to files with OpenAPI annotations
  apis: ['./routes/*.js', './controllers/*.js', './models/*.js']
};

const specs = swaggerJsdoc(options);

module.exports = specs;
