// importa os controllers (funçoes que dizem o que cada route vai fazer)
import { registerUser, loginUser, refreshToken, logoutUser, resendVerificationEmail, verifyEmail, resetPassword, forgotPassword } from "../controllers/authControllers.js"
// importa o middleware de validação do JOI
import { validateJoiSchema } from "../middleware/validateJoiSchema.js";
// importa o schema do JOI
import { authLoginSchema, authRegisterSchema, authResendVerificationEmailSchema, authVerifyEmailTokenSchema, authForgotPasswordSchema, authResetPasswordSchema } from "../models/joi_models/authValidateModel.js";

import { rateLimitHandler } from "../middleware/rateLimitHandler.js" // importando o middleware

import express from "express"

// cria um router do router do express
const router = express.Router();

// seta o endereço do router (a ser adicionado ao endereço principal em server.js) + qual controller vai ser acessado

// função post, que contem: validate() primeiro, joi checa se é um objeto válido para previnir ataques > registerUser depois (direto do mongoose, com validação de db também)
router.post("/register", rateLimitHandler(15 * 60 * 1000, 100), validateJoiSchema(authRegisterSchema, "body"), registerUser) // 5 requisições por hora

// função post que valida apenas alguns dados de login
router.post("/login", rateLimitHandler(15 * 60 * 1000, 10), validateJoiSchema(authLoginSchema, "body"), loginUser) // 10 requisições a cada 15 minutos

// route para verificação de conta por e-mail;
router.get("/verify-email/:token", rateLimitHandler(10 * 60 * 1000, 20), validateJoiSchema(authVerifyEmailTokenSchema, "params"), verifyEmail); // 20 requisições a cada 10 minutos
// route para reenvio do e-mail de verificação
router.post("/resend-verification-email", rateLimitHandler(15 * 60 * 1000, 3), validateJoiSchema(authResendVerificationEmailSchema, "body"), resendVerificationEmail) // 3 requisições a cada 15 minutos

// route para atualizar o token, não precisa de validação JWT nem JOI aqui pois os cookies são lidos em index.js com o cookie parser e validados dentro da funçao
router.post("/refresh", rateLimitHandler(15 * 60 * 1000, 15), refreshToken); // 15 requisições a cada 15 minutos
// route para logout
router.post("/logout", logoutUser);

// rota para solicitar o e-mail de reset
router.post("/forgot-password", rateLimitHandler(15 * 60 * 1000, 3), validateJoiSchema(authForgotPasswordSchema, "body"), forgotPassword); // 3 requisições a cada 15 minutos

// rota para efetivamente resetar a senha, aqui validamos o 'params' para o token e o 'body' para a nova senha
router.post("/reset-password/:token", rateLimitHandler(15 * 60 * 1000, 5), validateJoiSchema(authResetPasswordSchema.extract('token'), "params"), validateJoiSchema(authResetPasswordSchema.extract('password'), "body"), resetPassword); // 5 requisições a cada 15 minutos


export default router





