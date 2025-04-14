import { config } from "@keystone-6/core";
import { withAuth, session } from "./auth";
import { User } from "./schemas/user";
import { Artist } from "./schemas/artist";
import { Podcast } from "./schemas/podcast";
import { extendGraphqlSchema } from "./schemas/extend";

export default withAuth(
  config({
    db: {
      provider: "sqlite",
      url: "file:./db.sqlite",
    },
    lists: { User, Artist, Podcast },
    session,
    ui: {
      isAccessAllowed: ({ session }) => {
        return !!session?.data?.isAdmin;
      },
    },
    graphql: {
      extendGraphqlSchema: extendGraphqlSchema,
    },
  })
);
