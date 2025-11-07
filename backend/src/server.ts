import dotenv from "dotenv";
import app from "./app";

dotenv.config({ path: process.env.NODE_ENV === "production" ? ".env" : undefined });

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.listen(PORT, () => {
  console.log(`🚀 API a correr na porta ${PORT}`);
});

