import { list } from "@keystone-6/core";
import { checkbox, password, relationship, text, timestamp } from "@keystone-6/core/fields";

export const User = list({
  access: {
    operation: {
      query: () => true,
      create: () => true,
      update: ({ session }) => true,
      delete: ({ session }) => true,
    },
  },
  fields: {
    name: text({ validation: { isRequired: true } }),
    email: text({ validation: { isRequired: true }, isIndexed: "unique" }),
    password: password(),
    favoritePodcasts: relationship({ ref: "Podcast.favoritedBy", many: true }),
    createdAt: timestamp({ defaultValue: { kind: "now" } }),
    isAdmin: checkbox(),
  },
});
