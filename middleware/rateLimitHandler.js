import rateLimit from "express-rate-limit";

export const rateLimitHandler = (time, limit) => {
    return rateLimit({
    windowMs: time, // seta a janela de tempo
    max: limit, // limita cada IP a x requisições por janela
    message: {
        status: 429,
        message: "Too many requests! Try again later",
    },
    standardHeaders: true, // inclui rate limit nos headers
    legacyHeaders: false, // desativa os headers 'X-RateLimit-*'
});
}
