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

// schema joi para envio de token crypto para rota de verificação de e-mail
export const authVerifyEmailTokenSchema = Joi.object({
    token: Joi.string().hex().length(64).required().messages({
        "string.hex": "Verify Email Token must be a hex string",
        "string.length": "Verify Email Token length not valid",
        "any.required": "Verify Email Token is mandatory"
    })
});

// schema joi para rota de reenviar email de verificação receber um e-mail valido
export const authResendVerificationEmailSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'A valid email is required',
        "string.empty": "Email field cannot be blank",     
        'any.required': 'Email is required'
    })
});