/**
 * @file express.d.ts
 * @description TypeScript type declarations extending the Express Request interface with authenticated user session properties.
 */

import { AuthTokenPayload } from "./user.js";

declare global {
    namespace Express {
        interface Request {
            user?: AuthTokenPayload;
        }
    }
}
