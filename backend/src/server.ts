import dotenv from "dotenv";
import app from "./app";

dotenv.config({ path: process.env.NODE_ENV === "production" ? ".env" : undefined });

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
// Escutar em 0.0.0.0 para aceitar conexões de qualquer interface de rede
const HOST = process.env.HOST || "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`🚀 API a correr na porta ${PORT}`);
  console.log(`📍 Acesse localmente: http://localhost:${PORT}`);
  console.log(`🌐 Acesse pela rede: http://${HOST === "0.0.0.0" ? "SEU_IP" : HOST}:${PORT}`);
  console.log(`📚 Documentação: http://localhost:${PORT}/docs`);
});

