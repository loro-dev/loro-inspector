import { Preview, ReactRenderer } from "@storybook/react";
import { withThemeByClassName } from "@storybook/addon-themes";
import React from "react";
import "../src/index.css";
import { Toaster } from "../src/components/ui/sonner";
import { themes } from "@storybook/theming";

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    docs: {
      theme: themes.dark,
    },
  },
  decorators: [
    withThemeByClassName<ReactRenderer>({
      themes: {
        light: "",
        dark: "dark",
      },
      defaultTheme: "light",
    }),
    (Story) => (
      <>
        <Toaster />
        <Story />
      </>
    ),
  ],
};

export default preview;
