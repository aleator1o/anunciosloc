# 🌐 Configuração para Acessar pela Web

## ⚠️ Importante

Quando você acessa o app pela **web** (navegador), o backend precisa estar rodando na mesma máquina e acessível em `http://localhost:4000`.

## ✅ Configuração

### 1. Iniciar o Backend

**OBRIGATÓRIO:** O backend precisa estar rodando quando você acessa pela web:

```bash
cd backend
npm run dev
```

Você deve ver:
```
🚀 API a correr na porta 4000
📍 Acesse localmente: http://localhost:4000
🌐 Acesse pela rede: http://SEU_IP:4000
```

### 2. Iniciar o Expo

Em outro terminal:

```bash
# Para web
npm run web

# Ou
npx expo start --web
```

### 3. Acessar no Navegador

O Expo abrirá automaticamente no navegador, geralmente em:
```
http://localhost:8081
```

## 🔍 Como Funciona

- **Web**: Usa `http://localhost:4000/api` automaticamente (não precisa configurar `.env`)
- **Android Emulador**: Usa `http://10.0.2.2:4000/api` automaticamente
- **Android Físico**: Precisa configurar `EXPO_PUBLIC_API_URL` no arquivo `.env` com o IP da máquina
- **iOS**: Usa `http://127.0.0.1:4000/api` automaticamente

## 🐛 Problema: "ERR_CONNECTION_REFUSED" na Web

### Causa
O backend não está rodando ou não está acessível em `localhost:4000`.

### Solução

1. **Verificar se o backend está rodando:**
   ```bash
   # Verificar se a porta 4000 está em uso
   netstat -ano | findstr :4000
   ```

2. **Iniciar o backend:**
   ```bash
   cd backend
   npm run dev
   ```

3. **Verificar se está acessível:**
   Abra no navegador: `http://localhost:4000/health`
   
   Deve retornar: `{"status":"ok"}`

4. **Reiniciar o Expo:**
   ```bash
   # Parar o Expo (Ctrl+C)
   # Reiniciar
   npm run web
   ```

## 📝 Notas

- Na **web**, não precisa configurar `EXPO_PUBLIC_API_URL` no arquivo `.env`
- O backend **deve estar rodando** quando você acessa pela web
- Se configurar `EXPO_PUBLIC_API_URL` no `.env`, ele será usado também na web

## 🔄 Diferentes Plataformas

| Plataforma | URL Padrão | Precisa .env? |
|------------|------------|---------------|
| Web | `http://localhost:4000/api` | Não |
| Android Emulador | `http://10.0.2.2:4000/api` | Não |
| Android Físico | `http://10.0.2.2:4000/api` (não funciona) | **Sim** - precisa do IP da máquina |
| iOS | `http://127.0.0.1:4000/api` | Não |

## ✅ Checklist para Web

- [ ] Backend rodando (`npm run dev` no diretório backend)
- [ ] Backend acessível em `http://localhost:4000/health`
- [ ] Expo iniciado com `npm run web`
- [ ] Navegador aberto e funcionando

---

**Dica:** Se você está desenvolvendo e testando em múltiplas plataformas, mantenha o backend rodando sempre que possível.

