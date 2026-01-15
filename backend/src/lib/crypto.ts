import crypto from "crypto";

/**
 * Gera um par de chaves RSA para assinatura digital
 * @returns Objeto com chave pública e privada (em formato PEM)
 */
export function generateKeyPair(): { publicKey: string; privateKey: string } {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
    },
  });

  return { publicKey, privateKey };
}

/**
 * Assina uma mensagem usando uma chave privada
 * @param message Mensagem a ser assinada
 * @param privateKey Chave privada em formato PEM
 * @returns Assinatura em base64
 */
export function signMessage(message: string, privateKey: string): string {
  const sign = crypto.createSign("SHA256");
  sign.update(message);
  sign.end();
  return sign.sign(privateKey, "base64");
}

/**
 * Verifica a assinatura de uma mensagem
 * @param message Mensagem original
 * @param signature Assinatura em base64
 * @param publicKey Chave pública em formato PEM
 * @returns true se a assinatura é válida
 */
export function verifySignature(message: string, signature: string, publicKey: string): boolean {
  try {
    const verify = crypto.createVerify("SHA256");
    verify.update(message);
    verify.end();
    return verify.verify(publicKey, signature, "base64");
  } catch (error) {
    console.error("[Crypto] Erro ao verificar assinatura:", error);
    return false;
  }
}

/**
 * Criptografa uma chave privada com uma senha
 * @param privateKey Chave privada
 * @param password Senha para criptografar
 * @returns Chave privada criptografada
 */
export function encryptPrivateKey(privateKey: string, password: string): string {
  const algorithm = "aes-256-cbc";
  const key = crypto.scryptSync(password, "salt", 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  
  let encrypted = cipher.update(privateKey, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  return iv.toString("hex") + ":" + encrypted;
}

/**
 * Descriptografa uma chave privada
 * @param encryptedKey Chave privada criptografada
 * @param password Senha usada para criptografar
 * @returns Chave privada descriptografada
 */
export function decryptPrivateKey(encryptedKey: string, password: string): string {
  const algorithm = "aes-256-cbc";
  const key = crypto.scryptSync(password, "salt", 32);
  const [ivHex, encrypted] = encryptedKey.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  
  return decrypted;
}

