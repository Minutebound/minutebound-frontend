const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

const colors ={
        theme: {
          bg: "rgb(var(--theme-bg) / <alpha-value>)",
          surface: "rgb(var(--theme-surface) / <alpha-value>)",
          text: "rgb(var(--theme-text) / <alpha-value>)",
          muted: "rgb(var(--theme-muted) / <alpha-value>)",
          primary: "rgb(var(--theme-primary) / <alpha-value>)",
          secondary: "rgb(var(--theme-secondary) / <alpha-value>)",
          accent: "rgb(var(--theme-accent) / <alpha-value>)",
        },
      };
      
export default config;
