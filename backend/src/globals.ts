import { User } from "./modules/auth/types.auth";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
