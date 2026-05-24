let specs = {
  openapi: '3.0.0',
  info: {
    title: 'Hotel Booking System API',
    version: '1.0.0',
    description: 'API documentation for the Hotel Booking System (Week 7)'
  },
  servers: [{ url: '/api/v1', description: 'API v1 base path' }],
  paths: {}
};

try {
  const swaggerJsdoc = require('swagger-jsdoc');
  const options = {
    definition: specs,
    apis: ['./routes/*.js', './controllers/*.js', './models/*.js']
  };
  specs = swaggerJsdoc(options);
} catch (err) {
  // swagger-jsdoc or dependencies not installed in test environment; export minimal spec
  console.warn('swagger-jsdoc not available; serving minimal OpenAPI spec');
}

module.exports = specs;
