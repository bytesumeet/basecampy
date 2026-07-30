const PORT = process.env.PORT || 8000;
const CORS_ORIGIN = process.env.CORS_ORIGIN?.split(",") || "*";
export { PORT, CORS_ORIGIN };
