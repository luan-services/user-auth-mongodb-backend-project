// importa os controllers (funçoes que dizem o que cada route vai fazer)
import { registerUser, loginUser, refreshToken, logoutUser, resendVerificationEmail, verifyEmail } from "../controllers/authControllers.js"
// importa o middleware de validação do JOI
import { validateJoiSchema } from "../middleware/validateJoiSchema.js";
// importa o schema do JOI
import { authLoginSchema, authRegisterSchema, authResendVerificationEmailSchema, authVerifyEmailTokenSchema } from "../models/joi_models/authValidateModel.js";

import express from "express"

// cria um router do router do express
const router = express.Router();

// seta o endereço do router (a ser adicionado ao endereço principal em server.js) + qual controller vai ser acessado

// função post, que contem: validate() primeiro, joi checa se é um objeto válido para previnir ataques > registerUser depois (direto do mongoose, com validação de db também)
router.post("/register", validateJoiSchema(authRegisterSchema, "body"), registerUser)
// função post que valida apenas alguns dados de login
router.post("/login", validateJoiSchema(authLoginSchema, "body"), loginUser)

// route para verificação de conta por e-mail;
router.get("/verify-email/:token", validateJoiSchema(authVerifyEmailTokenSchema, "params"), verifyEmail);
// route para reenvio do e-mail de verificação
router.post("/resend-verification-email", validateJoiSchema(authResendVerificationEmailSchema, "body"), resendVerificationEmail)

// route para atualizar o token, não precisa de validação JWT nem JOI aqui pois os cookies são lidos em index.js com o cookie parser e validados dentro da funçao
router.post("/refresh", refreshToken);
// route para logout
router.post("/logout", logoutUser);

export default router





