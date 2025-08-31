import Joi from "joi"

// define o schema de validação para registro
export const authRegisterSchema = Joi.object({
    username: Joi.string().max(12).required().messages({
        'string.empty': 'Name is required', // mensagens custom para cada erro, se não adicionadas, o joi lança mensagens padrao
        'any.required': 'Name is required',
        'string.max': 'Name must be at most {#limit} characters'
    }),
    email: Joi.string().email().required().messages({
        'string.email': 'A valid email is required',
        'any.required': 'Email is required'
    }),
    password: Joi.string().min(8).max(60).required().messages({
        'string.empty': 'Password is required',
        'any.required': 'Password is required',
        'string.min': 'Password must be at least {#limit} characters',
        'string.max': 'Password must be at maximum {#limit} characters'
    }),
});

// define o schema de validação para login, inclui campo 'rememberMe' para decidir se o usuário quer manter a sessão p sempre ou apenas até fechar a página
export const authLoginSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'A valid email is required',
        'any.required': 'Email is required'
    }),
    password: Joi.string().min(8).max(60).required().messages({
        'string.empty': 'Phone is required',
        'any.required': 'Phone is required',
        'string.min': 'Password must be at least {#limit} characters',
        'string.max': 'Password must be at maximum {#limit} characters'
    }),
    rememberMe: Joi.boolean().required().messages({
        "boolean.base": `"rememberMe" must be a boolean value (true or false).`,
        "any.required": `"rememberMe" is required.`
    })
});

export const tokenVerificationSchema = Joi.object({
    // Estamos validando 'token', que é o nome do parâmetro na rota
    token: Joi.string()
               .hex() // Garante que a string contém apenas caracteres hexadecimais
               .length(64) // Nosso token original tem 64 caracteres (crypto.randomBytes(32).toString('hex'))
               .required()
               .messages({
                   "string.hex": "O token de verificação deve ser uma string hexadecimal.",
                   "string.length": "O token de verificação possui um formato inválido.",
                   "any.required": "O token de verificação é obrigatório."
               })
});

// schema joi para controller de reenviar email de verificação
export const resendVerificationEmailSchema = Joi.object({
    email: Joi.string().email().required().messages({
        "string.email": "O e-mail deve ser um endereço válido.",
        "string.empty": "O campo de e-mail não pode estar vazio.",
        "any.required": "O campo de e-mail é obrigatório."
    })
});