import asyncHandler from "express-async-handler"

import { User } from "../models/userModel.js"

// importando library de criptografia de senhas
import bcrypt from "bcrypt"

// importando library que cria token
import jwt from "jsonwebtoken"

import crypto from "crypto"; 
import { sendEmail } from "../utils/sendEmail.js"


//@desc Register a user
//@route POST /api/auth/register
//@access public
export const registerUser = asyncHandler(async (req, res) => {

    // passa os dados do request para constantes
    const {username, email, password} = req.body

    // hashing da senha (12 é o numero de salt_rounds (qts vezes o hashing é aplicado))
    const hashedPassword = await bcrypt.hash(password, 10)

    // apesar do mongoose já dar levantar erro se o email já existir no db, é boa pratica usar um tester:
    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }   

    const verificationToken = crypto.randomBytes(32).toString("hex"); // gera um token de verificação de e-mail
    const emailVerificationToken = crypto.createHash("sha256").update(verificationToken).digest("hex"); // faz o hashing do token para proteção

    const emailVerificationTokenExpires = Date.now() + 10 * 60 * 1000 // 10 minutos o token de verificação de e-mail expira

    // Usa o model do mangoose para criar uma row (um objeto) de usuario  (todas essas funções vem diretamente do schema do mangoose, que vem com funções built-in para gerenciar o db)
    const user = await User.create({
        username: username,
        email: email,
        password: hashedPassword,
        emailVerificationToken: emailVerificationToken,
        emailVerificationTokenExpires: emailVerificationTokenExpires,
        lastEmailSentAt: new Date() // gera um limitador para saber a última vez que um e-mail foi enviado
    });
    
    console.log("verification token: ", verificationToken);
    
    if (user) {
        try {
            const verificationURL = `${process.env.WEBSITE_URL}/api/auth/verify-email/${verificationToken}`;

            const message = `Olá ${user.username},\n\n
            Por favor, verifique seu e-mail clicando no seguinte link: 
            \n${verificationURL}\n\n
            Se você não criou esta conta, por favor, ignore este e-mail.`;

            await sendEmail({
                email: user.email,
                subject: 'Verificação de E-mail',
                message: message,
            });

            res.status(201).json({message: "User successfully registered, check you e-mail"});
        } catch (error) {
            await User.findByIdAndDelete(user._id);
            res.status(500);
            throw new Error("Error trying to send e-mail, try again later");
        }
    } else {
        res.status(400)
        throw new Error("User data is not valid")
    }

})

//@desc Verify user email
//@route GET /api/auth/verify-email/:token
//@access public
export const verifyEmail = asyncHandler(async (req, res) => {
    // faz o hashing do token que veio dos params para proteção
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const user = await User.findOne({ // procura no bd se há um usuário com esse token e que não esteja expirado.
        emailVerificationToken: hashedToken,
        emailVerificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) { // se não achar
        res.status(400);
        throw new Error("Invalid or expired Token");
    }

    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationTokenExpires = undefined;
    await user.save();

    res.status(200).json({ message: "E-mail successfully verified" });
});

//@desc Resend verification email
//@route POST /api/auth/resend-verification-email
//@access public
export const resendVerificationEmail = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }

    if (user.isVerified) {
        res.status(400);
        throw new Error("This email was already verified");
    }

    if (user.lastEmailSentAt) { // caso exista uma data para o ultimo envio de email
        const timeSinceLastEmail = Date.now() - user.lastEmailSentAt.getTime();

        const cooldownPeriod = 2 * 60 * 1000; // 60 minutos de cooldown

        if (timeSinceLastEmail < cooldownPeriod) {
            const timeLeft = Math.ceil((cooldownPeriod - timeSinceLastEmail) / 1000);
            res.status(429); 
            throw new Error(`Please, wait more ${timeLeft} seconds before sending another e-mail`);
        }
    }

    // se passou do cooldown, gera e salva um novo token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.emailVerificationToken = crypto.createHash("sha256").update(verificationToken).digest("hex");

    user.emailVerificationTokenExpires = Date.now() + 10 * 60 * 1000; // novo tempo de expiração (10 min)
    user.lastEmailSentAt = new Date(); // atualiza o tempo do último envio

    await user.save();
    console.log("verification token: ", verificationToken);
    // Envia o e-mail
    try {
        const verificationURL = `${process.env.WEBSITE_URL}/api/auth/verify-email/${verificationToken}`;
        const message = `Olá ${user.username},\n\n
        Você solicitou um novo link de verificação. Por favor, clique no link a seguir: 
        \n${verificationURL}\n\nSe você não fez esta solicitação, por favor, ignore este e-mail.`;

        await sendEmail({
            email: user.email,
            subject: 'Novo E-mail de Verificação',
            message,
        });

        res.status(200).json({ message: "New verification e-mail sent" });

    } catch (error) {
        // Importante: Se o envio falhar, não devemos penalizar o usuário.
        // Podemos resetar o `verificationEmailSentAt` para que ele possa tentar de novo imediatamente,
        // ou simplesmente não atualizá-lo até que o e-mail seja enviado com sucesso.
        // A lógica atual já lida com isso, pois o `save()` acontece antes do envio.
        // Se quisermos ser mais robustos, poderíamos fazer o save() depois do sendEmail().
        res.status(500);
        throw new Error("Error re-sending verification e-mail, try again later");
    }
});

