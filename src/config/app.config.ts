export const config = () => ({
    port: +process.env.PORT || 80,
    httpTimeout: +process.env.HTTP_TIMEOUT || 10000,
    httpMaxRedirects: +process.env.HTTP_MAX_REDIRECTS || 3,
    executionRetries: +process.env.EXECUTION_RETRIES || 2,
    executionBaseDelay: +process.env.EXECUTION_BASE_DELAY || 1000,
    
    dbHost: process.env.DB_HOST,
    dbPort: +process.env.DB_PORT || 3306,
    dbUsername: process.env.DB_USERNAME,
    dbPassword: process.env.DB_PASSWORD,
    dbName: process.env.DB_NAME,
    dbDefaultLimit: +process.env.DB_DEFAULT_LIMIT || 1000
  })