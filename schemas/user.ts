import { list } from "@keystone-6/core";
import { checkbox, password, text, timestamp } from "@keystone-6/core/fields";

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
    createdAt: timestamp({ defaultValue: { kind: "now" } }),
    isAdmin: checkbox(),
  },
});
