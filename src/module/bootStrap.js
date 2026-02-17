import { authRouter } from "./auth/auth.routes.js";
import { categoryRouter } from "./categorty/category.routes.js";
import { transactionsRouter } from "./transactions/transactions.routes.js";
import { itemsRouter } from "./items/items.routes.js";
import { analyticsRouter } from "./analytics/analytics.routes.js";
import { exportRouter } from "./export/export.routes.js";
import { offerRouter, adminOffersRouter } from "./offers/offer.routes.js";

export const bootstrap = (app) => {
    // Auth routes
    app.use("/auth", authRouter);
    
    // Core routes
    app.use("/category", categoryRouter);
    app.use("/transactions", transactionsRouter);
    app.use("/items", itemsRouter);
    
    // Analytics & Export routes
    app.use("/analytics", analyticsRouter);
    app.use("/export", exportRouter);
    
    // Offers (personalized)
    app.use("/offers", offerRouter);
    
    // Admin: offers CRUD
    app.use("/admin/offers", adminOffersRouter);
};
