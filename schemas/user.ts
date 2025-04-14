import { list } from "@keystone-6/core";
import { text } from "@keystone-6/core/fields";

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
  },
});
