import AIrouter from "./AI/AI.routes.js";
import { authRouter } from "./auth/auth.routes.js";
import { categoryRouter } from "./categorty/category.routes.js";
import { transactionsRouter } from "./transactions/transactions.routes.js";
import { itemsRouter } from "./items/items.routes.js";
import { analyticsRouter } from "./analytics/analytics.routes.js";
import { exportRouter } from "./export/export.routes.js";

export const bootstrap = (app) => {
    // Auth routes
    app.use("/auth", authRouter);
    
    // Core routes
    app.use("/category", categoryRouter);
    app.use("/transactions", transactionsRouter);
    app.use("/items", itemsRouter);
    
    // AI routes
    app.use("/ai", AIrouter);
    
    // Analytics & Export routes
    app.use("/analytics", analyticsRouter);
    app.use("/export", exportRouter);
};
