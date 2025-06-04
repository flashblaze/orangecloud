export default {
  plugins: {
    autoprefixer: {},
    "postcss-preset-mantine": {},
    "postcss-simple-vars": {
      variables: {
        "mantine-breakpoint-xs": "22.5em",
        "mantine-breakpoint-sm": "40em",
        "mantine-breakpoint-md": "48em",
        "mantine-breakpoint-lg": "64em",
        "mantine-breakpoint-xl": "80em",
      },
    },
  },
};
