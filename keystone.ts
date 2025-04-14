import { config } from "@keystone-6/core";
import { withAuth, session } from "./auth";
import { User } from "./schemas/user";

export default withAuth(
  config({
    db: {
      provider: "sqlite",
      url: "file:./db.sqlite",
    },
    lists: { User },
    session,
    ui: {
      isAccessAllowed: ({ session }) => {
        return !!session?.data?.isAdmin;
      },
    },
  })
);
