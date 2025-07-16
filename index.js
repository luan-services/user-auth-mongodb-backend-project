import express from "express"
import dotenv from "dotenv"

// importando o route de auth
import authRoutes from "./routes/authRoutes.js"
// importa o errorHandler
import { errorHandler } from "./middleware/errorHandler.js"
// importa a função de carregar o bd
import { connectDatabase } from "./config/connectDatabase.js"
// biblioteca de proteção de url
import cors from "cors";
// importa library que manipula cookies
import cookieParser from "cookie-parser"

// carrega as variáveis .env
dotenv.config()

// conectando ao bd
connectDatabase();

// carrega o framework express 
const app = express();

const corsOptions = {
origin: process.env.FRONTEND_ALLOWED_URL ? process.env.FRONTEND_ALLOWED_URL : '*', // Diz ao navegador qual origem específica é permitida.
credentials: true,               // Diz ao navegador que é permitido receber cookies desta origem.
};

// library para selecionar quais endereços no frontend podem enviar requests para o backend, se não usado, o backend só pode ser chamado pela propria origem
app.use(cors(corsOptions));

// process.env."variavel" eh uma variavel nativa do nodejs ja vem pre instalada que pega variaveis do arquivo .env (caso exista)
const port = process.env.PORT || 5000;

// isso é uma função built in do express que possibilita o app de ler objetos .json que vem no BODY de um comando POST
app.use(express.json())
// biblioteca para ler e enviar cookies
app.use(cookieParser());

// route apontando para auth
app.use("/api/auth", authRoutes)

// possibilita de usar a função errorHandler no server toda vez que a função throw new Error() é chamada
app.use(errorHandler)

// inicia o servidor na porta específicada
app.listen(port, () => {
    console.log(`server connected on port ${port}`)
})