//@desc Login a user
//@route POST /api/auth/login
//@access public
export const loginUser = asyncHandler(async (req, res) => {
    // lendo o email e a senha 
    const {email, password, rememberMe} = req.body
    
    // caso não tenha sido preenchido
    if (!email || !password) {
        res.status(400)
        throw new Error("All fields are mandatory")
    }
    // Ver se o usuário está registrado no bd
    const user = await User.findOne({email})

    if (user && !user.isVerified) {
        res.status(401);
        throw new Error("Please, verify e-mail first");
    }

    // caso o usuario esteja correto, e a senha hasheada tambem
    if(user && (await bcrypt.compare(password, user.password))) {

        const accessToken = jwt.sign(
            {
                user: {
                    username: user.username,
                    email: user.email,
                    id: user.id,
                    role: user.role,
                },
                
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "15m" }
        );

        // envia accessToken via cookie seguro
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            // secure true ou false diz se o cookie só podia ser enviado via https ou http; process.env.NODE_ENV === "production" retorna false caso a variavel NODE_ENV em .env seja diff de production   
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax", // impede que o cookie seja enviado por outros sites, se não adicionar isso, é necessáiro usar CORS
            // se rememberMe for true, o cookie dura 7 dias, se for false ele é apagado ao fechar o site
            maxAge: 15 * 60 * 1000, // 8hrs
        });

        // Gera refreshToken (longo)
        const refreshToken = jwt.sign(
            { id: user.id },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: "7d" }
        );

        // Envia refreshToken via cookie seguro
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            // secure true ou false diz se o cookie só podia ser enviado via https ou http; process.env.NODE_ENV === "production"
            // retorna false caso a variavel NODE_ENV em .env seja diff de production   
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            // se rememberMe for true, o cookie dura 7 dias, se for false ele é apagado ao fechar o site
            maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : undefined,
        });


        // passa o user como respossta json
        return res.json({
            message: "User logged in successfully",
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });

    } else {
        res.status(401)
        throw new Error("email or password not valid")
    }
        
})

//@desc Refresh token
//@route POST /api/users/refresh
//@access private
export const refreshToken = asyncHandler(async (req, res) => {
    // lê os cookies que vieram junto c o request
    const cookies = req.cookies;  
    // se não há cookie de refresh, jogan ovo erro
    if (!cookies?.refreshToken) {
        res.status(401);
        throw new Error("No refresh token");
    }

    // salva o token dentro do cookie de refresh na const token
    const token = cookies.refreshToken;
    
    let decoded;
    // é necessário usar try catch porque precisamos do valor de decoded fora da função jwt.verify
    try {
        decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    } catch (err) {
        res.status(403);
        throw new Error("Invalid refresh token or session expired");
    }

    // checa se o usuário não foi deletado do banco de dados, para impedir usuários banidos de usarem o token.
    const user = await User.findById(decoded.id);
    if (!user) {
        res.status(403);
        throw new Error("User no longer exists");
    }

    // caso sim, gera um novo access token
    const newAccessToken = jwt.sign(
        {
            user: {
                username: user.username,
                email: user.email,
                id: user.id,
                role: user.role,
            },
            
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "15m" }
    );

    // envia accessToken via cookie seguro
    res.cookie("accessToken", newAccessToken, {
        httpOnly: true,
        // secure true ou false diz se o cookie só podia ser enviado via https ou http; process.env.NODE_ENV === "production" retorna false caso a variavel NODE_ENV em .env seja diff de production   
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax", // impede que o cookie seja enviado por outros sites, se não adicionar isso, é necessáiro usar CORS
        // se rememberMe for true, o cookie dura 7 dias, se for false ele é apagado ao fechar o site
        maxAge: 15 * 60 * 1000, // 8hrs
    });

    // envia o novo token como resposta
    return res.status(200).json({ message: "Token updated successfully" });
});

//@desc Logout user (clear cookie)
//@route POST /api/users/logout
//@access private
export const logoutUser = asyncHandler(async (req, res) => {

    const cookies = req.cookies;  
    // do not try to logout if there is no cookie
    if (!cookies?.refreshToken && !cookies?.accessToken) {
        res.status(401);
        throw new Error("No refresh token");
    }
    
    // remove o cookie do refresh token (precisa botar as opções originais do cookie criado e o nome, se não não limpa)
    res.clearCookie("refreshToken", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
    });
    // remove o cookie do accessToken
    res.clearCookie("accessToken", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
    });

    // após realizar o log out, é necessário apagar o accessToken pois ele dura até 15min (isso é feito no frontend)
    return res.status(200).json({ message: "Logged out successfully" });
});