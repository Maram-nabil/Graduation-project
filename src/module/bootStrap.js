import AIrouter from "./AI/AI.routes.js";
import { authRouter } from "./auth/auth.routes.js";
import { categoryRouter } from "./categorty/category.routes.js";
import { transactionsRouter } from "./transactions/transactions.routes.js";

export const bootstrap = (app) => {

    app.use("/auth", authRouter);
    app.use("/category", categoryRouter);
    app.use("/transactions", transactionsRouter);
    app.use("/ai", AIrouter);
};
